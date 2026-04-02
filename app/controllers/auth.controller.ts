import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserById } from '../models/user.model.js';
import { JWT_SECRET, JWT_REFRESH_SECRET, BACKEND_CLIENT_URL } from '../config/env.js';
import redisClient from '../database/redis.js';
import { prisma } from '../database/database.js';
import sendResendEmail from '../utils/resendmail.utils.js';
import { saveEmailVerificationToken, deleteEmailVerificationToken } from '../models/email.model.js';
import crypto from 'crypto';


const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};


const generateAccessToken = (userId: string): string =>
    jwt.sign({ userId }, JWT_SECRET!, { expiresIn: '15m' });

const generateRefreshToken = (userId: string): string =>
    jwt.sign({ userId }, JWT_REFRESH_SECRET!, { expiresIn: '7d' });

const refreshKey = (userId: string) => `refresh:${userId}`;

export const createEmailVerificationToken = async () =>{
    const token = crypto.randomBytes(32).toString('hex');
    return token;
}

export const getVerificationEmailTemplate = (name: string, verificationUrl: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Verify your email</title>
</head>

<body style="margin:0; padding:0; background:#f5f7fb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">

        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; padding:40px; box-shadow:0 4px 20px rgba(0,0,0,0.05);">

          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h1 style="margin:0; font-size:26px; color:#111827;">Korix</h1>
              <p style="margin:6px 0 0; color:#6b7280; font-size:14px;">
                Project Management & Collaboration
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:10px;">
              <h2 style="color:#111827; font-size:20px; margin-bottom:10px;">
                Verify your email
              </h2>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                Hi <strong>${name}</strong>,
              </p>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                Welcome to <strong>Korix</strong>. Please confirm your email address to activate your account and start managing your projects with your team.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:30px 0;">
              <a
                href="${verificationUrl}"
                style="
                  background:#4f46e5;
                  color:#ffffff;
                  text-decoration:none;
                  padding:14px 26px;
                  font-size:15px;
                  border-radius:8px;
                  font-weight:600;
                  display:inline-block;
                "
              >
                Verify Email
              </a>
            </td>
          </tr>

          <tr>
            <td>
              <p style="color:#6b7280; font-size:14px;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>

              <p style="word-break:break-all;">
                <a href="${verificationUrl}" style="color:#4f46e5; font-size:13px;">
                  ${verificationUrl}
                </a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:30px; border-top:1px solid #e5e7eb;">
              <p style="font-size:12px; color:#9ca3af; line-height:1.5;">
                If you didn’t create a Korix account, you can safely ignore this email.
              </p>

              <p style="font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} Korix. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;


export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, name, password } = req.body as {
            email: string;
            name: string;
            password: string;
        };

        if (!email || !name || !password) {
            res.status(400).json({ message: 'Email, name and password are required' });
            return;
        }

        const existing = await findUserByEmail(email);
        if (existing) {
            res.status(409).json({ message: 'An account with this email already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: { email, name, password: hashedPassword },
            select: { id: true, email: true, name: true, isVerified: true, createdAt: true },
        });

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        await redisClient.set(refreshKey(user.id), refreshToken, { EX: 604800 });

        await deleteEmailVerificationToken(user.id);
        const emailToken = await createEmailVerificationToken();
        await saveEmailVerificationToken({
            userId: user.id,
            token: emailToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        const verificationUrl = `${BACKEND_CLIENT_URL}/api/auth/verify-email?token=${emailToken}`;

        res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
        res.status(201).json({
            message: 'Account created successfully',
            accessToken,
            user,
        });

        setImmediate(async () => {
            try {
                await sendResendEmail(
                    user.email,
                    'Verify your Korix email',
                    getVerificationEmailTemplate(user.name ?? 'there', verificationUrl),
                );
                console.log(`Verification email sent to ${user.email}`);
            } catch (error) {
                console.error(`Failed to send verification email to ${user.email}:`, error);
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body as { email: string; password: string };

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const user = await findUserByEmail(email);
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);


        await redisClient.set(refreshKey(user.id), refreshToken, { EX: 604800 });

        res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            message: 'Login successful',
            accessToken,
            user: userWithoutPassword,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = (req.cookies as Record<string, string | undefined>)?.refresh_token;

        if (!token) {
            res.status(401).json({ message: 'No refresh token provided' });
            return;
        }

        const decoded = jwt.verify(token, JWT_REFRESH_SECRET!) as { userId: string };

        const stored = await redisClient.get(refreshKey(decoded.userId));
        if (!stored || stored !== token) {
            res.status(401).json({ message: 'Refresh token is invalid or has been revoked' });
            return;
        }

        // Rotate: issue a fresh refresh token and update Redis
        const newAccessToken = generateAccessToken(decoded.userId);
        const newRefreshToken = generateRefreshToken(decoded.userId);

        await redisClient.set(refreshKey(decoded.userId), newRefreshToken, { EX: 604800 });
        res.cookie('refresh_token', newRefreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
        console.error('Refresh error:', err);
        res.status(401).json({ message: 'Unauthorized: Invalid or expired refresh token' });
    }
};

export const profile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await findUserById((req as any).userId as string);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({ user });
    } catch (err) {
        console.error('Profile error:', err);
        if (res.headersSent) {
            return;
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId as string;
        await redisClient.del(refreshKey(userId));

        res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
