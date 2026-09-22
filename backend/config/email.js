import nodemailer from 'nodemailer';

let transporter = null;
let emailEnabled = false;

// ============================================
// INITIALIZE EMAIL SERVICE
// ============================================
export const initEmailService = async () => {
  // If Gmail credentials are configured, use them
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      emailEnabled = true;
      console.log('✅ Email service: Gmail SMTP');
      return;
    } catch (err) {
      console.warn('⚠️  Gmail SMTP failed:', err.message);
    }
  }

  // Otherwise, try Ethereal (test mode)
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    emailEnabled = true;
    console.log('✅ Email service: Ethereal (test mode)');
    console.log('   User:', testAccount.user);
    console.log('   Pass:', testAccount.pass);
  } catch (err) {
    // Network failure — email is disabled but server keeps running
    console.warn('⚠️  Email service disabled (network error):', err.message);
    console.warn('   → Forgot-password links will be printed to console instead.');
    emailEnabled = false;
  }
};

// ============================================
// SEND EMAIL (with graceful fallback)
// ============================================
export const sendEmail = async ({ to, subject, html }) => {
  if (!emailEnabled || !transporter) {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📧 EMAIL (not sent — service disabled)');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('   Body preview:', html.replace(/<[^>]*>/g, '').substring(0, 120) + '...');
    console.log('═══════════════════════════════════════');
    console.log('');
    return { success: false, reason: 'email_disabled' };
  }

  try {
    const info = await transporter.sendMail({
      from: '"Kaliluni Coffee" <noreply@kaliluni.com>',
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Email preview:', previewUrl);
    }
    return { success: true, info };
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
    return { success: false, reason: err.message };
  }
};

// ============================================
// CHECK IF EMAIL IS AVAILABLE
// ============================================
export const isEmailEnabled = () => emailEnabled;