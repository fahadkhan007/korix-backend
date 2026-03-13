import { prisma } from '../database/database.js';

export const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, name: true, isVerified: true, createdAt: true },
    });
};

export const createUser = async (data: { email: string; name: string; password: string }) => {
    return prisma.user.create({
        data,
        select: { id: true, email: true, name: true, createdAt: true },
    });
};

export const verifyUserEmail = async (userId: string)=>{
    return prisma.user.update({
        where: { id: userId},
        data: { isVerified: true },
    })
}
