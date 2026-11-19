import pool from '../config/pool.js';
import { sendB2CPayment, initiateStkPush } from '../services/mpesaService.js'; // ⭐ Added initiateStkPush

// ============================================================
// POST /api/payments/release/:farmerId
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

    // Clean the phone number
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
// POST /api/payments/collect/stk
// Trigger an STK Push (Request money from farmer)
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

    // Trigger the STK push via Safaricom
    const stkResponse = await initiateStkPush({
      phone: phoneToUse,
      amount: Number(amount),
      accountRef: accountRef || farmer.name,
      description: description || 'Input Payment'
    });

    // Save as Pending in database so we can match the callback later
    await pool.query(
      `INSERT INTO transactions 
        (farmer_id, type, amount, description, status, reference, payment_method)
       VALUES ($1, 'Payment', $2, $3, 'Pending', $4, 'M-Pesa STK')`,
      [farmerId, Number(amount), description || 'Input Upfront', stkResponse.CheckoutRequestID]
    );

    res.json({
      success: true,
      message: 'STK Push sent! Farmer should check their phone.',
      checkoutRequestId: stkResponse.CheckoutRequestID
    });

  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('STK Push Error:', JSON.stringify(errorDetails, null, 2));
    res.status(400).json({ message: 'Failed to send STK push', details: errorDetails });
  }
};

// ============================================================
// POST /api/payments/mpesa/b2c-callback
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

// ============================================================
// POST /api/payments/mpesa/stk-callback
// Safaricom calls this when the farmer enters their PIN
// ============================================================
export const mpesaStkCallback = async (req, res) => {
  try {
    const cb = req.body?.Body?.stkCallback;
    if (!cb) return res.status(400).json({ message: 'Invalid callback' });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = cb;
    const items = CallbackMetadata?.Item || [];
    const get = (name) => items.find((i) => i.Name === name)?.Value;

    const receipt = get('MpesaReceiptNumber');

    console.log(`[STK Callback] ID: ${CheckoutRequestID}, Code: ${ResultCode}`);

    await pool.query(
      `UPDATE transactions 
       SET status = $1, mpesa_receipt = $2, notes = $3
       WHERE reference = $4`,
      [ResultCode === 0 ? 'Completed' : 'Failed', receipt || null, ResultDesc, CheckoutRequestID]
    );

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('STK Callback Error:', error);
    res.status(500).end();
  }
};

// ============================================================
// POST /api/payments/mpesa/timeout
// ============================================================
export const mpesaTimeout = async (req, res) => {
  console.log('M-Pesa Timeout:', req.body);
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
};