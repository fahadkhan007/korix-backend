const getRegisterInviteTemplate = (inviteeName: string, projectName: string, inviteUrl: string) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to join ${projectName} on Korix!</title>
    </head>
    <body>
        <p>Hi ${inviteeName},</p>
        <p>You have been invited to join the ${projectName} project on Korix!</p>
        <p>Click the link below to register your account and join the project:</p>
        <a href="${inviteUrl}">Join Project</a>
        <p>If you did not expect this invitation, please ignore this email.</p>
        <p>Best regards,</p>
        <p>The Korix Team</p>
    </body>
    </html>
    `;
};
export default getRegisterInviteTemplate;