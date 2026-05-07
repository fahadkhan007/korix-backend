import { configDotenv } from "dotenv";
import fs from "fs";
import path from "path"
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
    SMTP_FROM,
    SMTP_SERVER,
    SMTP_PORT,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    AI_SERVICE_URL
} = process.env;

export const PRIVATE_KEY=(()=>{
    try{
        return fs.readFileSync(path.join(process.cwd(),"private.pem"),"utf-8");
    }catch{
        console.warn("private.pem key NOT found! AI service will not work.");
        return null;
    }
})();