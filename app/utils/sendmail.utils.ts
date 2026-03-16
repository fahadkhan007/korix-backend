import transporter from "./email.utils.js";
import { SMTP_FROM, SMTP_LOGIN } from "../config/env.js";

let isTransportVerified = false;

const ensureTransportReady = async () => {
    if (isTransportVerified) {
        return;
    }

    await transporter.verify();
    isTransportVerified = true;
};

async function sendEmail(to: string, subject: string, html: string){
    const fromAddress = SMTP_FROM || SMTP_LOGIN;
    if (!fromAddress) {
        throw new Error('SMTP sender is not configured. Set SMTP_FROM or SMTP_LOGIN.');
    }

    await ensureTransportReady();
    await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html
    });
}

export default sendEmail;
