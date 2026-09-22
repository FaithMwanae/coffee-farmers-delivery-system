/**
 * Email Service
 * Handles sending password reset confirmation codes and notifications.
 *
 * In production / with SMTP configured:
 *   Sends actual emails via Nodemailer using SMTP (e.g., Gmail, SendGrid, Mailgun, Amazon SES).
 *
 * In development / without SMTP:
 *   Logs the email with the 6-digit code to the server console and provides simulation feedback.
 */

export const sendPasswordResetEmail = async ({ toEmail, userName, code, expiresIn = '15 minutes' }) => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailFrom = process.env.EMAIL_FROM || `"Kaliluni Coffee Cooperative" <${smtpUser || 'no-reply@kaliluni.com'}>`;

  const isSmtpConfigured = Boolean(smtpUser && smtpPass);

  const subject = `🔐 Kaliluni Farmers Cooperative - Password Reset Code: ${code}`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #28a745;">
        <h2 style="color: #28a745; margin: 0;">☕ Kaliluni Farmers Co-operative Society</h2>
        <p style="color: #6c757d; font-size: 14px; margin-top: 5px;">Coffee Farmers Delivery System</p>
      </div>

      <div style="padding: 20px 0;">
        <p style="font-size: 16px; color: #333;">Hello <strong>${userName || 'Farmer'}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.5;">
          We received a request to reset the password for your account (<strong>${toEmail}</strong>).
        </p>

        <div style="background-color: #f8f9fa; border: 1px dashed #28a745; border-radius: 6px; padding: 15px; text-align: center; margin: 25px 0;">
          <span style="font-size: 14px; color: #6c757d; display: block; margin-bottom: 8px;">Your 6-Digit Password Reset Confirmation Code:</span>
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #28a745; font-family: monospace;">${code}</span>
          <span style="font-size: 13px; color: #dc3545; display: block; margin-top: 8px;">⏰ Valid for ${expiresIn} only</span>
        </div>

        <p style="font-size: 14px; color: #555; line-height: 1.5;">
          Enter this code on the password reset confirmation page along with your new strong password to complete the reset.
        </p>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px 15px; margin: 20px 0; font-size: 13px; color: #856404;">
          <strong>Security Tip:</strong> If you did not request this password reset, please ignore this email or contact the Kaliluni cooperative administration immediately.
        </div>
      </div>

      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px;">
        <p style="margin: 0;">Kaliluni Farmers Co-operative Society Limited &bull; Kathiani, Machakos</p>
        <p style="margin: 5px 0 0 0;">This is an automated security message. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  const textContent = `
Kaliluni Farmers Co-operative Society
Coffee Farmers Delivery System
----------------------------------------
Hello ${userName || 'Farmer'},

We received a request to reset your password for: ${toEmail}

Your 6-Digit Password Reset Confirmation Code is: ${code}
(This code will expire in ${expiresIn})

If you did not request this password reset, please ignore this email.
  `.trim();

  // Try sending via nodemailer if configured and installed
  if (isSmtpConfigured) {
    try {
      const nodemailer = (await import('nodemailer')).default;
      const transportConfig = (smtpHost.includes('gmail') || process.env.SMTP_SERVICE === 'gmail')
        ? {
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: smtpPass.replace(/\s+/g, ''), // Strip any accidental spaces from Google 16-char code
            },
          }
        : {
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          };

      const transporter = nodemailer.createTransport(transportConfig);

      const info = await transporter.sendMail({
        from: emailFrom,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`✅ [EMAIL SENT SUCCESSFULLY] to ${toEmail} | Message ID: ${info.messageId}`);
      return {
        sent: true,
        method: 'SMTP',
        messageId: info.messageId,
      };
    } catch (sendErr) {
      console.error('❌ Failed to send email via SMTP:', sendErr.message);
      // Fall through to console logging so flow does not crash
    }
  }

  // Fallback: development simulation log
  console.log('');
  console.log('═════════════════════════════════════════════════════════════════');
  console.log('📧  [KALILUNI EMAIL SIMULATOR]');
  console.log('═════════════════════════════════════════════════════════════════');
  console.log(`📬  To:       ${toEmail}`);
  console.log(`🏷️   Subject:  ${subject}`);
  console.log(`🔑  CODE:     [ ${code} ]`);
  console.log(`⏰  Expires:  ${expiresIn}`);
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('💡  NOTICE: Real email was not dispatched because SMTP credentials');
  console.log('    are not configured in backend/.env.');
  console.log('    To receive real emails in your inbox, set:');
  console.log('    SMTP_USER=your_email@gmail.com');
  console.log('    SMTP_PASS=your_gmail_app_password');
  console.log('═════════════════════════════════════════════════════════════════');
  console.log('');

  return {
    sent: false,
    method: 'SIMULATION',
    reason: isSmtpConfigured ? 'SMTP_SEND_FAILED' : 'NO_SMTP_CONFIGURED',
    code,
    previewHtml: htmlContent,
  };
};

export default sendPasswordResetEmail;
