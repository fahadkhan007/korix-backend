import { Router } from "express";
import { getConversation, getMessages } from "../controllers/chat.controller.js";
import { ProjectRole } from "../generated/prisma/enums.js";
import { requireProjectRole } from "../middlewares/project.middleware.js";


const router=Router({mergeParams: true});



router.use(requireProjectRole(ProjectRole.ADMIN,ProjectRole.MEMBER,ProjectRole.VIEWER))

router.get("/",getConversation);
router.get("/:conversationId/messages",getMessages);

export default router;