import { Request, Response, NextFunction } from 'express';
import { ProjectRole } from '../generated/prisma/enums.js';
import { findMemberRole } from '../models/project.model.js';

export const requireProjectRole = (...allowedRoles: ProjectRole[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = (req as any).userId as string;
            const { projectId } = req.params as Record<string, string>;

            if (!projectId) {
                res.status(400).json({ message: 'Project ID is required' });
                return;
            }

            const role = await findMemberRole(projectId, userId);

            if (!role) {
                res.status(403).json({ message: 'You are not a member of this project' });
                return;
            }

            if (!allowedRoles.includes(role)) {
                res.status(403).json({ message: 'You do not have permission to perform this action' });
                return;
            }

            (req as any).projectRole = role;
            next();
        } catch (err) {
            console.error('requireProjectRole error:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};
