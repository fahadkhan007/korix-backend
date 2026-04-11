import { prisma } from "../database/database.js";
import { MessageType } from "../generated/prisma/enums.js";

export const findConversationByProject = async (projectId: string) => {
    return prisma.conversation.findFirst({
        where: { projectId },
        select: { id: true, name: true, type: true, createdAt: true },
    });
};

export const findConversationById = async (id: string) => {
    return prisma.conversation.findUnique({
        where: { id },
        select: { id: true, projectId: true, name: true },
    });
};


export const findMessages = async (conversationId: string, cursor?: string) => {
    return prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' }, 
        take: 50,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        select: {
            id: true,
            content: true,
            messageType: true,
            createdAt: true,
            sender: {
                select: { id: true, name: true, email: true },
            },
        },
    });
};


export const createMessage = async (data: {
    conversationId: string;
    senderId: string;
    content: string;
    messageType?: MessageType;
}) => {
    return prisma.message.create({
        data: {
            conversationId: data.conversationId,
            senderId:       data.senderId,
            content:        data.content,
            messageType:    data.messageType ?? MessageType.TEXT,
        },
        select: {
            id: true,
            content: true,
            messageType: true,
            createdAt: true,
            sender: {
                select: { id: true, name: true, email: true },
            },
        },
    });
};