import { Resend } from 'resend';

let resend = null;
let emailEnabled = false;

export const initEmailService = async () => {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    emailEnabled = true;
    console.log('✅ Email service: Resend HTTP API');
  } else {
    console.error('🚨 RESEND_API_KEY missing');
  }
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!emailEnabled || !resend) {
    console.log('📧 Email NOT SENT (Resend disabled)');
    return { success: false };
  }

  try {
    const data = await resend.emails.send({
      from: 'Kaliluni Coffee <onboarding@resend.dev>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    console.log(`📧 Email sent to ${to} via Resend: ${data.id}`);
    return { success: true, info: data };
  } catch (err) {
    console.error('❌ Resend error:', err.message);
    return { success: false, reason: err.message };
  }
};

// ⭐ THESE WERE MISSING AND CAUSED THE CRASH
export const isEmailEnabled = () => emailEnabled;
export const getEmailMode = () => (emailEnabled ? 'resend' : 'disabled');