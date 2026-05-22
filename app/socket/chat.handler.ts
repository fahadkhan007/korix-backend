import { Server , Socket } from 'socket.io'
import { findMemberRole } from '../models/project.model.js'
import { createMessage, createAiMessage, findConversationById } from '../models/chat.model.js'
import { callAIService } from '../utils/ai.utils.js'
import { handleAIAction } from './ai.handler.js'

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

            // 1. Emit the user's message immediately — don't make them wait for AI
            io.to(conversationId).emit("new-message", message);

            // 2. Detect @KorixAI prefix and fire the AI flow asynchronously
            if (content.trim().toLowerCase().startsWith("@korixai")) {
                const query = content.trim().replace(/^@korixai\s*/i, "");

                (async () => {
                    try {
                        io.to(conversationId).emit("ai-typing", { thinking: true });

                        const aiResponse = await callAIService("chat-copilot", {
                            query,
                            projectId: conversation.projectId,
                            conversationId,  // ← thread_id for MemorySaver — enables multi-turn memory
                        });

                        // 3. If Python returned an action, execute it via Prisma
                        if (aiResponse.type === "action") {
                            await handleAIAction(aiResponse, conversation.projectId, io, conversationId);
                        }

                        // 4. Save and emit the AI's reply as a chat message
                        const aiMessage = await createAiMessage({
                            conversationId,
                            content: aiResponse.message,
                        });

                        io.to(conversationId).emit("ai-typing", { thinking: false });
                        io.to(conversationId).emit("new-message", aiMessage);

                    } catch (err: any) {
                        console.error("[chat.handler] AI flow error:", err?.message ?? err);
                        io.to(conversationId).emit("ai-typing", { thinking: false });

                        // Save and emit a visible error message so user isn't left hanging
                        const errMessage = await createAiMessage({
                            conversationId,
                            content: `⚠️ Error: ${err?.message ?? "Something went wrong. Check the server logs."}`,
                        });
                        io.to(conversationId).emit("new-message", errMessage);
                    }
                })();
            }

        }catch(err){
            console.error("Error sending message", err);
            socket.emit("error", {message: "internal server error"});
        }
    });

    socket.on("disconnect", ()=>{
        console.log(`user ${userId} disconnected session ${socket.id}`);
    });
};


