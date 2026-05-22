import { Router, Request, Response } from "express";
import { getConversation, getMessages } from "../controllers/chat.controller.js";
import { ProjectRole } from "../generated/prisma/enums.js";
import { requireProjectRole } from "../middlewares/project.middleware.js";
import { callAIService } from "../utils/ai.utils.js";


const router=Router({mergeParams: true});



router.use(requireProjectRole(ProjectRole.ADMIN,ProjectRole.MEMBER,ProjectRole.VIEWER))

router.get("/",getConversation);
router.get("/:conversationId/messages",getMessages);

router.post("/:conversationId/convert-to-task", async (req: Request, res: Response) => {
    try {
        const { transcript } = req.body as { transcript: string };
        if (!transcript?.trim()) {
            res.status(400).json({ message: "Transcript is required" });
            return;
        }
        const result = await callAIService("convert-to-task", {
            transcript: transcript.trim(),
            projectId: req.params.projectId,  // ← fixed: projectId from parent router param
        });
        res.status(200).json(result);
    } catch (err) {
        console.error("[convert-to-task] Error:", err);
        res.status(500).json({ message: "Failed to generate task from transcript" });
    }
});

export default router;