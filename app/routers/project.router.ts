import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { verifyEmailMiddleware } from '../middlewares/verified.middleware.js';
import { requireProjectRole } from '../middlewares/project.middleware.js';
import { ProjectRole } from '../generated/prisma/enums.js';
import {
    createProjectController,
    createSubProjectController,
    getProjectByIdController,
    getProjectsByUserController,
    getMemberRoleController,
    updateProjectMemberRoleController,
    getSubProjectsController
} from '../controllers/project.controller.js';
import { inviteMemberController, acceptProjectInviteController } from '../controllers/invitemember.controller.js';
import taskRouter from './task.router.js';

const router = Router();

router.use(protect);
router.use(verifyEmailMiddleware);

router.post('/', createProjectController);
router.get('/', getProjectsByUserController);

router.post('/invites/accept', acceptProjectInviteController);

router.get('/:projectId', requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER), getProjectByIdController);

router.get('/:projectId/role', requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER), getMemberRoleController);

router.post('/:projectId/members', requireProjectRole(ProjectRole.ADMIN), inviteMemberController);
router.patch('/:projectId/members', requireProjectRole(ProjectRole.ADMIN), updateProjectMemberRoleController);

router.get('/:projectId/subprojects', requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER), getSubProjectsController);

router.post('/:projectId/subprojects', requireProjectRole(ProjectRole.ADMIN), createSubProjectController);
router.use('/:projectId/tasks', taskRouter);

export default router;
