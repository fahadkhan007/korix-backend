import { Router } from 'express';
import { register, login, refresh, profile, logout } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh); // uses httpOnly cookie, no protect middleware needed

// Protected routes (require valid access token in Authorization header)
router.get('/profile', protect, profile);
router.post('/logout', protect, logout);

export default router;
