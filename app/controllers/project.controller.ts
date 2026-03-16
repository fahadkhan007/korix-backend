import { Request, Response } from 'express';
import { ProjectRole } from '../generated/prisma/enums.js';
import {
    createProject,
    findProjectById,
    findProjectsByUser,
    findMemberRole,
    addProjectMember,
    updateProjectMemberRole,
    removeProjectMember,
    findSubProjects,
} from '../models/project.model.js';
import { findUserById } from '../models/user.model.js';

export const createProjectController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId as string;
        const { name, description } = req.body as {
            name: string;
            description?: string;
        };

        if (!name) {
            res.status(400).json({ message: 'Project name is required' });
            return;
        }

        const project = await createProject({ name, description, createdById: userId });

        res.status(201).json({ message: 'Project created successfully', project });
    } catch (err) {
        console.error('createProject error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createSubProjectController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId as string;
        const { projectId: parentId } = req.params as Record<string, string>;
        const { name, description } = req.body as {
            name: string;
            description?: string;
        };

        if (!name) {
            res.status(400).json({ message: 'Sub-project name is required' });
            return;
        }

        const project = await createProject({ name, description, parentId, createdById: userId });

        res.status(201).json({ message: 'Sub-project created successfully', project });
    } catch (err) {
        console.error('createSubProject error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getProjectByIdController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params as Record<string, string>;
        const project = await findProjectById(projectId);

        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        res.status(200).json({ project });
    } catch (err) {
        console.error('getProjectById error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getProjectsByUserController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId as string;
        const projects = await findProjectsByUser(userId);

        res.status(200).json({ projects });
    } catch (err) {
        console.error('getProjectsByUser error:', err);
        if (res.headersSent) {
            return;
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMemberRoleController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params as Record<string, string>;
        const userId = (req as any).userId as string;
        const role = await findMemberRole(projectId, userId);

        if (!role) {
            res.status(404).json({ message: 'Member not found' });
            return;
        }

        res.status(200).json({ role });
    } catch (err) {
        console.error('getMemberRole error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const updateProjectMemberRoleController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params as Record<string, string>;
        const { userId: targetUserId, role } = req.body as { userId: string; role: ProjectRole };
        const validRoles = [ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER];
        if (!targetUserId || !role || !validRoles.includes(role)) {
            res.status(400).json({ message: 'Valid userId and role (ADMIN, MEMBER, VIEWER) are required' });
            return;
        }
        const member = await updateProjectMemberRole({ projectId, userId: targetUserId, role });
        res.status(200).json({ message: 'Member role updated successfully', member });
    } catch (err) {
        console.error('updateProjectMemberRole error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const getSubProjectsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params as Record<string, string>;
        const subProjects = await findSubProjects(projectId);
        res.status(200).json({ subProjects });
    } catch (err) {
        console.error('getSubProjects error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
