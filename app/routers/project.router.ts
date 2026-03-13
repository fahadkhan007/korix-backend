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

// Apply auth protecting and email verifying to ALL project routes
router.use(protect);
router.use(verifyEmailMiddleware);

// Create top-level project & Get User's projects
router.post('/', createProjectController);
router.get('/', getProjectsByUserController);

// View project details (Admin, Member, Viewer)
router.get('/:projectId', requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER), getProjectByIdController);

// Check your own role inside a project
router.get('/:projectId/role', requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER), getMemberRoleController);

// Manage Members (ADMIN ONLY)
router.post('/:projectId/members', requireProjectRole(ProjectRole.ADMIN), addProjectMemberController);
router.patch('/:projectId/members', requireProjectRole(ProjectRole.ADMIN), updateProjectMemberRoleController);

// Sub-projects
// To view sub-projects, you must be a member of the PARENT project
router.get('/:projectId/subprojects', requireProjectRole(ProjectRole.ADMIN, ProjectRole.MEMBER, ProjectRole.VIEWER), getSubProjectsController);

// To create a sub-project, you must be an ADMIN of the PARENT project
router.post('/:projectId/subprojects', requireProjectRole(ProjectRole.ADMIN), createSubProjectController);

export default router;
