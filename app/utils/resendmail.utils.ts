import resend from './resend.utils.js';

const getFromAddress = () => {
    return 'noreply@contact.korixlive.app';
};

async function sendResendEmail(to: string, subject: string, html: string) {
    const from = getFromAddress();

    const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
    });

    if (error) {
        throw new Error(`Resend email failed: ${error.message}`);
    }

    return data;
}

export default sendResendEmail;
