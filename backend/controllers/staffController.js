import pool from '../config/pool.js';

// ============================================
// GET /api/staff/dashboard
// ============================================
export const getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todayRes = await pool.query(
      `SELECT COALESCE(SUM(weight), 0) AS total, COUNT(*) AS count
       FROM deliveries WHERE date = $1`,
      [today]
    );

    const farmersRes = await pool.query('SELECT COUNT(*) FROM farmers');

    const recentRes = await pool.query(
      `SELECT d.*, f.name AS farmer_name, f.member_no
       FROM deliveries d
       JOIN farmers f ON f.id = d.farmer_id
       ORDER BY d.date DESC, d.id DESC
       LIMIT 5`
    );

    res.json({
      todayIntake: Number(todayRes.rows[0].total),
      todayFarmers: Number(todayRes.rows[0].count),
      pendingPayments: Number(farmersRes.rows[0].count),
      totalFarmers: Number(farmersRes.rows[0].count),
      season: '2026',
      recentDeliveries: recentRes.rows.map((d) => ({
        id: d.id,
        receipt: d.receipt_no,
        receipt_no: d.receipt_no,
        farmerName: d.farmer_name,
        farmer_name: d.farmer_name,
        memberNo: d.member_no,
        member_no: d.member_no,
        weight: Number(d.weight),
        date: d.date,
        quality: d.quality,
        status: d.status,
      })),
    });
  } catch (error) {
    console.error('Staff dashboard error:', error);
    res.status(500).json({ message: 'Server error loading dashboard.' });
  }
};

