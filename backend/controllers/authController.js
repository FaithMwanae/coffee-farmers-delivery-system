import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/pool.js';
import { generateToken } from '../utils/tokenUtils.js';
import { sendEmail } from '../config/email.js';
import { validateStrongPassword } from '../utils/passwordValidator.js';

// ============================================
// HELPERS — Map DB row → API shape
// ============================================
const mapFarmer = (f) => ({
  id: f.id,
  userId: f.user_id,
  memberNo: f.member_no,
  name: f.name,
  phone: f.phone,
  location: f.location,
  coffeeTrees: f.coffee_trees,
  totalDelivered: Number(f.total_delivered || 0),
  status: f.status,
  joinDate: f.join_date,
});

const mapUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
});

// ============================================
// HELPERS — Password verification (bcrypt OR plain)
// ============================================
const verifyPassword = async (inputPassword, storedPassword) => {
  if (!storedPassword) return false;

  if (typeof storedPassword === 'string' && /^\$2[aby]\$/.test(storedPassword)) {
    try {
      return await bcrypt.compare(inputPassword, storedPassword);
    } catch (e) {
      console.error('bcrypt compare error:', e.message);
      return false;
    }
  }

  return inputPassword === storedPassword;
};

// ============================================
// POST /api/auth/login
// ============================================
export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log('🔍 LOGIN ATTEMPT:', email);

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const r = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (r.rows.length === 0) {
      console.log('❌ USER NOT FOUND:', cleanEmail);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = r.rows[0];
    console.log(`🔍 USER FOUND: ${user.name} (${user.role})`);

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
    }

    const isMatch = await verifyPassword(password, user.password);

    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    let profile = null;
    const f = await pool.query(
      'SELECT * FROM farmers WHERE user_id = $1',
      [user.id]
    );
    if (f.rows.length > 0) profile = mapFarmer(f.rows[0]);

    try {
      await pool.query(
        `INSERT INTO audit_logs (user_name, role, action, details, ip)
         VALUES ($1, $2, 'LOGIN', 'Successful login', $3)`,
        [user.name, user.role, req.ip || '127.0.0.1']
      );
    } catch (e) { /* non-blocking */ }

    console.log('✅ LOGIN SUCCESS:', user.name);

    return res.status(200).json({
      success: true,
      token,
      user: { ...mapUser(user), profile },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// ============================================
// POST /api/auth/register
// ============================================
export const register = async (req, res) => {
  const { name, email, phone, location, coffeeTrees, password } = req.body;
  console.log('📝 REGISTER ATTEMPT:', email);

  if (!name || !email || !phone || !location || !password) {
    return res.status(400).json({
      message: 'Name, email, phone, location, and password are required.',
    });
  }

  const numTrees = Number(coffeeTrees);
  if (isNaN(numTrees) || !Number.isInteger(numTrees) || numTrees <= 0) {
    return res.status(400).json({
      message: 'Number of coffee trees must be a positive integer.',
    });
  }

  // ✅ STRONG PASSWORD VALIDATION
  const passCheck = validateStrongPassword(password);
  if (!passCheck.isValid) {
    return res.status(400).json({
      message: passCheck.message,
      details: passCheck.errors,
    });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanName = name.trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const exists = await client.query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );
    if (exists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRes = await client.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, 'farmer', 'Active')
       RETURNING id, name, email, role, status`,
      [cleanName, cleanEmail, hashedPassword]
    );
    const user = userRes.rows[0];

    const countRes = await client.query('SELECT COUNT(*) FROM farmers');
    const nextNum = 100 + Number(countRes.rows[0].count) + 1;
    const memberNo = `KFCS-${String(nextNum).padStart(5, '0')}`;

    const farmerRes = await client.query(
      `INSERT INTO farmers (user_id, member_no, name, phone, location, coffee_trees, total_delivered, status)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 'Active')
       RETURNING *`,
      [user.id, memberNo, cleanName, phone.trim(), location.trim(), numTrees]
    );
    const farmer = farmerRes.rows[0];

    await client.query('COMMIT');

    console.log(`✅ NEW FARMER: ${cleanName} | ${cleanEmail} | ${memberNo}`);

    return res.status(201).json({
      success: true,
      message: `Registration successful. Your member number is ${memberNo}.`,
      user: mapUser(user),
      profile: mapFarmer(farmer),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  } finally {
    client.release();
  }
};

// ============================================
// GET /api/auth/me
// ============================================
export const getCurrentUser = async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, name, email, role, status FROM users WHERE id = $1',
      [req.user.id]
    );
    if (r.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = r.rows[0];
    let profile = null;

    const f = await pool.query('SELECT * FROM farmers WHERE user_id = $1', [user.id]);
    if (f.rows.length > 0) profile = mapFarmer(f.rows[0]);

    res.json({ ...mapUser(user), profile });
  } catch (error) {
    console.error('getCurrentUser error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ============================================
// POST /api/auth/forgot-password
// Generates a 6-digit code and emails it
// ============================================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  let generatedCode = null;
  let codeSent = false;

  try {
    const r = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (r.rows.length > 0) {
      const user = r.rows[0];

      // Generate 6-digit code
      generatedCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalidate all previous codes for this email
      await pool.query(
        'UPDATE password_resets SET used = TRUE WHERE LOWER(email) = $1 AND used = FALSE',
        [cleanEmail]
      );

      // Save the new code with a UNIQUE token (avoids unique constraint)
      const uniqueToken = crypto.randomBytes(16).toString('hex');

      await pool.query(
        `INSERT INTO password_resets (email, code, token, expires_at, used)
         VALUES ($1, $2, $3, $4, FALSE)`,
        [cleanEmail, generatedCode, uniqueToken, expiresAt]
      );

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #1a4d2e;">
            <h2 style="color: #1a4d2e; margin: 0; letter-spacing: 2px;">KALILUNI</h2>
            <p style="color: #c8952b; margin: 4px 0 0; font-size: 11px; letter-spacing: 2px;">COFFEE MANAGEMENT SYSTEM</p>
          </div>

          <p style="margin-top: 24px;">Hello <strong>${user.name}</strong>,</p>

          <p>We received a request to reset your password. Use this verification code to continue:</p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 18px 40px; background: #f0f4f1; border: 2px dashed #1a4d2e; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a4d2e; font-family: 'Courier New', monospace;">
                ${generatedCode}
              </span>
            </div>
          </div>

          <p style="font-size: 14px; color: #6b7280;">⏰ This code expires in <strong>10 minutes</strong>.</p>

          <div style="background: #fef7e0; border-left: 4px solid #c8952b; padding: 12px; margin: 20px 0; font-size: 13px;">
            <strong>Security tip:</strong> If you didn't request this, ignore this email. Your password won't change.
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Kaliluni Farmers Co-operative Society<br />
            This is an automated message. Do not reply.
          </p>
        </div>
      `;

      console.log(`📧 RESET CODE for ${cleanEmail}: ${generatedCode}`);

      try {
        await sendEmail({
          to: user.email,
          subject: 'Kaliluni — Password Reset Verification Code',
          html,
        });
        codeSent = true;
      } catch (err) {
        console.error('Email send failed:', err.message);
      }
    }

    // Always return the same message (prevents email enumeration)
    const response = {
      success: true,
      message: 'If that email exists, a 6-digit code has been sent.',
    };

    // In development: expose the code so testing works even if email fails
    if (process.env.NODE_ENV === 'development' && generatedCode) {
      response.devCode = generatedCode;
    }

    return res.json(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ============================================
// POST /api/auth/verify-reset-code
// Validates the 6-digit code without changing password
// ============================================
export const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ valid: false, message: 'Email and code are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const r = await pool.query(
      `SELECT * FROM password_resets
       WHERE LOWER(email) = $1
         AND code = $2
         AND used = FALSE
         AND expires_at > NOW()
       ORDER BY id DESC
       LIMIT 1`,
      [cleanEmail, code]
    );

    if (r.rows.length === 0) {
      return res.json({ valid: false, message: 'Invalid or expired code.' });
    }

    const user = await pool.query(
      'SELECT name FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    return res.json({
      valid: true,
      email: cleanEmail,
      name: user.rows[0]?.name || 'User',
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return res.status(500).json({ valid: false, message: 'Server error.' });
  }
};

