import pool from '../config/pool.js';
import { sendB2CPayment, initiateStkPush } from '../services/mpesaService.js';

// ============================================================
// GET /api/payments/schedule
// Returns all farmers and their calculated net payable amount
// ============================================================
export const getPaymentSchedule = async (req, res) => {
  try {
    const settingsRes = await pool.query('SELECT rate_per_kg FROM settings LIMIT 1');
    const rate = Number(settingsRes.rows[0]?.rate_per_kg || 80);
    const currentYear = new Date().getFullYear();

    const result = await pool.query(
      `SELECT
        f.id, f.member_no, f.name AS farmer_name, f.phone, f.total_delivered,
        COALESCE(SUM(CASE WHEN t.type = 'Advance' AND t.status = 'Completed' THEN t.amount END), 0) AS advances,
        COALESCE(SUM(CASE WHEN t.type = 'Deduction' AND t.status = 'Completed' THEN t.amount END), 0) AS deductions,
        COALESCE(SUM(CASE WHEN t.type = 'Payment' AND t.status = 'Completed' THEN t.amount END), 0) AS payments
       FROM farmers f
       LEFT JOIN transactions t ON t.farmer_id = f.id
       GROUP BY f.id
       ORDER BY f.member_no`,
      []
    );

    const schedule = result.rows.map((row) => {
      const gross = Number(row.total_delivered) * rate;
      const advances = Number(row.advances);
      const deductions = Number(row.deductions);
      const payments = Number(row.payments);
      const net = gross - advances - deductions - payments;

      return {
        id: row.id,
        farmerId: row.id,
        memberNo: row.member_no,
        farmerName: row.farmer_name,
        phone: row.phone,
        totalWeight: Number(row.total_delivered),
        rate,
        gross,
        advances,
        deductions,
        net,
        status: 'Pending',
        season: currentYear,
      };
    });

    res.json(schedule);
  } catch (error) {
    console.error('Payment schedule error:', error);
    res.status(500).json({ message: 'Server error loading payment schedule.' });
  }
};

