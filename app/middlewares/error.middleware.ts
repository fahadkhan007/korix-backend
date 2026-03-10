import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client.js";

interface AppError extends Error {
    statusCode?: number;
}

const errorMiddleware = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
    try {
        let statusCode: number = err.statusCode || 500;
        let message: string = err.message || "Internal Server Error";
        console.error(`[Error] ${req.method} ${req.path} →`, err);
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            statusCode = 409;
            const field = (err.meta?.target as string[])?.[0];
            message = field
                ? `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
                : "A record with this value already exists";
        }

        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
            statusCode = 404;
            message = "Record not found";
        }

        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
            statusCode = 400;
            message = "Related record not found";
        }

        if (err instanceof Prisma.PrismaClientValidationError) {
            statusCode = 400;
            message = "Invalid data provided";
        }

        if (err.name === "JsonWebTokenError") {
            statusCode = 401;
            message = "Invalid token. Please log in again";
        }

        if (err.name === "TokenExpiredError") {
            statusCode = 401;
            message = "Your token has expired. Please log in again";
        }
        res.status(statusCode).json({
            success: false,
            statusCode,
            message,
        });
    } catch (error) {
        next(error);
    }
};

export default errorMiddleware;
