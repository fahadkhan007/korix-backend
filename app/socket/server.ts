import { Server } from "socket.io";
import { createServer } from "http";
import type { Application } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { FRONTEND_CLIENT_URL } from "../config/env.js";
import { registerChat } from "./chat.handler.js";


export let io: Server;

export const initSocket = (httpServer: ReturnType<typeof createServer>) => {
    // Mirror the same multi-origin parsing Express uses
    const allowedOrigins = (FRONTEND_CLIENT_URL ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                // Allow server-to-server requests (no origin header)
                if (!origin) return callback(null, true);
                if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                callback(new Error(`Socket origin ${origin} not allowed by CORS`));
            },
            credentials: true,
        },
        // Increase ping timeout to tolerate Render's occasional slow responses
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    io.use((Socket, next) => {
        try {
            const token = Socket.handshake.auth?.token as string | undefined;
            if (!token) {
                return next(new Error("unauthorized"));
            }
            const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string };
            (Socket as any).userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error("unauthorized"));
        }
    });

    io.on("connection", (Socket) => {
        console.log("user connected", (Socket as any).userId);
        console.log(`socketId:${Socket.id}`);
        registerChat(io, Socket);
    });
};


