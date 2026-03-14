import { prisma } from '../database/database.js';
import { ConversationType, ProjectRole } from '../generated/prisma/enums.js';

export const createProject = async (data: {
    name: string;
    description?: string;
    parentId?: string;
    createdById: string;
}) => {
    return prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
            data: {
                name: data.name,
                description: data.description,
                parentId: data.parentId,
                createdById: data.createdById,
            },
        });

        await tx.projectMember.create({
            data: {
                projectId: project.id,
                userId: data.createdById,
                role: ProjectRole.ADMIN,
            },
        });

        await tx.conversation.create({
            data: {
                projectId: project.id,
                name: 'General',
                type: ConversationType.PROJECT,
            },
        });

        return project;
    });
};

export const findProjectById = async (id: string) => {
    return prisma.project.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true,
            parentId: true,
            createdById: true,
            createdAt: true,
            updatedAt: true,
            members: {
                select: {
                    id: true,
                    role: true,
                    createdAt: true,
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
        },
    });
};

export const findProjectsByUser = async (userId: string) => {
    return prisma.project.findMany({
        where: {
            members: { some: { userId } },
            parentId: null,
        },
        select: {
            id: true,
            name: true,
            description: true,
            createdById: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
};

export const findMemberRole = async (projectId: string, userId: string) => {
    const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
        select: { role: true },
    });
    return member?.role ?? null;
};

export const addProjectMember = async (data: {
    projectId: string;
    userId: string;
    role: ProjectRole;
}) => {
    return prisma.projectMember.create({
        data,
        select: {
            id: true,
            role: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true } },
        },
    });
};

export const updateProjectMemberRole = async (data: {
    projectId: string;
    userId: string;
    role: ProjectRole;
}) => {
    return prisma.projectMember.update({
        where: { projectId_userId: { projectId: data.projectId, userId: data.userId } },
        data: { role: data.role },
        select: {
            id: true,
            role: true,
            user: { select: { id: true, name: true, email: true } },
        },
    });
};

export const removeProjectMember = async (projectId: string, userId: string) => {
    return prisma.projectMember.delete({
        where: { projectId_userId: { projectId, userId } },
    });
};

export const findSubProjects = async (parentId: string) => {
    return prisma.project.findMany({
        where: { parentId },
        select: {
            id: true,
            name: true,
            description: true,
            createdById: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
    });
};
