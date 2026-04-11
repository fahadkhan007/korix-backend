import { Server , Socket } from 'socket.io'
import { findMemberRole } from '../models/project.model.js'
import {  createMessage, findConversationById } from '../models/chat.model.js'

export const registerChat=(io: Server, socket: Socket)=>{
    const userId=(socket as any).userId as string;
    socket.on('join-conversation', async({conversationId}:{conversationId: string})=>{
        try{
            const conversation = await findConversationById(conversationId);
            if(!conversation){
                socket.emit("error", {message: "chat not found"});
                return;
            }

            const role= await findMemberRole(conversation.projectId, userId)
            if(!role){
                socket.emit("error", {message: "not authorized or member of this project"});
                return;
            }

            socket.join(conversationId);
            console.log(`user ${userId} joined conversation ${conversationId}`);

        }catch(err){
            console.error("Error joining conversation", err);
            socket.emit("error", {message: "internal server error"});
        }

    });

    socket.on("send-message", async ({conversationId, content}:{conversationId: string, content: string})=>{
        try{
            if(!content?.trim()){
                socket.emit("error", {message: "message can not be empty"});
                return;
            }

            const conversation = await findConversationById(conversationId);
            if(!conversation){
                socket.emit("error", {message: "chat not found"});
                return;
            }

            const role= await findMemberRole(conversation.projectId, userId)
            if(!role){
                socket.emit("error", {message: "not authorized or member of this project"});
                return;
            }

            const message = await createMessage({
                conversationId,
                senderId: userId,
                content: content.trim(),
            });

            io.to(conversationId).emit("new-message", message);

        }catch(err){
            console.error("Error sending message", err);
            socket.emit("error", {message: "internal server error"});
        }
    });

    socket.on("disconnect", ()=>{
        console.log(`user ${userId} disconnected session ${socket.id}`);
    });
};


