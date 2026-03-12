import { configDotenv } from "dotenv";
configDotenv();

export const {
    PORT,
    DATABASE_URL,
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    REDIS_URL,
    FRONTEND_CLIENT_URL,
    BACKEND_CLIENT_URL,
    SMTP_KEY, SMTP_LOGIN,
    SMTP_SERVER,
    SMTP_PORT
} = process.env;
