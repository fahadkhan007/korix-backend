import { Server } from "socket.io";
import { createTask, updateTask } from "../models/task.model.js";
import { TaskStatus, TaskPriority } from "../generated/prisma/enums.js";
import type { AIResponse } from "../utils/ai.utils.js";
import { AI_BOT_USER_ID } from "../models/chat.model.js";

export async function handleAIAction(
    response: Extract<AIResponse, { type: "action" }>,
    projectId: string,
    io: Server,
    conversationId: string
): Promise<void> {
    const { action, payload } = response;

    switch (action) {
        case "ASSIGN_TASK": {
            await updateTask(projectId, payload.taskId, {
                assigneeId: payload.assigneeId,
            });
            io.to(conversationId).emit("task-updated", { taskId: payload.taskId });
            break;
        }

        case "CHANGE_STATUS": {
            await updateTask(projectId, payload.taskId, {
                status: payload.status as TaskStatus,
            });
            io.to(conversationId).emit("task-updated", { taskId: payload.taskId });
            break;
        }

        case "CREATE_TASK": {
            const newTask = await createTask({
                title: payload.title,
                description: payload.description,
                priority: (payload.priority as TaskPriority) ?? TaskPriority.MEDIUM,
                projectId,
                reporterId: AI_BOT_USER_ID,
                assigneeId: payload.assigneeId ?? null, 
            });
            io.to(conversationId).emit("task-created", newTask);
            break;
        }

        default:
            console.warn(`[ai.handler] Unknown action received: ${action}`);
    }
}
