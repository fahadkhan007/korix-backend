import crypto from "crypto";
import { prisma } from "../database/database.js";
import { InviteStatus, ProjectRole } from "../generated/prisma/enums.js";

export const createProjectInvite = async (data: {
    projectId: string;
    email: string;
    role: ProjectRole;
    tokenHash: string;
    invitedById: string;
    expiresAt: Date;
}) => {
    return prisma.projectInvite.create({ data });
};

export const findProjectInviteByToken = async (tokenHash: string) => {
    return prisma.projectInvite.findUnique({
        where: { tokenHash },
    });
};

export const updateProjectInviteStatus = async (id: string, status: InviteStatus) => {
    return prisma.projectInvite.update({
        where: { id },
        data: { status },
    });
};

export const findPendingInvite = async (projectId: string, email: string) => {
    return prisma.projectInvite.findFirst({
        where: {
            projectId,
            email,
            status: 'PENDING',
            expiresAt: { gt: new Date() }
        }
    });
};