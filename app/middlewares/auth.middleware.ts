import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

interface JwtPayload {
    userId: string;
}

// Reads the short-lived access token from the Authorization header
// Expected format: "Authorization: Bearer <accessToken>"
export const protect = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1]; // "Bearer <token>"

        if (!token) {
            res.status(401).json({ message: 'Unauthorized: No token provided' });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;
        (req as any).userId = decoded.userId;

        next();
    } catch {
        res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
};
