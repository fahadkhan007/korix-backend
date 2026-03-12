import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserById } from '../models/user.model.js';
import { JWT_SECRET, JWT_REFRESH_SECRET, BACKEND_CLIENT_URL } from '../config/env.js';
import redisClient from '../database/redis.js';
import { prisma } from '../database/database.js';
import sendEmail from '../utils/sendmail.utils.js';
import { saveEmailVerificationToken, deleteEmailVerificationToken } from '../models/email.model.js';
import crypto from 'crypto';


const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false, 
    sameSite: 'strict' as const,
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

const getVerificationEmailTemplate = (name: string, verificationUrl: string) => `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="background:#ffffff; padding:30px; border-radius:8px; max-width:500px; margin:auto;">
      <h2>Verify your email</h2>
      <p>Hi ${name},</p>
      <p>Click the button below to verify your Korix account.</p>
      <p style="margin: 24px 0;">
        <a
          href="${verificationUrl}"
          style="background:#111827; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:6px; display:inline-block;"
        >
          Verify Email
        </a>
      </p>
      <p>If the button does not work, use this link:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    </div>
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

        // Atomically create user + personal workspace
        const { user, personalOrg } = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { email, name, password: hashedPassword },
                select: { id: true, email: true, name: true, role: true, createdAt: true },
            });

            const slug = `personal-${user.id}`;
            const personalOrg = await tx.organisation.create({
                data: {
                    name: `${name}'s Workspace`,
                    slug,
                    isPersonal: true,
                    ownerId: user.id,
                    members: {
                        create: { userId: user.id, role: 'OWNER' },
                    },
                },
            });

            return { user, personalOrg };
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

        const verificationUrl = `${BACKEND_CLIENT_URL}/verify-email?token=${emailToken}`;

        res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
        res.status(201).json({
            message: 'Account created successfully',
            accessToken,
            user,
            personalOrg,
        });

        setImmediate(async () => {
            try {
                await sendEmail(
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
