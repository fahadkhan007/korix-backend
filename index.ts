import express, { Request, Response, Application } from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './app/routers/auth.router.js';
import projectRouter from './app/routers/project.router.js';
import { PORT, FRONTEND_CLIENT_URL } from './app/config/env.js';
import { connectRedis } from './app/database/redis.js';
import { connectRedisRateLimit } from './app/config/ratelimitRedis.js';
import errorMiddleware from './app/middlewares/error.middleware.js';
import cors from 'cors';


const app: Application = express();

app.use(cors({
    origin: '*', // FRONTEND_CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);

app.get('/', (req: Request, res: Response) => {
    const htmlResponse = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Korix API</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body {
                margin: 0;
                padding: 0;
                font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
                color: #ffffff;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
            }
            .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.05);
                padding: 3rem 4rem;
                border-radius: 20px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                max-width: 600px;
                width: 90%;
            }
            h1 {
                font-size: 3rem;
                margin-bottom: 0.5rem;
                font-weight: 800;
                background: -webkit-linear-gradient(45deg, #00C9FF, #92FE9D);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            p {
                font-size: 1.2rem;
                color: #d1d5db;
                margin-bottom: 2rem;
                line-height: 1.6;
            }
            .status {
                display: inline-flex;
                align-items: center;
                background: rgba(16, 185, 129, 0.2);
                padding: 0.5rem 1rem;
                border-radius: 50px;
                color: #34d399;
                font-weight: 600;
                font-size: 0.9rem;
            }
            .status-dot {
                width: 10px;
                height: 10px;
                background-color: #34d399;
                border-radius: 50%;
                margin-right: 8px;
                box-shadow: 0 0 10px #34d399;
                animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(52, 211, 153, 0); }
                100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Korix API</h1>
            <p>Welcome to the core backend services for Korix. The system is fully operational and ready to handle requests.</p>
            <div class="status">
                <div class="status-dot"></div>
                All Systems Operational
            </div>
        </div>
    </body>
    </html>
    `;
    res.send(htmlResponse);
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
