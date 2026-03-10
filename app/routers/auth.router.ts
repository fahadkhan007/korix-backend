import { Router } from 'express';
import { register, login, refresh, profile, logout } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { ipRateLimiter, userRateLimiter } from '../middlewares/ratelimit.middleware.js';


const router = Router();


router.post('/register', ipRateLimiter, register);
router.post('/login', ipRateLimiter, login);
router.post('/refresh', ipRateLimiter, refresh); 


router.get('/profile', protect, userRateLimiter, profile);
router.post('/logout', protect, userRateLimiter, logout);

export default router;
