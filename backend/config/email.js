import nodemailer from 'nodemailer';

let transporter = null;
let emailEnabled = false;
let emailMode = 'none';

// ============================================
// INITIALIZE EMAIL SERVICE
// ============================================
export const initEmailService = async () => {
  const hasCredentials =
    process.env.EMAIL_USER && process.env.EMAIL_PASS;

  // ---------- Gmail SMTP (primary) ----------
  if (hasCredentials) {
    try {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Verify connection works
      await transporter.verify();

      emailEnabled = true;
      emailMode = 'gmail';
      console.log(`✅ Email service: Gmail SMTP (${process.env.EMAIL_USER})`);
      return;
    } catch (err) {
      console.error('❌ Gmail SMTP failed:', err.message);
      console.error('   → Check EMAIL_USER and EMAIL_PASS in .env');
      console.error('   → EMAIL_PASS must be a 16-char App Password, not your Gmail password');
    }
  } else {
    console.warn('⚠️  EMAIL_USER or EMAIL_PASS not set in .env');
  }

  // ---------- Ethereal (DEV ONLY) ----------
  // In production, we do NOT fall back to Ethereal — better to fail loudly
  if (process.env.NODE_ENV !== 'production') {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      emailEnabled = true;
      emailMode = 'ethereal';
      console.log('✅ Email service: Ethereal (DEV fallback)');
      console.log('   Preview inbox:', testAccount.user);
      return;
    } catch (err) {
      console.warn('⚠️  Ethereal failed:', err.message);
    }
  }

  // ---------- Disabled ----------
  emailEnabled = false;
  emailMode = 'disabled';
  console.error('🚨 EMAIL SERVICE DISABLED — no working provider');

  if (process.env.NODE_ENV === 'production') {
    console.error('   → Password reset emails WILL NOT be sent.');
    console.error('   → Fix EMAIL_USER / EMAIL_PASS immediately.');
  } else {
    console.warn('   → Reset codes will only appear in server logs.');
  }
};

// ============================================
// SEND EMAIL
// ============================================
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!emailEnabled || !transporter) {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📧 EMAIL NOT SENT (service disabled)');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('═══════════════════════════════════════');
    return { success: false, reason: 'email_disabled' };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Kaliluni Factory" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    // Only Ethereal has preview URLs
    if (emailMode === 'ethereal') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log('📧 Preview:', previewUrl);
    }

    console.log(`📧 Email sent to ${to} (${emailMode}): ${info.messageId}`);
    return { success: true, info };
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
    return { success: false, reason: err.message };
  }
};

// ============================================
// STATUS CHECK
// ============================================
export const isEmailEnabled = () => emailEnabled;
export const getEmailMode = () => emailMode;