import { Request, Response } from 'express';
import { deleteEmailVerificationToken, findEmailVerificationToken } from '../models/email.model.js';
import { verifyUserEmail } from '../models/user.model.js';

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
