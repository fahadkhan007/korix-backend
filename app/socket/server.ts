import { Server } from "socket.io";
import { createServer } from "http";
import type { Application } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { FRONTEND_CLIENT_URL } from "../config/env.js";
import { registerChat } from "./chat.handler.js";


export let io: Server;

export const initSocket = (httpServer: ReturnType<typeof createServer>) =>{
    io = new Server(httpServer,{
        cors:{
            origin:FRONTEND_CLIENT_URL,
            credentials:true
        }
    });

    io.use((Socket,next)=>{
        try{
            const token = Socket.handshake.auth?.token as string | undefined;
            if(!token){
                return next(new Error("unauthorized"));
            }
            const decoded = jwt.verify(token,JWT_SECRET!) as {userId: string};
            (Socket as any).userId = decoded.userId;
            next();
        }catch(error){
            next(new Error("unauthorized"));
        }
    });

    io.on("connection", (Socket)=>{
        console.log("user connected", (Socket as any).userId);
        console.log(`socketId:${Socket.id}`)
        registerChat(io,Socket);
    });
}


