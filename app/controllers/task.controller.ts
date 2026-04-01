import { Request, Response } from 'express';
import { TaskPriority, TaskStatus } from '../generated/prisma/enums.js';
import { findMemberRole, findProjectById } from '../models/project.model.js';
import {
    createTask,
    deleteTask,
    findTaskById,
    findTasksByProjectId,
    updateTask,
} from '../models/task.model.js';

const validStatuses = [
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.DONE,
];

const validPriorities = [
    TaskPriority.LOW,
    TaskPriority.MEDIUM,
    TaskPriority.HIGH,
    TaskPriority.URGENT,
];

const parseOptionalDueDate = (value: unknown): { ok: boolean; value?: Date | null } => {
    if (value === undefined) {
        return { ok: true };
    }

    if (value === null || value === '') {
        return { ok: true, value: null };
    }

    if (typeof value !== 'string') {
        return { ok: false };
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return { ok: false };
    }

    return { ok: true, value: parsedDate };
};

const ensureAssigneeIsProjectMember = async (projectId: string, assigneeId: string | null | undefined) => {
    if (!assigneeId) {
        return true;
    }

    const role = await findMemberRole(projectId, assigneeId);
    return Boolean(role);
};

export const createTaskController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId as string;
        const { projectId } = req.params as Record<string, string>;
        const { title, description, priority, status, dueDate, assigneeId } = req.body as {
            title?: string;
            description?: string;
            priority?: TaskPriority;
            status?: TaskStatus;
            dueDate?: string | null;
            assigneeId?: string | null;
        };

        if (!title || !title.trim()) {
            res.status(400).json({ message: 'Task title is required' });
            return;
        }

        if (priority && !validPriorities.includes(priority)) {
            res.status(400).json({ message: 'Invalid task priority' });
            return;
        }

        if (status && !validStatuses.includes(status)) {
            res.status(400).json({ message: 'Invalid task status' });
            return;
        }

        const parsedDueDate = parseOptionalDueDate(dueDate);
        if (!parsedDueDate.ok) {
            res.status(400).json({ message: 'Invalid due date' });
            return;
        }

        const project = await findProjectById(projectId);
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        const isValidAssignee = await ensureAssigneeIsProjectMember(projectId, assigneeId);
        if (!isValidAssignee) {
            res.status(400).json({ message: 'Assignee must be a member of this project' });
            return;
        }

        const task = await createTask({
            title: title.trim(),
            description: description?.trim() || undefined,
            priority,
            status,
            dueDate: parsedDueDate.value,
            projectId,
            assigneeId,
            reporterId: userId,
        });

        res.status(201).json({ message: 'Task created successfully', task });
    } catch (err) {
        console.error('createTask error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getTasksByProjectController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params as Record<string, string>;
        const tasks = await findTasksByProjectId(projectId);

        res.status(200).json({ tasks });
    } catch (err) {
        console.error('getTasksByProject error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getTaskByIdController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId, taskId } = req.params as Record<string, string>;
        const task = await findTaskById(projectId, taskId);

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        res.status(200).json({ task });
    } catch (err) {
        console.error('getTaskById error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateTaskController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId, taskId } = req.params as Record<string, string>;
        const {
            title,
            description,
            priority,
            status,
            dueDate,
            assigneeId,
        } = req.body as {
            title?: string;
            description?: string | null;
            priority?: TaskPriority;
            status?: TaskStatus;
            dueDate?: string | null;
            assigneeId?: string | null;
        };

        const existingTask = await findTaskById(projectId, taskId);
        if (!existingTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        const updateData: {
            title?: string;
            description?: string | null;
            priority?: TaskPriority;
            status?: TaskStatus;
            dueDate?: Date | null;
            assigneeId?: string | null;
        } = {};

        if (title !== undefined) {
            if (!title.trim()) {
                res.status(400).json({ message: 'Task title cannot be empty' });
                return;
            }
            updateData.title = title.trim();
        }

        if (description !== undefined) {
            updateData.description = description === null ? null : description.trim();
        }

        if (priority !== undefined) {
            if (!validPriorities.includes(priority)) {
                res.status(400).json({ message: 'Invalid task priority' });
                return;
            }
            updateData.priority = priority;
        }

        if (status !== undefined) {
            if (!validStatuses.includes(status)) {
                res.status(400).json({ message: 'Invalid task status' });
                return;
            }
            updateData.status = status;
        }

        const parsedDueDate = parseOptionalDueDate(dueDate);
        if (!parsedDueDate.ok) {
            res.status(400).json({ message: 'Invalid due date' });
            return;
        }
        if (dueDate !== undefined) {
            updateData.dueDate = parsedDueDate.value ?? null;
        }

        if (assigneeId !== undefined) {
            const isValidAssignee = await ensureAssigneeIsProjectMember(projectId, assigneeId);
            if (!isValidAssignee) {
                res.status(400).json({ message: 'Assignee must be a member of this project' });
                return;
            }
            updateData.assigneeId = assigneeId;
        }

        if (Object.keys(updateData).length === 0) {
            res.status(400).json({ message: 'At least one field is required to update the task' });
            return;
        }

        await updateTask(projectId, taskId, updateData);
        const task = await findTaskById(projectId, taskId);

        res.status(200).json({ message: 'Task updated successfully', task });
    } catch (err) {
        console.error('updateTask error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteTaskController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId as string;
        const projectRole = (req as any).projectRole as string | undefined;
        const { projectId, taskId } = req.params as Record<string, string>;

        const task = await findTaskById(projectId, taskId);
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        if (projectRole !== 'ADMIN' && task.reporterId !== userId) {
            res.status(403).json({ message: 'Only admins or task creators can delete this task' });
            return;
        }

        await deleteTask(projectId, taskId);

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error('deleteTask error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
