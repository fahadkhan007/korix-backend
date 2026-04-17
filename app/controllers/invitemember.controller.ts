import { Request, Response } from "express";
import { ProjectRole } from "../generated/prisma/enums.js";
import { findUserByEmail, findUserById } from "../models/user.model.js";
import { createProjectInvite, findPendingInvite, findProjectInviteByToken, updateProjectInviteStatus } from "../models/inviteemail.model.js";
import crypto from "crypto";
import { findProjectById } from "../models/project.model.js";
import { findMemberRole, addProjectMember } from "../models/project.model.js";
import sendResendEmail from "../utils/resendmail.utils.js";
import getInviteTemplate from "../templates/invitetemplate.js";
import getRegisterInviteTemplate from "../templates/register.invite.js";
import { FRONTEND_CLIENT_URL } from "../config/env.js";

export const inviteMemberController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params as Record<string, string>;
        const { email, role } = req.body as { email: string; role: ProjectRole };
        const invitedById = (req as any).userId as string;

        const validRoles = [ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER];
        if (!email || !role || !validRoles.includes(role)) {
            res.status(400).json({ message: 'Valid email and role (ADMIN, MEMBER, VIEWER) are required' });
            return;
        }

        const project = await findProjectById(projectId);
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        const pending = await findPendingInvite(projectId, email);
        if (pending) {
            res.status(409).json({ message: 'An invite is already pending for this email' });
            return;
        }

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            const existingMemberRole = await findMemberRole(projectId, existingUser.id);
            if (existingMemberRole) {
                res.status(409).json({ message: 'User is already a member of this project' });
                return;
            }
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await createProjectInvite({
            projectId,
            email,
            role,
            tokenHash,
            invitedById,
            expiresAt
        });

        const baseUrl = (FRONTEND_CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

        if (!existingUser) {
            const inviteUrl = `${baseUrl}/register?token=${rawToken}`;
            const htmlContent = getRegisterInviteTemplate(email.split('@')[0], project.name, inviteUrl);
            sendResendEmail(email, `Please register your account to join ${project.name} on Korix!`, htmlContent)
                .catch((err) => console.error('Failed to send invite email asynchronously:', err));
        } else {
            const inviteeName = (existingUser && existingUser.name) ? existingUser.name : email.split('@')[0];
            const inviteUrl = `${baseUrl}/projects/join?token=${rawToken}`;
            const htmlContent = getInviteTemplate(inviteeName, project.name, inviteUrl);
            sendResendEmail(email, `Invitation to join ${project.name} on Korix!`, htmlContent)
                .catch((err) => console.error('Failed to send invite email asynchronously:', err));
        }

        res.status(201).json({ message: 'Invitation sent successfully' });
    } catch (err) {
        console.error('inviteMemberController error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const acceptProjectInviteController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body as { token: string };
        const userId = (req as any).userId as string;

        if (!token) {
            res.status(400).json({ message: 'Token is required' });
            return;
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const invite = await findProjectInviteByToken(tokenHash);

        if (!invite) {
            res.status(404).json({ message: 'Invalid or expired invitation' });
            return;
        }

        if (invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
            res.status(400).json({ message: 'Invitation is no longer valid or has expired' });
            return;
        }

        const user = await findUserById(userId);
        if (!user || user.email !== invite.email) {
            res.status(403).json({ message: 'This invitation is not for your current email address' });
            return;
        }

        const existingRole = await findMemberRole(invite.projectId, user.id);
        if (existingRole) {
            await updateProjectInviteStatus(invite.id, 'ACCEPTED');
            res.status(409).json({ message: 'You are already a member of this project' });
            return;
        }

        await addProjectMember({
            projectId: invite.projectId,
            userId: user.id,
            role: invite.role as ProjectRole
        });

        await updateProjectInviteStatus(invite.id, 'ACCEPTED');

        res.status(200).json({ message: 'Successfully joined the project', projectId: invite.projectId });
    } catch (err) {
        console.error('acceptProjectInvite error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
