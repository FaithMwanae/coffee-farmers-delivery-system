import pool from '../config/pool.js';

// ============================================
// GET /api/ceo/dashboard
// ============================================
export const getDashboard = async (req, res) => {
  try {
    const [farmers, deliveries, transactions, payments, advancesPending] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM farmers'),
      pool.query('SELECT COALESCE(SUM(weight), 0) AS total, COUNT(*) AS count FROM deliveries'),
      pool.query('SELECT COUNT(*) FROM transactions'),
      pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'Payment'"),
      pool.query("SELECT COUNT(*) FROM transactions WHERE type = 'Advance' AND status = 'Pending'"),
    ]);

    res.json({
      totalFarmers: Number(farmers.rows[0].count),
      totalWeight: Number(deliveries.rows[0].total),
      totalDeliveries: Number(deliveries.rows[0].count),
      totalTransactions: Number(transactions.rows[0].count),
      totalPayments: Number(payments.rows[0].total),
      pendingAdvances: Number(advancesPending.rows[0].count),
      season: '2026',
    });
  } catch (error) {
    console.error('CEO dashboard error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ============================================
// GET /api/ceo/pending-advances
// ============================================
export const getPendingAdvances = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         t.id,
         t.date,
         t.amount,
         t.description,
         t.status,
         t.farmer_id,
         f.member_no,
         f.name AS farmer_name,
         f.phone,
         f.location,
         f.total_delivered
       FROM transactions t
       JOIN farmers f ON f.id = t.farmer_id
       WHERE t.type = 'Advance' AND t.status = 'Pending'
       ORDER BY t.date DESC, t.id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Pending advances error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ============================================
// POST /api/ceo/advances/:id/approve
// ============================================
export const approveAdvance = async (req, res) => {
  const id = Number(req.params.id);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const check = await client.query(
      "SELECT * FROM transactions WHERE id = $1 AND type = 'Advance'",
      [id]
    );
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Advance not found.' });
    }

    const tx = check.rows[0];
    if (tx.status !== 'Pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Advance already ${tx.status.toLowerCase()}.` });
    }

    await client.query(
      "UPDATE transactions SET status = 'Completed' WHERE id = $1",
      [id]
    );

    await client.query(
      `INSERT INTO audit_logs (user_name, role, action, details, ip)
       VALUES ($1, $2, 'APPROVE_ADVANCE', $3, $4)`,
      [
        req.user.name,
        req.user.role,
        `Approved advance #${id} (KES ${tx.amount})`,
        req.ip || '127.0.0.1',
      ]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Advance approved.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve advance error:', error);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ============================================
// POST /api/ceo/advances/:id/reject
// ============================================
export const rejectAdvance = async (req, res) => {
  const id = Number(req.params.id);
  const { reason } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const check = await client.query(
      "SELECT * FROM transactions WHERE id = $1 AND type = 'Advance'",
      [id]
    );
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Advance not found.' });
    }

    await client.query(
      "UPDATE transactions SET status = 'Rejected', description = description || ' [Rejected: ' || $1 || ']' WHERE id = $2",
      [reason || 'Not specified', id]
    );

    await client.query(
      `INSERT INTO audit_logs (user_name, role, action, details, ip)
       VALUES ($1, $2, 'REJECT_ADVANCE', $3, $4)`,
      [
        req.user.name,
        req.user.role,
        `Rejected advance #${id}: ${reason || 'no reason'}`,
        req.ip || '127.0.0.1',
      ]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Advance rejected.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reject advance error:', error);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ============================================
// GET /api/ceo/charts
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
    console.error('CEO chart error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};