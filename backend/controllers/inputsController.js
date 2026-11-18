import pool from '../config/pool.js';

// GET /api/staff/inputs
export const getAllInputs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, f.name AS farmer_name, f.member_no
       FROM inputs i JOIN farmers f ON f.id = i.farmer_id
       ORDER BY i.date DESC, i.id DESC`
    );
    res.json(result.rows.map((r) => ({
      id: r.id, farmerId: r.farmer_id, farmerName: r.farmer_name, memberNo: r.member_no,
      inputType: r.input_type, description: r.description, quantity: Number(r.quantity),
      unit: r.unit, unitCost: Number(r.unit_cost), totalCost: Number(r.total_cost),
      date: r.date, status: r.status, requestedBy: r.requested_by,
      upfrontPercentage: Number(r.upfront_percentage || 0),
      upfrontAmount: Number(r.upfront_amount || 0),
      deductedAmount: Number(r.deducted_amount || 0),
      upfrontPaymentMethod: r.upfront_payment_method, // ⭐ Added
      upfrontPaymentReference: r.upfront_payment_reference, // ⭐ Added
    })));
  } catch (error) {
    console.error('Get inputs error:', error);
    res.status(500).json({ message: 'Server error loading inputs.' });
  }
};

// GET /api/staff/inputs/count
export const getPendingInputsCount = async (req, res) => {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM inputs WHERE status = 'Requested'`);
    res.json({ count: Number(result.rows[0].count) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/staff/inputs/:id/status
export const updateInputStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  try {
    const result = await pool.query(
      `UPDATE inputs SET status = $1 WHERE id = $2 AND status = 'Requested' RETURNING *`,
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Request not found or already processed.' });
    
    res.json({ success: true, message: `Request ${status.toLowerCase()}.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/staff/inputs/:id/issue
export const issueInput = async (req, res) => {
  const { id } = req.params;
  // ⭐ NEW: Accept payment details
  const { unitCost, upfrontPercentage, paymentMethod, reference } = req.body;
  
  const cost = Number(unitCost) || 0;
  const upPercent = Number(upfrontPercentage) >= 0 ? Number(upfrontPercentage) : 25;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inputRes = await client.query(`SELECT * FROM inputs WHERE id = $1 AND status = 'Approved'`, [id]);
    if (inputRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Input not found or not approved.' });
    }
    
    const input = inputRes.rows[0];
    const total = Number(input.quantity) * cost;
    const upfrontAmount = total * (upPercent / 100);
    const deductedAmount = total - upfrontAmount;

    // 1. Mark as Issued and set financials + payment details
    await client.query(
      `UPDATE inputs 
       SET status = 'Issued', unit_cost = $1, total_cost = $2, 
           upfront_percentage = $3, upfront_amount = $4, deducted_amount = $5, 
           upfront_payment_method = $6, upfront_payment_reference = $7, date = NOW()
       WHERE id = $8`,
      [cost, total, upPercent, upfrontAmount, deductedAmount, paymentMethod || 'Cash', reference || null, id]
    );

    // 2. Create Upfront Payment Transaction (if any)
    if (upfrontAmount > 0) {
      await client.query(
        `INSERT INTO transactions (farmer_id, type, amount, description, status, input_id, requested_by, payment_method, reference)
         VALUES ($1, 'Payment', $2, $3, 'Completed', $4, 'staff', $5, $6)`,
        [
          input.farmer_id, 
          upfrontAmount, 
          `Upfront (${upPercent}%) for ${input.quantity} ${input.unit} ${input.input_type}`, 
          id,
          paymentMethod || 'Cash',
          reference || null
        ]
      );
    }

    // 3. Create Deduction Transaction (if any)
    if (deductedAmount > 0) {
      await client.query(
        `INSERT INTO transactions (farmer_id, type, amount, description, status, input_id, requested_by)
         VALUES ($1, 'Deduction', $2, $3, 'Completed', $4, 'staff')`,
        [input.farmer_id, deductedAmount, `Deduction for ${input.quantity} ${input.unit} ${input.input_type}`, id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Input issued and financials updated.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Issue input error:', error);
    res.status(500).json({ message: 'Server error issuing input.' });
  } finally {
    client.release();
  }
};

// POST /api/staff/inputs (Direct Entry)
export const recordInput = async (req, res) => {
  // You can keep your existing logic for direct entry here.
  // If you want direct entry to also collect payment method, add the same fields here.
};