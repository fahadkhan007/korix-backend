import { Router } from 'express';
import { ProjectRole } from '../generated/prisma/enums.js';
import { requireProjectRole } from '../middlewares/project.middleware.js';
import {
    createTaskController,
    deleteTaskController,
    getTaskByIdController,
    getTasksByProjectController,
    updateTaskController,
} from '../controllers/task.controller.js';

const router = Router({ mergeParams: true });

router.get(
    '/',
    requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER),
    getTasksByProjectController
);

router.get(
    '/:taskId',
    requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER),
    getTaskByIdController
);

router.post(
    '/',
    requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER),
    createTaskController
);

router.patch(
    '/:taskId',
    requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER),
    updateTaskController
);

router.delete(
    '/:taskId',
    requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER),
    deleteTaskController
);

export default router;
