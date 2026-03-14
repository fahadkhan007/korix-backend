const getInviteTemplate = (name: string, projectName: string, inviteUrl: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Project Invitation</title>
</head>

<body style="margin:0; padding:0; background:#f5f7fb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">

        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; padding:40px; box-shadow:0 4px 20px rgba(0,0,0,0.05);">

          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h1 style="margin:0; font-size:26px; color:#111827;">Korix</h1>
              <p style="margin:6px 0 0; color:#6b7280; font-size:14px;">
                Project Management & Collaboration
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:10px;">
              <h2 style="color:#111827; font-size:20px; margin-bottom:10px;">
                You're invited to join a project
              </h2>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                Hi <strong>${name}</strong>,
              </p>

              <p style="color:#374151; font-size:15px; line-height:1.6;">
                You have been invited to collaborate on the project <strong>${projectName}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:30px 0;">
              <a
                href="${inviteUrl}"
                style="
                  background:#4f46e5;
                  color:#ffffff;
                  text-decoration:none;
                  padding:14px 26px;
                  font-size:15px;
                  border-radius:8px;
                  font-weight:600;
                  display:inline-block;
                "
              >
                Accept Invitation
              </a>
            </td>
          </tr>

          <tr>
            <td>
              <p style="color:#6b7280; font-size:14px;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>

              <p style="word-break:break-all;">
                <a href="${inviteUrl}" style="color:#4f46e5; font-size:13px;">
                  ${inviteUrl}
                </a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:30px; border-top:1px solid #e5e7eb;">
              <p style="font-size:12px; color:#9ca3af; line-height:1.5;">
                If you didn’t expect this invitation, you can safely ignore this email.
              </p>

              <p style="font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} Korix. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

export default getInviteTemplate;