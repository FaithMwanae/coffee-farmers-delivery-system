import pool from '../config/pool.js';

// ============================================
// GET /api/admin/dashboard
// ============================================
export const getDashboard = async (req, res) => {
  try {
    const [farmers, staff, users, deliveries, payments, active] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM farmers'),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'staff'"),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COALESCE(SUM(weight), 0) AS total FROM deliveries'),
      pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'Payment'"),
      pool.query("SELECT COUNT(*) FROM users WHERE status = 'Active'"),
    ]);

    res.json({
      totalFarmers: Number(farmers.rows[0].count),
      totalStaff: Number(staff.rows[0].count),
      totalUsers: Number(users.rows[0].count),
      totalDeliveries: Number(deliveries.rows[0].total),
      totalPayments: Number(payments.rows[0].total),
      activeUsers: Number(active.rows[0].count),
      season: '2026',
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error loading admin dashboard.' });
  }
};

// ============================================
// GET /api/admin/activity
// ============================================
export const getRecentActivity = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10');
    const mapped = result.rows.map((log) => ({
      ...log,
      user: log.user_name,
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Server error loading recent activity.' });
  }
};

// ============================================
// GET /api/admin/roles
// ============================================
export const getRoleDistribution = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT role, COUNT(*) AS count FROM users GROUP BY role`
    );
    const dist = { farmers: 0, staff: 0, admins: 0, ceos: 0 };
    result.rows.forEach((r) => {
      if (r.role === 'farmer') dist.farmers = Number(r.count);
      if (r.role === 'staff') dist.staff = Number(r.count);
      if (r.role === 'admin') dist.admins = Number(r.count);
      if (r.role === 'ceo') dist.ceos = Number(r.count);
    });
    res.json(dist);
  } catch (error) {
    res.status(500).json({ message: 'Server error loading role distribution.' });
  }
};

// ============================================
// GET /api/admin/users
// ⭐ Returns last_login (real timestamp) + created_at
// ============================================
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         name,
         email,
         role,
         status,
         created_at AS "createdAt",
         last_login AS "lastLogin"
       FROM users
       ORDER BY id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error loading users.' });
  }
};

// ============================================
// POST /api/admin/users
// ============================================
export const createUser = async (req, res) => {
  const { name, email, role, password } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email, and role are required.' });
  }

  if (!['farmer', 'staff', 'admin', 'ceo'].includes(role)) {
    return res.status(400).json({ message: 'Role must be farmer, staff, admin, or ceo.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanName = name.trim();
  const rawPassword = password && password.length > 0 ? password : 'password';

  if (rawPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, $4, 'Active')
       RETURNING id, name, email, role, status`,
      [cleanName, cleanEmail, rawPassword, role]
    );

    res.status(201).json({ success: true, message: 'User created.', user: result.rows[0] });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error creating user.' });
  }
};

// ============================================
// PUT /api/admin/users/:id
// ============================================
export const updateUser = async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, role } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role)
       WHERE id = $4
       RETURNING id, name, email, role, status`,
      [name, email ? email.toLowerCase().trim() : null, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ success: true, message: 'User updated.', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating user.' });
  }
};

// ============================================
// PATCH /api/admin/users/:id/toggle-status
// ============================================
export const toggleUserStatus = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE users
       SET status = CASE WHEN status = 'Active' THEN 'Inactive' ELSE 'Active' END
       WHERE id = $1
       RETURNING id, name, email, role, status`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      success: true,
      message: `User ${result.rows[0].status === 'Active' ? 'activated' : 'deactivated'}.`,
      user: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating user status.' });
  }
};

// ============================================
// Helper: map settings row to camelCase
// ============================================
const mapSettings = (s = {}) => ({
  ...s,
  ratePerKg: Number(s.rate_per_kg ?? 80),
  advanceRatePerKg: Number(s.advance_rate_per_kg ?? 30),
  cooperativeFee: Number(s.cooperative_fee ?? 1200),
  loanInterestRate: Number(s.loan_interest_rate ?? 5),
  seasonStart: s.season_start
    ? (typeof s.season_start === 'object'
        ? s.season_start.toISOString().split('T')[0]
        : String(s.season_start).split('T')[0])
    : '2026-06-01',
  seasonEnd: s.season_end
    ? (typeof s.season_end === 'object'
        ? s.season_end.toISOString().split('T')[0]
        : String(s.season_end).split('T')[0])
    : '2026-12-31',
  currentSeason: s.current_season || '2026',
  smsNotifications: Boolean(s.sms_notifications),
  emailNotifications: Boolean(s.email_notifications),
  maintenanceMode: Boolean(s.maintenance_mode),
  maintenanceMessage:
    s.maintenance_message ||
    'We are currently performing scheduled maintenance. Please check back shortly.',
  maintenanceStart: s.maintenance_start
    ? new Date(s.maintenance_start).toISOString().slice(0, 16)
    : '',
  maintenanceEnd: s.maintenance_end
    ? new Date(s.maintenance_end).toISOString().slice(0, 16)
    : '',
});

