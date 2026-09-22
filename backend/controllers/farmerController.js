import pool from '../config/pool.js';

// Helper: get farmer profile for the logged-in user
const getFarmerForUser = async (userId) => {
  const result = await pool.query('SELECT * FROM farmers WHERE user_id = $1', [userId]);
  return result.rows[0];
};

// GET /api/farmer/dashboard
export const getDashboard = async (req, res) => {
  try {
    const farmer = await getFarmerForUser(req.user.id);
    if (!farmer) return res.status(404).json({ message: 'Farmer profile not found.' });

    const deliveries = await pool.query(
      'SELECT * FROM deliveries WHERE farmer_id = $1 ORDER BY date DESC LIMIT 5',
      [farmer.id]
    );

    const txResult = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'Advance' THEN amount END), 0) AS advances,
        COALESCE(SUM(CASE WHEN type = 'Payment' THEN amount END), 0) AS payments
       FROM transactions WHERE farmer_id = $1`,
      [farmer.id]
    );

    const announcements = await pool.query(
      'SELECT * FROM announcements ORDER BY date DESC LIMIT 3'
    );

    const { advances, payments } = txResult.rows[0];
    const totalDelivered = Number(farmer.total_delivered || 0);

    // Get current rate from settings
    const settingsRes = await pool.query('SELECT rate_per_kg FROM settings LIMIT 1');
    const rate = Number(settingsRes.rows[0]?.rate_per_kg || 80);

    const mappedDeliveries = deliveries.rows.map((d) => ({
      ...d,
      receipt: d.receipt_no,
      weight: Number(d.weight),
    }));

    res.json({
      season: '2026',
      totalDeliveries: totalDelivered,
      pendingPayment: totalDelivered * rate - Number(advances),
      advancesTaken: Number(advances),
      totalPaid: Number(payments),
      recentDeliveries: mappedDeliveries,
      announcements: announcements.rows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error loading dashboard.' });
  }
};

// GET /api/farmer/deliveries
export const getMyDeliveries = async (req, res) => {
  try {
    const farmer = await getFarmerForUser(req.user.id);
    if (!farmer) return res.status(404).json({ message: 'Farmer profile not found.' });

    const result = await pool.query(
      'SELECT * FROM deliveries WHERE farmer_id = $1 ORDER BY date DESC',
      [farmer.id]
    );

    const mapped = result.rows.map((d) => ({
      ...d,
      receipt: d.receipt_no,
      weight: Number(d.weight),
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Server error loading deliveries.' });
  }
};

// GET /api/farmer/transactions
export const getMyTransactions = async (req, res) => {
  try {
    const farmer = await getFarmerForUser(req.user.id);
    if (!farmer) return res.status(404).json({ message: 'Farmer profile not found.' });

    const result = await pool.query(
      'SELECT * FROM transactions WHERE farmer_id = $1 ORDER BY date DESC',
      [farmer.id]
    );

    const mapped = result.rows.map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Server error loading transactions.' });
  }
};

// GET /api/farmer/announcements
export const getAnnouncements = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM announcements ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error loading announcements.' });
  }
};

// GET /api/farmer/forms
export const getForms = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM forms ORDER BY upload_date DESC');
    const mapped = result.rows.map((f) => ({
      ...f,
      uploadDate: f.upload_date,
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Server error loading forms.' });
  }
};

// GET /api/farmer/profile
export const getProfile = async (req, res) => {
  try {
    const farmer = await getFarmerForUser(req.user.id);
    if (!farmer) return res.status(404).json({ message: 'Farmer profile not found.' });

    res.json({
      ...farmer,
      memberNo: farmer.member_no,
      totalDelivered: Number(farmer.total_delivered),
      joinDate: farmer.join_date,
      email: req.user.email,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error loading profile.' });
  }
};

// PUT /api/farmer/profile
export const updateProfile = async (req, res) => {
  try {
    const farmer = await getFarmerForUser(req.user.id);
    if (!farmer) return res.status(404).json({ message: 'Farmer profile not found.' });

    const { phone, location, name } = req.body;

    if (name) {
      await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, req.user.id]);
    }

    const result = await pool.query(
      `UPDATE farmers
       SET phone = COALESCE($1, phone),
           location = COALESCE($2, location),
           name = COALESCE($3, name)
       WHERE id = $4
       RETURNING *`,
      [phone, location, name, farmer.id]
    );

    const updated = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      farmer: {
        ...updated,
        memberNo: updated.member_no,
        totalDelivered: Number(updated.total_delivered),
        joinDate: updated.join_date,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
};
// ============================================
// POST /api/farmer/enable
// Allows any authenticated user to register as a farmer
// ============================================
export const enableFarmerProfile = async (req, res) => {
  const { phone, location, coffeeTrees } = req.body;

  if (!phone || !location) {
    return res.status(400).json({ message: 'Phone and location are required.' });
  }

  const numTrees = Number(coffeeTrees);
  if (isNaN(numTrees) || !Number.isInteger(numTrees) || numTrees <= 0) {
    return res.status(400).json({
      message: 'Number of coffee trees must be a positive integer.',
    });
  }

  try {
    // Check if already a farmer
    const existing = await pool.query(
      'SELECT * FROM farmers WHERE user_id = $1',
      [req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: 'You already have a farmer profile.',
        farmer: existing.rows[0],
      });
    }

    // Generate member number
    const countRes = await pool.query('SELECT COUNT(*) FROM farmers');
    const nextNum = 100 + Number(countRes.rows[0].count) + 1;
    const memberNo = `KFCS-${String(nextNum).padStart(5, '0')}`;

    // Create farmer profile for this user (any role)
    const result = await pool.query(
      `INSERT INTO farmers
        (user_id, member_no, name, phone, location, coffee_trees, total_delivered, status)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 'Active')
       RETURNING *`,
      [req.user.id, memberNo, req.user.name, phone.trim(), location.trim(), numTrees]
    );

    // Audit log
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_name, role, action, details, ip)
         VALUES ($1, $2, 'ENABLE_FARMER_PROFILE', $3, $4)`,
        [
          req.user.name || req.user.email,
          req.user.role,
          `Enabled farmer profile (${memberNo})`,
          req.ip || '127.0.0.1',
        ]
      );
    } catch (e) { /* non-blocking */ }

    res.status(201).json({
      success: true,
      message: `You are now registered as a farmer (${memberNo}).`,
      farmer: result.rows[0],
    });
  } catch (error) {
    console.error('Enable farmer profile error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};