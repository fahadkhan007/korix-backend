import transporter from "./email.utils.js";

async function sendEmail(to: string, subject: string, html: string){
    await transporter.verify();
    await transporter.sendMail({
        from: "korix.contact@gmail.com",
        to,
        subject,
        html
    });
}

export default sendEmail;