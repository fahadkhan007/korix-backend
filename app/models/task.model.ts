import { prisma } from '../database/database.js';
import { TaskPriority, TaskStatus } from '../generated/prisma/enums.js';

const taskSelect = {
    id: true,
    title: true,
    description: true,
    status: true,
    priority: true,
    dueDate: true,
    projectId: true,
    assigneeId: true,
    reporterId: true,
    createdAt: true,
    updatedAt: true,
    assignee: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    reporter: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
} as const;

export const createTask = async (data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date | null;
    projectId: string;
    assigneeId?: string | null;
    reporterId: string;
}) => {
    return prisma.task.create({
        data: {
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            dueDate: data.dueDate,
            projectId: data.projectId,
            assigneeId: data.assigneeId ?? null,
            reporterId: data.reporterId,
        },
        select: taskSelect,
    });
};

export const findTasksByProjectId = async (projectId: string) => {
    return prisma.task.findMany({
        where: { projectId },
        select: taskSelect,
        orderBy: [
            { createdAt: 'desc' },
            { title: 'asc' },
        ],
    });
};

export const findTaskById = async (projectId: string, taskId: string) => {
    return prisma.task.findFirst({
        where: {
            id: taskId,
            projectId,
        },
        select: taskSelect,
    });
};

export const updateTask = async (
    projectId: string,
    taskId: string,
    data: {
        title?: string;
        description?: string | null;
        status?: TaskStatus;
        priority?: TaskPriority;
        dueDate?: Date | null;
        assigneeId?: string | null;
    }
) => {
    return prisma.task.updateMany({
        where: {
            id: taskId,
            projectId,
        },
        data,
    });
};

export const deleteTask = async (projectId: string, taskId: string) => {
    return prisma.task.deleteMany({
        where: {
            id: taskId,
            projectId,
        },
    });
};
