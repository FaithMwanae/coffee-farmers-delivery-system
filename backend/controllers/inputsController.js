import pool from '../config/pool.js';

// GET /api/staff/inputs
export const getAllInputs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, f.name AS farmer_name, f.member_no
       FROM inputs i
       JOIN farmers f ON f.id = i.farmer_id
       ORDER BY i.date DESC, i.id DESC`
    );

    res.json(result.rows.map((r) => ({
      id: r.id,
      farmerId: r.farmer_id,
      farmerName: r.farmer_name,
      memberNo: r.member_no,
      inputType: r.input_type,
      description: r.description,
      quantity: Number(r.quantity),
      unit: r.unit,
      unitCost: Number(r.unit_cost),
      totalCost: Number(r.total_cost),
      date: r.date,
      status: r.status,
    })));
  } catch (error) {
    console.error('Get inputs error:', error);
    res.status(500).json({ message: 'Server error loading inputs.' });
  }
};

// POST /api/staff/inputs
export const recordInput = async (req, res) => {
  const { farmerId, inputType, description, quantity, unit, unitCost } = req.body;
  const qty = Number(quantity) || 1;
  const cost = Number(unitCost) || 0;
  const total = qty * cost;

  if (!farmerId || !inputType) {
    return res.status(400).json({ message: 'Farmer and input type are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const farmerRes = await client.query('SELECT id, name, member_no FROM farmers WHERE id = $1', [farmerId]);
    if (farmerRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Farmer not found.' });
    }
    const farmer = farmerRes.rows[0];

    // 1. Save the input
    const inputRes = await client.query(
      `INSERT INTO inputs (farmer_id, input_type, description, quantity, unit, unit_cost, total_cost, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [farmerId, inputType, description || null, qty, unit || 'unit', cost, total, req.user.name]
    );
    const input = inputRes.rows[0];

    // 2. Automatically create a Deduction transaction (if cost > 0)
    if (total > 0) {
      await client.query(
        `INSERT INTO transactions (farmer_id, type, amount, description, status, input_id, requested_by)
         VALUES ($1, 'Deduction', $2, $3, 'Completed', $4, 'staff')`,
        [
          farmerId, 
          total, 
          `Input: ${qty} ${unit} ${inputType}${description ? ` (${description})` : ''}`,
          input.id
        ]
      );
    }

    await client.query(
      `INSERT INTO audit_logs (user_name, role, action, details, ip) VALUES ($1, $2, 'RECORD_INPUT', $3, $4)`,
      [req.user.name, req.user.role, `Allocated ${qty} ${unit} ${inputType} to ${farmer.name} (KES ${total})`, req.ip || '127.0.0.1']
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: `Input recorded for ${farmer.name}` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Record input error:', error);
    res.status(500).json({ message: 'Server error recording input.' });
  } finally {
    client.release();
  }
};