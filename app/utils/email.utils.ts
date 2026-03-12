import nodemailer from "nodemailer";
import { SMTP_KEY, SMTP_LOGIN, SMTP_PORT, SMTP_SERVER } from "../config/env.js";

const smtpPort = Number(SMTP_PORT ?? 587);

const transporter = nodemailer.createTransport({
    host: SMTP_SERVER,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: SMTP_LOGIN,
        pass: SMTP_KEY
    }
});

export default transporter;