// ============================================
// GET /api/admin/settings
// ============================================
export const getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings LIMIT 1');
    const settings = result.rows[0] || {};
    res.json(mapSettings(settings));
  } catch (error) {
    res.status(500).json({ message: 'Server error loading settings.' });
  }
};

// ============================================
// PUT /api/admin/settings
// ============================================
export const updateSettings = async (req, res) => {
  const {
    ratePerKg,
    advanceRatePerKg,
    cooperativeFee,
    loanInterestRate,
    seasonStart,
    seasonEnd,
    currentSeason,
    smsNotifications,
    emailNotifications,
    maintenanceMode,
    maintenanceMessage,
    maintenanceStart,
    maintenanceEnd,
  } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM settings LIMIT 1');
    let result;

    if (existing.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO settings
           (rate_per_kg, advance_rate_per_kg, cooperative_fee, loan_interest_rate,
            season_start, season_end, current_season,
            sms_notifications, email_notifications, maintenance_mode,
            maintenance_message, maintenance_start, maintenance_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          ratePerKg,
          advanceRatePerKg,
          cooperativeFee,
          loanInterestRate,
          seasonStart || null,
          seasonEnd || null,
          currentSeason,
          smsNotifications,
          emailNotifications,
          maintenanceMode,
          maintenanceMessage || null,
          maintenanceStart || null,
          maintenanceEnd || null,
        ]
      );
    } else {
      result = await pool.query(
        `UPDATE settings SET
          rate_per_kg = COALESCE($1, rate_per_kg),
          advance_rate_per_kg = COALESCE($2, advance_rate_per_kg),
          cooperative_fee = COALESCE($3, cooperative_fee),
          loan_interest_rate = COALESCE($4, loan_interest_rate),
          season_start = COALESCE($5, season_start),
          season_end = COALESCE($6, season_end),
          current_season = COALESCE($7, current_season),
          sms_notifications = COALESCE($8, sms_notifications),
          email_notifications = COALESCE($9, email_notifications),
          maintenance_mode = COALESCE($10, maintenance_mode),
          maintenance_message = COALESCE($11, maintenance_message),
          maintenance_start = $12,
          maintenance_end = $13
         WHERE id = $14
         RETURNING *`,
        [
          ratePerKg,
          advanceRatePerKg,
          cooperativeFee,
          loanInterestRate,
          seasonStart || null,
          seasonEnd || null,
          currentSeason,
          smsNotifications,
          emailNotifications,
          maintenanceMode,
          maintenanceMessage || null,
          maintenanceStart || null,
          maintenanceEnd || null,
          existing.rows[0].id,
        ]
      );
    }

    res.json({
      success: true,
      message: 'Settings updated successfully.',
      settings: mapSettings(result.rows[0]),
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error updating settings.' });
  }
};

// ============================================
// GET /api/admin/audit-logs
// ============================================
export const getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
    const mapped = result.rows.map((log) => ({
      ...log,
      user: log.user_name,
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Server error loading audit logs.' });
  }
};

// ============================================
// GET /api/admin/charts
// ============================================
export const getChartData = async (req, res) => {
  try {
    const monthlyDeliveries = await pool.query(`
      SELECT
        TO_CHAR(date, 'Mon YYYY') AS month,
        SUM(weight) AS weight
      FROM deliveries
      WHERE date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(date, 'Mon YYYY'), DATE_TRUNC('month', date)
      ORDER BY DATE_TRUNC('month', date)
    `);

    const monthlyPayments = await pool.query(`
      SELECT
        TO_CHAR(date, 'Mon YYYY') AS month,
        SUM(amount) AS amount
      FROM transactions
      WHERE type = 'Payment' AND date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(date, 'Mon YYYY'), DATE_TRUNC('month', date)
      ORDER BY DATE_TRUNC('month', date)
    `);

    const roles = await pool.query(`
      SELECT role, COUNT(*) AS count FROM users GROUP BY role
    `);

    const roleData = { farmers: 0, staff: 0, admins: 0, ceos: 0 };
    roles.rows.forEach((r) => {
      if (r.role === 'farmer') roleData.farmers = Number(r.count);
      if (r.role === 'staff') roleData.staff = Number(r.count);
      if (r.role === 'admin') roleData.admins = Number(r.count);
      if (r.role === 'ceo') roleData.ceos = Number(r.count);
    });

    res.json({
      monthlyDeliveries: monthlyDeliveries.rows.map((r) => ({
        month: r.month,
        weight: Number(r.weight),
      })),
      monthlyPayments: monthlyPayments.rows.map((r) => ({
        month: r.month,
        amount: Number(r.amount),
      })),
      roleDistribution: roleData,
    });
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};