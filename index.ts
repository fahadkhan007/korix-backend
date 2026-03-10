import express, { Request, Response, Application } from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './app/routers/auth.router.js';
import { PORT, FRONTEND_CLIENT_URL } from './app/config/env.js';
import { connectRedis } from './app/database/redis.js';
import { connectRedisRateLimit } from './app/config/ratelimitRedis.js';
import errorMiddleware from './app/middlewares/error.middleware.js';
import cors from 'cors';


const app: Application = express();

app.use(cors({
    origin: FRONTEND_CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/auth', authRouter);

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Korix API is running 🚀' });
});

// Global error handler — must be last
app.use(errorMiddleware);

const port = Number(PORT) || 8000;

const startServer = async () => {
    await connectRedis();
    await connectRedisRateLimit();
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
};

startServer();
