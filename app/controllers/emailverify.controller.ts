import { Request, Response } from 'express';
import { deleteEmailVerificationToken, findEmailVerificationToken, saveEmailVerificationToken } from '../models/email.model.js';
import { verifyUserEmail } from '../models/user.model.js';
import { createEmailVerificationToken } from './auth.controller.js';
import { findUserById } from '../models/user.model.js';
import { getVerificationEmailTemplate } from './auth.controller.js';
import sendResendEmail from '../utils/resendmail.utils.js';
import { BACKEND_CLIENT_URL } from '../config/env.js';

const getBackendBaseUrl = () => (BACKEND_CLIENT_URL ?? '').replace(/\/+$/, '');

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = typeof req.query.token === 'string' ? req.query.token : undefined;

        if (!token) {
            res.status(400).json({
                message: 'Verification token is required',
            });
            return;
        }

        const tokenRecord = await findEmailVerificationToken(token);

        if (!tokenRecord) {
            res.status(400).json({
                message: 'Invalid or expired verification token',
            });
            return;
        }

        if (tokenRecord.expiresAt < new Date()) {
            await deleteEmailVerificationToken(tokenRecord.userId);
            res.status(400).json({
                message: 'Verification token has expired',
            });
            return;
        }

        await verifyUserEmail(tokenRecord.userId);
        await deleteEmailVerificationToken(tokenRecord.userId);

        res.status(200).json({
            message: 'Email verified successfully',
        });
    } catch (err) {
        console.error('Email verification error:', err);
        res.status(500).json({
            message: 'Internal server error email verification',
        });
    }
};


export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> =>{
    try{
        const user= await findUserById((req as any).userId as string);
        if(!user){
            res.status(404).json({
                message:"User not found"
            });
            return;
        }
        if(user.isVerified){
            res.status(400).json({
                message:"Email is already verified"
            });
            return;
        }
        await deleteEmailVerificationToken(user.id);
        const newToken = await createEmailVerificationToken();
        await saveEmailVerificationToken({
            userId: user.id,
            token: newToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        const verificationUrl = `${getBackendBaseUrl()}/api/auth/verify-email?token=${newToken}`;
        const template= getVerificationEmailTemplate(user.name ?? "there",verificationUrl);
        res.status(200).json({
            message: 'Verification email sent successfully',
        })
        setImmediate(async () => {
            try {
                await sendResendEmail(
                    user.email,
                    'Verify your Korix email',
                    template
                );
                console.log(`Verification email sent to ${user.email}`);
            } catch (error) {
                console.error(`Failed to send verification email to ${user.email}:`, error);
            }
        });
    }catch(err){
        console.error('Resend verification email error:', err);
        res.status(500).json({
            message: 'Internal server error resend verification email',
        });
    }
}
