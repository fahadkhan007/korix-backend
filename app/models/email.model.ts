import crypto from "crypto";
import { prisma } from "../database/database.js";

export const saveEmailVerificationToken = async (data: {
    userId: string;
    token: string;
    expiresAt: Date;
}) => {
    const tokenHash = crypto.createHash("sha256").update(data.token).digest("hex");

    return prisma.emailVerificationToken.create({
        data: {
            userId: data.userId,
            tokenHash,
            expiresAt: data.expiresAt,
        },
        select: {
            id: true,
            userId: true,
            tokenHash: true,
            expiresAt: true,
            createdAt: true,
        },
    });
};

export const deleteEmailVerificationToken = async (userId: string) => {
    return prisma.emailVerificationToken.deleteMany({
        where: { userId },
    });
};

export const findEmailVerificationToken = async (token: string)=>{
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    
    return prisma.emailVerificationToken.findFirst({
        where: { tokenHash },
        select: {
            id: true,
            userId: true,
            tokenHash: true,
            expiresAt: true,
            createdAt: true,
        },
    })
}
