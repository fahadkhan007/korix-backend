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
    addProjectMemberController,
    updateProjectMemberRoleController,
    getSubProjectsController
} from '../controllers/project.controller.js';

const router = Router();

router.use(protect);
router.use(verifyEmailMiddleware);

router.post('/', createProjectController);
router.get('/', getProjectsByUserController);

router.get('/:projectId', requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER), getProjectByIdController);

router.get('/:projectId/role', requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER), getMemberRoleController);

router.post('/:projectId/members', requireProjectRole(ProjectRole.ADMIN), addProjectMemberController);
router.patch('/:projectId/members', requireProjectRole(ProjectRole.ADMIN), updateProjectMemberRoleController);

router.get('/:projectId/subprojects', requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER), getSubProjectsController);

router.post('/:projectId/subprojects', requireProjectRole(ProjectRole.ADMIN), createSubProjectController);

export default router;