// ============================================
// POST /api/auth/reset-password
// Body: { email, code, password, confirmPassword }
// ============================================
export const resetPassword = async (req, res) => {
  const { email, code, password, confirmPassword } = req.body;

  if (!email || !code || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  // ✅ STRONG PASSWORD VALIDATION
  const passCheck = validateStrongPassword(password);
  if (!passCheck.isValid) {
    return res.status(400).json({
      message: passCheck.message,
      details: passCheck.errors,
    });
  }

  const cleanEmail = email.toLowerCase().trim();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate code
    const r = await client.query(
      `SELECT * FROM password_resets
       WHERE LOWER(email) = $1
         AND code = $2
         AND used = FALSE
         AND expires_at > NOW()
       ORDER BY id DESC
       LIMIT 1`,
      [cleanEmail, code]
    );

    if (r.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid or expired code.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    const u = await client.query(
      `UPDATE users SET password = $1
       WHERE LOWER(email) = $2
       RETURNING id, name, role, email`,
      [hashedPassword, cleanEmail]
    );

    if (u.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found.' });
    }

    // Mark all codes for this email as used
    await client.query(
      'UPDATE password_resets SET used = TRUE WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (user_name, role, action, details, ip)
       VALUES ($1, $2, 'PASSWORD_RESET', 'Password reset via email code', $3)`,
      [u.rows[0].name, u.rows[0].role, req.ip || '127.0.0.1']
    );

    await client.query('COMMIT');

    console.log(`🔐 Password reset successful for: ${cleanEmail}`);

    return res.json({
      success: true,
      message: 'Password reset successful. Please sign in.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ============================================
// GET /api/auth/reset-link/:token (legacy redirect)
// ============================================
export const handleResetLink = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return res.redirect(`${frontendUrl}/forgot-password`);
};

// ============================================
// POST /api/auth/change-password (authenticated)
// ============================================
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required.' });
  }
  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New passwords do not match.' });
  }

  // ✅ STRONG PASSWORD VALIDATION
  const passCheck = validateStrongPassword(newPassword);
  if (!passCheck.isValid) {
    return res.status(400).json({
      message: passCheck.message,
      details: passCheck.errors,
    });
  }

  try {
    const r = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (r.rows.length === 0) return res.status(404).json({ message: 'User not found.' });

    const user = r.rows[0];

    const isMatch = await verifyPassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password does not match.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [
      hashedPassword,
      user.id,
    ]);

    await pool.query(
      `INSERT INTO audit_logs (user_name, role, action, details, ip)
       VALUES ($1, $2, 'PASSWORD_CHANGE', 'Password changed', $3)`,
      [user.name, user.role, req.ip || '127.0.0.1']
    );

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};