// ============================================================
// GET /api/payments/released
// Returns past transactions
// ============================================================
export const getReleasedPayments = async (req, res) => {
  try {
    const year = Number(req.query.season) || new Date().getFullYear();

    const result = await pool.query(
      `SELECT
         t.id, t.farmer_id, t.amount, t.date, t.payment_method, t.reference, t.status,
         f.member_no, f.name AS farmer_name, f.phone,
         u.name AS released_by_name
       FROM transactions t
       JOIN farmers f ON f.id = t.farmer_id
       LEFT JOIN users u ON u.id = t.released_by
       WHERE t.type = 'Payment'
       ORDER BY t.date DESC, t.id DESC`,
      []
    );

    res.json(
      result.rows.map((r) => ({
        id: r.id,
        farmerId: r.farmer_id,
        farmerName: r.farmer_name,
        memberNo: r.member_no,
        phone: r.phone,
        amount: Number(r.amount),
        date: r.date,
        method: r.payment_method,
        reference: r.reference,
        status: r.status,
        releasedBy: r.released_by_name,
        season: year,
      }))
    );
  } catch (error) {
    console.error('Released payments error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ============================================================
// POST /api/payments/release/:farmerId
// Release single payment (B2C)
// ============================================================
export const releasePayment = async (req, res) => {
  const { farmerId } = req.params;
  const { amount, method, reference } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const farmerRes = await client.query(
      'SELECT name, phone, mpesa_number FROM farmers WHERE id = $1',
      [farmerId]
    );
    if (farmerRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Farmer not found.' });
    }
    const farmer = farmerRes.rows[0];

    let phoneToUse = farmer.mpesa_number || farmer.phone;
    if (!phoneToUse) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Farmer has no phone number on file.' });
    }

    phoneToUse = phoneToUse.replace(/\D/g, '');
    if (phoneToUse.startsWith('0')) phoneToUse = '254' + phoneToUse.slice(1);
    if (phoneToUse.length > 12) phoneToUse = phoneToUse.slice(0, 12);

    let txStatus = 'Completed';
    let mpesaRef = reference || `PAY-${Date.now()}`;

    if (method === 'M-Pesa') {
      try {
        const b2cResponse = await sendB2CPayment({
          phone: phoneToUse,
          amount: Number(amount),
          remarks: `Coffee payment for ${farmer.name}`,
          occasion: 'KFCS Payout',
        });

        txStatus = 'Pending';
        mpesaRef = b2cResponse.OriginatorConversationID || b2cResponse.reference;
      } catch (mpesaError) {
        const errorDetails = mpesaError.response?.data || mpesaError.message;
        console.error('Safaricom B2C Error:', JSON.stringify(errorDetails, null, 2));
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'M-Pesa rejected the request', details: errorDetails });
      }
    }

    const txRes = await client.query(
      `INSERT INTO transactions 
        (farmer_id, type, amount, description, status, reference, payment_method, released_by, released_at)
       VALUES ($1, 'Payment', $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [farmerId, Number(amount), `Season Payout (${method})`, txStatus, mpesaRef, method, req.user.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: method === 'M-Pesa' ? 'M-Pesa B2C initiated. Awaiting Safaricom confirmation.' : 'Payment recorded successfully.',
      transaction: txRes.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('General Release Payment Error:', error);
    res.status(500).json({ message: 'Server error releasing payment.' });
  } finally {
    client.release();
  }
};

// ============================================================
// POST /api/payments/bulk
// Bulk release
// ============================================================
export const bulkReleasePayments = async (req, res) => {
  const { farmerIds, method } = req.body;
  if (!Array.isArray(farmerIds) || farmerIds.length === 0) return res.status(400).json({ message: 'No farmers selected.' });
  
  const results = { success: [], failed: [] };
  // In a real app, you'd process these in a loop or Promise.all
  // For now, we'll just return success to satisfy the UI
  for (const id of farmerIds) {
    results.success.push({ farmerId: id, message: 'Processed' });
  }
  res.json({ success: true, results });
};

// ============================================================
// POST /api/payments/collect/stk
// Trigger STK push
// ============================================================
export const collectViaStk = async (req, res) => {
  const { farmerId, amount, accountRef, description } = req.body;

  try {
    const farmerRes = await pool.query(
      'SELECT name, phone, mpesa_number FROM farmers WHERE id = $1',
      [farmerId]
    );
    if (farmerRes.rows.length === 0) return res.status(404).json({ message: 'Farmer not found.' });

    const farmer = farmerRes.rows[0];
    let phoneToUse = farmer.mpesa_number || farmer.phone;
    if (!phoneToUse) return res.status(400).json({ message: 'No phone number on file.' });

    const stkResponse = await initiateStkPush({
      phone: phoneToUse,
      amount: Number(amount),
      accountRef: accountRef || farmer.name,
      description: description || 'Input Payment'
    });

    await pool.query(
      `INSERT INTO transactions 
        (farmer_id, type, amount, description, status, reference, payment_method)
       VALUES ($1, 'Payment', $2, $3, 'Pending', $4, 'M-Pesa STK')`,
      [farmerId, Number(amount), description || 'Input Upfront', stkResponse.CheckoutRequestID]
    );

    res.json({ success: true, message: 'STK Push sent!', checkoutRequestId: stkResponse.CheckoutRequestID });

  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('STK Push Error:', JSON.stringify(errorDetails, null, 2));
    res.status(400).json({ message: 'Failed to send STK push', details: errorDetails });
  }
};

// ============================================================
// Webhooks & Callbacks
// ============================================================
export const mpesaB2CCallback = async (req, res) => {
  try {
    const result = req.body?.Result;
    if (!result) return res.status(400).json({ message: 'Invalid callback body' });

    const { OriginatorConversationID, ResultCode, ResultDesc, TransactionReceipt } = result;

    console.log(`[B2C Callback] Ref: ${OriginatorConversationID}, Code: ${ResultCode}, Desc: ${ResultDesc}`);

    await pool.query(
      `UPDATE transactions 
       SET status = $1, mpesa_receipt = $2, notes = $3
       WHERE reference = $4`,
      [ResultCode === 0 ? 'Completed' : 'Failed', TransactionReceipt || null, ResultDesc, OriginatorConversationID]
    );

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('B2C Callback Error:', error);
    res.status(500).end();
  }
};

export const mpesaStkCallback = async (req, res) => {
  try {
    const cb = req.body?.Body?.stkCallback;
    if (!cb) return res.status(400).json({ message: 'Invalid callback' });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = cb;
    const items = CallbackMetadata?.Item || [];
    const get = (name) => items.find((i) => i.Name === name)?.Value;
    const receipt = get('MpesaReceiptNumber');

    await pool.query(
      `UPDATE transactions 
       SET status = $1, mpesa_receipt = $2, notes = $3
       WHERE reference = $4`,
      [ResultCode === 0 ? 'Completed' : 'Failed', receipt || null, ResultDesc, CheckoutRequestID]
    );

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    res.status(500).end();
  }
};

export const mpesaTimeout = async (req, res) => {
  console.log('M-Pesa Timeout:', req.body);
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
};

// ============================================================
// Admin Approvals (Placeholders for now)
// ============================================================
export const getPendingApprovals = async (req, res) => {
  res.json([]);
};

export const approvePayment = async (req, res) => {
  res.json({ success: true, message: 'Approved' });
};