// ============================================
// GET /api/staff/deliveries
// ============================================
export const getAllDeliveries = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, f.name AS farmer_name, f.member_no
       FROM deliveries d
       JOIN farmers f ON f.id = d.farmer_id
       ORDER BY d.date DESC, d.id DESC`
    );

    const mapped = result.rows.map((d) => ({
      id: d.id,
      farmerId: d.farmer_id,
      farmerName: d.farmer_name,
      farmer_name: d.farmer_name,
      memberNo: d.member_no,
      member_no: d.member_no,
      date: d.date,
      weight: Number(d.weight),
      receipt: d.receipt_no,
      receipt_no: d.receipt_no,
      quality: d.quality,
      notes: d.notes,
      status: d.status,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ message: 'Server error loading deliveries.' });
  }
};

// ============================================
// POST /api/staff/deliveries
// ============================================
export const recordDelivery = async (req, res) => {
  const { farmerId, weight, quality, notes } = req.body;

  if (!farmerId || !weight) {
    return res.status(400).json({ message: 'Farmer ID and weight are required.' });
  }

  if (Number(weight) <= 0) {
    return res.status(400).json({ message: 'Weight must be greater than zero.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const farmerRes = await client.query(
      'SELECT * FROM farmers WHERE id = $1',
      [farmerId]
    );
    if (farmerRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Farmer not found.' });
    }
    const farmer = farmerRes.rows[0];

    const lastRes = await client.query(
      `SELECT receipt_no FROM deliveries ORDER BY id DESC LIMIT 1`
    );
    let nextNo = 481;
    if (lastRes.rows.length > 0) {
      const match = lastRes.rows[0].receipt_no.match(/(\d+)$/);
      if (match) nextNo = parseInt(match[1]) + 1;
    }
    const receiptNo = `KAL-2026-${String(nextNo).padStart(4, '0')}`;

    const deliveryRes = await client.query(
      `INSERT INTO deliveries (farmer_id, weight, receipt_no, quality, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'Processed')
       RETURNING *`,
      [farmerId, weight, receiptNo, quality || 'Good', notes || '']
    );

    const updatedFarmer = await client.query(
      `UPDATE farmers
       SET total_delivered = total_delivered + $1
       WHERE id = $2
       RETURNING *`,
      [weight, farmerId]
    );

    await client.query(
      `INSERT INTO audit_logs (user_name, role, action, details, ip)
       VALUES ($1, $2, 'RECORD_DELIVERY', $3, $4)`,
      [
        req.user.name || req.user.email,
        req.user.role,
        `Recorded ${weight} kg for ${farmer.name} (${receiptNo})`,
        req.ip || '127.0.0.1',
      ]
    );

    await client.query('COMMIT');

    const savedDelivery = deliveryRes.rows[0];
    const cumulative = Number(updatedFarmer.rows[0].total_delivered);

    res.status(201).json({
      success: true,
      message: `Delivery recorded for ${farmer.name}`,
      delivery: {
        id: savedDelivery.id,
        farmerId: savedDelivery.farmer_id,
        farmerName: farmer.name,
        memberNo: farmer.member_no,
        member_no: farmer.member_no,
        date: savedDelivery.date,
        weight: Number(savedDelivery.weight),
        receipt: savedDelivery.receipt_no,
        receipt_no: savedDelivery.receipt_no,
        quality: savedDelivery.quality,
        notes: savedDelivery.notes,
        status: savedDelivery.status,
        cumulativeTotal: cumulative,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Record delivery error:', error);
    res.status(500).json({ message: 'Server error recording delivery.' });
  } finally {
    client.release();
  }
};

// ============================================
// GET /api/staff/farmers
// ============================================
export const getAllFarmers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        f.*,
        u.email,
        u.status AS user_status
       FROM farmers f
       LEFT JOIN users u ON u.id = f.user_id
       ORDER BY f.id`
    );

    const mapped = result.rows.map((f) => ({
      id: f.id,
      userId: f.user_id,
      memberNo: f.member_no,
      member_no: f.member_no,
      name: f.name,
      phone: f.phone,
      location: f.location,
      coffeeTrees: f.coffee_trees,
      coffee_trees: f.coffee_trees,
      totalDelivered: Number(f.total_delivered),
      total_delivered: Number(f.total_delivered),
      status: f.status,
      joinDate: f.join_date,
      join_date: f.join_date,
      email: f.email,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Get farmers error:', error);
    res.status(500).json({ message: 'Server error loading farmers.' });
  }
};

// ============================================
// GET /api/staff/farmers/:id/advance-info
// ⭐ Returns advance eligibility for a farmer
// ============================================
export const getFarmerAdvanceInfo = async (req, res) => {
  const farmerId = Number(req.params.id);

  try {
    const farmerRes = await pool.query(
      'SELECT id, name, member_no, total_delivered FROM farmers WHERE id = $1',
      [farmerId]
    );
    if (farmerRes.rows.length === 0) {
      return res.status(404).json({ message: 'Farmer not found.' });
    }
    const farmer = farmerRes.rows[0];

    // Get advance rate from settings (default 30)
    const settingsRes = await pool.query(
      'SELECT advance_rate_per_kg FROM settings LIMIT 1'
    );
    const rate = Number(settingsRes.rows[0]?.advance_rate_per_kg || 30);

    // Sum all advances (Pending + Completed count against eligibility)
    const advanceRes = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status IN ('Pending','Completed') THEN amount END), 0) AS total,
         COALESCE(SUM(CASE WHEN status = 'Completed' THEN amount END), 0) AS approved,
         COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount END), 0) AS pending
       FROM transactions
       WHERE farmer_id = $1 AND type = 'Advance'`,
      [farmerId]
    );

    const totalAdvanced = Number(advanceRes.rows[0].total);
    const approvedAdvanced = Number(advanceRes.rows[0].approved);
    const pendingAdvanced = Number(advanceRes.rows[0].pending);

    const totalDelivered = Number(farmer.total_delivered);
    const eligible = totalDelivered * rate;
    const available = Math.max(0, eligible - totalAdvanced);

    res.json({
      farmerId: farmer.id,
      farmerName: farmer.name,
      memberNo: farmer.member_no,
      totalDelivered,
      rate,
      eligible,
      totalAdvanced,
      approvedAdvanced,
      pendingAdvanced,
      available,
    });
  } catch (error) {
    console.error('Get advance info error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ============================================
// POST /api/staff/farmers
// ============================================
export const registerFarmer = async (req, res) => {
  const { name, email, phone, location, coffeeTrees, password } = req.body;

  if (!name || !email || !phone || !location || !password) {
    return res.status(400).json({
      message: 'Name, email, phone, location, and password are required.',
    });
  }

  const numTrees = Number(coffeeTrees || 0);

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
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

    const userRes = await client.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, 'farmer', 'Active')
       RETURNING *`,
      [cleanName, cleanEmail, password]
    );
    const newUser = userRes.rows[0];

    const countRes = await client.query('SELECT COUNT(*) FROM farmers');
    const nextNum = 100 + Number(countRes.rows[0].count) + 1;
    const memberNo = `KFCS-${String(nextNum).padStart(5, '0')}`;

    const farmerRes = await client.query(
      `INSERT INTO farmers
        (user_id, member_no, name, phone, location, total_delivered, status)
       VALUES ($1, $2, $3, $4, $5, 0, 'Active')
       RETURNING *`,
      [newUser.id, memberNo, cleanName, phone.trim(), location.trim()]
    );
    const newFarmer = farmerRes.rows[0];

    await client.query(
      `INSERT INTO audit_logs (user_name, role, action, details, ip)
       VALUES ($1, $2, 'REGISTER_FARMER', $3, $4)`,
      [
        req.user.name || req.user.email,
        req.user.role,
        `Registered farmer ${cleanName} (${memberNo})`,
        req.ip || '127.0.0.1',
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Farmer ${cleanName} registered as ${memberNo}`,
      farmer: {
        id: newFarmer.id,
        userId: newFarmer.user_id,
        memberNo: newFarmer.member_no,
        member_no: newFarmer.member_no,
        name: newFarmer.name,
        phone: newFarmer.phone,
        location: newFarmer.location,
        totalDelivered: 0,
        status: newFarmer.status,
        joinDate: newFarmer.join_date,
        join_date: newFarmer.join_date,
        email: cleanEmail,
      },
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Register farmer error:', error);
    res.status(500).json({ message: 'Server error registering farmer.' });
  } finally {
    client.release();
  }
};

// ============================================
// GET /api/staff/transactions
// ============================================
export const getAllTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, f.name AS farmer_name, f.member_no
       FROM transactions t
       JOIN farmers f ON f.id = t.farmer_id
       ORDER BY t.date DESC, t.id DESC`
    );

    const mapped = result.rows.map((t) => ({
      id: t.id,
      farmerId: t.farmer_id,
      farmerName: t.farmer_name,
      farmer_name: t.farmer_name,
      memberNo: t.member_no,
      member_no: t.member_no,
      date: t.date,
      type: t.type,
      amount: Number(t.amount),
      description: t.description,
      status: t.status,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error loading transactions.' });
  }
};

// ============================================
// POST /api/staff/transactions
// ✅ Advances: enforced eligibility (kg × advance_rate_per_kg)
// ✅ Advances: status = 'Pending' (CEO approval)
// ============================================
export const recordTransaction = async (req, res) => {
  const { farmerId, type, amount, description } = req.body;

  if (!farmerId || !type || !amount || !description) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!['Advance', 'Deduction', 'Payment'].includes(type)) {
    return res.status(400).json({ message: 'Invalid transaction type.' });
  }

  if (Number(amount) <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than zero.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const farmerRes = await client.query(
      'SELECT * FROM farmers WHERE id = $1',
      [farmerId]
    );
    if (farmerRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Farmer not found.' });
    }
    const farmer = farmerRes.rows[0];

    // ⭐ ADVANCE VALIDATION — enforce kg-based eligibility
    if (type === 'Advance') {
      const settingsRes = await client.query(
        'SELECT advance_rate_per_kg FROM settings LIMIT 1'
      );
      const rate = Number(settingsRes.rows[0]?.advance_rate_per_kg || 30);

      const advRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM transactions
         WHERE farmer_id = $1 AND type = 'Advance' AND status IN ('Pending','Completed')`,
        [farmerId]
      );
      const alreadyAdvanced = Number(advRes.rows[0].total);

      const eligible = Number(farmer.total_delivered) * rate;
      const available = Math.max(0, eligible - alreadyAdvanced);

      if (Number(amount) > available) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Advance exceeds eligibility. Available: KES ${available.toLocaleString()} (delivered ${farmer.total_delivered} kg × KES ${rate}/kg − already advanced KES ${alreadyAdvanced.toLocaleString()}).`,
          available,
          eligible,
          alreadyAdvanced,
          rate,
        });
      }
    }

    // Advances → Pending (CEO approval required)
    const initialStatus = type === 'Advance' ? 'Pending' : 'Completed';

    const result = await client.query(
      `INSERT INTO transactions (farmer_id, type, amount, description, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [farmerId, type, amount, description, initialStatus]
    );
    const tx = result.rows[0];

    await client.query(
      `INSERT INTO audit_logs (user_name, role, action, details, ip)
       VALUES ($1, $2, 'RECORD_TRANSACTION', $3, $4)`,
      [
        req.user.name || req.user.email,
        req.user.role,
        `${type} of KES ${amount} for ${farmer.name} (${initialStatus})`,
        req.ip || '127.0.0.1',
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message:
        type === 'Advance'
          ? 'Advance recorded — pending CEO approval.'
          : 'Transaction recorded.',
      transaction: {
        id: tx.id,
        farmerId: tx.farmer_id,
        farmerName: farmer.name,
        farmer_name: farmer.name,
        memberNo: farmer.member_no,
        member_no: farmer.member_no,
        date: tx.date,
        type: tx.type,
        amount: Number(tx.amount),
        description: tx.description,
        status: tx.status,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Record transaction error:', error);
    res.status(500).json({ message: 'Server error recording transaction.' });
  } finally {
    client.release();
  }
};

// ============================================
// GET /api/staff/payments
// Only counts Completed transactions
// ============================================
export const getPaymentSchedule = async (req, res) => {
  try {
    const settingsRes = await pool.query('SELECT rate_per_kg FROM settings LIMIT 1');
    const rate = Number(settingsRes.rows[0]?.rate_per_kg || 80);

    const result = await pool.query(
      `SELECT
        f.id,
        f.member_no,
        f.name AS farmer_name,
        f.total_delivered,
        COALESCE(SUM(CASE WHEN t.type = 'Advance' AND t.status = 'Completed' THEN t.amount END), 0) AS advances,
        COALESCE(SUM(CASE WHEN t.type = 'Deduction' AND t.status = 'Completed' THEN t.amount END), 0) AS deductions,
        COALESCE(SUM(CASE WHEN t.type = 'Payment' AND t.status = 'Completed' THEN t.amount END), 0) AS payments
       FROM farmers f
       LEFT JOIN transactions t ON t.farmer_id = f.id
       GROUP BY f.id
       ORDER BY f.member_no`
    );

    const schedule = result.rows.map((row) => {
      const gross = Number(row.total_delivered) * rate;
      const advances = Number(row.advances);
      const deductions = Number(row.deductions);
      const payments = Number(row.payments);
      const net = gross - advances - deductions - payments;

      return {
        id: row.id,
        memberNo: row.member_no,
        farmerName: row.farmer_name,
        totalWeight: Number(row.total_delivered),
        rate,
        gross,
        advances,
        deductions,
        payments,
        net,
        status: 'Pending',
      };
    });

    res.json(schedule);
  } catch (error) {
    console.error('Payment schedule error:', error);
    res.status(500).json({ message: 'Server error loading payment schedule.' });
  }
};

// ============================================
// GET /api/staff/reports/summary
// ============================================
export const getReportSummary = async (req, res) => {
  try {
    const [farmersRes, deliveriesRes, txRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM farmers'),
      pool.query('SELECT COALESCE(SUM(weight), 0) AS total FROM deliveries'),
      pool.query('SELECT COUNT(*) FROM transactions'),
    ]);

    res.json({
      totalFarmers: Number(farmersRes.rows[0].count),
      totalWeight: Number(deliveriesRes.rows[0].total),
      totalTransactions: Number(txRes.rows[0].count),
      pendingPayments: Number(farmersRes.rows[0].count),
    });
  } catch (error) {
    console.error('Report summary error:', error);
    res.status(500).json({ message: 'Server error loading report summary.' });
  }
};

// ============================================
// GET /api/staff/charts
// ============================================
export const getChartData = async (req, res) => {
  try {
    const weeklyIntake = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('week', date), 'DD Mon') AS week,
        SUM(weight) AS weight
      FROM deliveries
      WHERE date >= NOW() - INTERVAL '8 weeks'
      GROUP BY DATE_TRUNC('week', date)
      ORDER BY DATE_TRUNC('week', date)
    `);

    const topFarmers = await pool.query(`
      SELECT name, total_delivered AS weight
      FROM farmers
      ORDER BY total_delivered DESC
      LIMIT 5
    `);

    res.json({
      weeklyIntake: weeklyIntake.rows.map((r) => ({
        week: r.week,
        weight: Number(r.weight),
      })),
      topFarmers: topFarmers.rows.map((r) => ({
        name: r.name,
        weight: Number(r.weight),
      })),
    });
  } catch (error) {
    console.error('Staff charts error:', error);
    res.status(500).json({ message: 'Server error loading chart data.' });
  }
};