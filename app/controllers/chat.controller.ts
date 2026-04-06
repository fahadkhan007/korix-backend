import { Request, Response } from "express";
import { findConversationByProject, findMessages } from "../models/chat.model.js";

export const getConversation = async (req:Request, res: Response): Promise<void> =>{
    try{
        const { projectId } = req.params as Record<string, string>;
        const conversation = await findConversationByProject(projectId);
        if(!conversation){
            res.status(404).json({error:"Conversation not found"});
            return;
        }
        res.status(200).json({ conversation });
        

    } catch(err){
        console.error("Error fetching conversation:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { conversationId } = req.params as Record<string, string>;
        const { cursor } = req.query as { cursor?: string };
        const messages = await findMessages(conversationId, cursor);
        res.status(200).json({ messages });
    } catch (err) {
        console.error('getMessages error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};