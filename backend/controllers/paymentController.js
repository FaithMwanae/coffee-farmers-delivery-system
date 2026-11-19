import pool from '../config/pool.js';
import { sendB2CPayment } from '../services/mpesaService.js';

// ============================================================
// POST /api/payments/release/:farmerId
// Release a single payment to a farmer
// ============================================================
export const releasePayment = async (req, res) => {
  const { farmerId } = req.params;
  const { amount, method, reference } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify Farmer exists and get their phone number
    const farmerRes = await client.query(
      'SELECT name, phone, mpesa_number FROM farmers WHERE id = $1',
      [farmerId]
    );
    if (farmerRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Farmer not found.' });
    }
    const farmer = farmerRes.rows[0];

    // ⭐ FIX: Clean the phone number before sending to Safaricom
    let phoneToUse = farmer.mpesa_number || farmer.phone;
    if (!phoneToUse) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Farmer has no phone number on file.' });
    }

    // Remove non-digits (+, spaces, dashes)
    phoneToUse = phoneToUse.replace(/\D/g, '');
    // Convert 07... to 2547...
    if (phoneToUse.startsWith('0')) phoneToUse = '254' + phoneToUse.slice(1);
    // Ensure it's strictly 12 digits (254 + 9 digits)
    if (phoneToUse.length > 12) phoneToUse = phoneToUse.slice(0, 12);

    let txStatus = 'Completed';
    let mpesaRef = reference || `PAY-${Date.now()}`;

    // 2. If M-Pesa, trigger the B2C API
    if (method === 'M-Pesa') {
      try {
        const b2cResponse = await sendB2CPayment({
          phone: phoneToUse,
          amount: Number(amount),
          remarks: `Coffee payment for ${farmer.name}`,
          occasion: 'KFCS Payout',
        });

        // Safaricom accepted the request, it is now Pending callback
        txStatus = 'Pending';
        mpesaRef = b2cResponse.OriginatorConversationID || b2cResponse.reference;
        
      } catch (mpesaError) {
        const errorDetails = mpesaError.response?.data || mpesaError.message;
        console.error('Safaricom B2C Error:', JSON.stringify(errorDetails, null, 2));
        
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: 'M-Pesa rejected the request', 
          details: errorDetails 
        });
      }
    }

    // 3. Save the transaction to the database
    const txRes = await client.query(
      `INSERT INTO transactions 
        (farmer_id, type, amount, description, status, reference, payment_method, released_by, released_at)
       VALUES ($1, 'Payment', $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        farmerId,
        Number(amount),
        `Season Payout (${method})`,
        txStatus,
        mpesaRef,
        method,
        req.user.id
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: method === 'M-Pesa' 
        ? 'M-Pesa B2C initiated. Awaiting Safaricom confirmation.' 
        : 'Payment recorded successfully.',
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
// POST /api/payments/mpesa/b2c-callback
// Safaricom calls this URL when the payment succeeds or fails
// ============================================================
export const mpesaB2CCallback = async (req, res) => {
  try {
    const result = req.body?.Result;
    if (!result) return res.status(400).json({ message: 'Invalid callback body' });

    const { OriginatorConversationID, ResultCode, ResultDesc, TransactionReceipt } = result;

    console.log(`[B2C Callback] Ref: ${OriginatorConversationID}, Code: ${ResultCode}, Desc: ${ResultDesc}`);

    // Update the transaction in the database based on the callback
    await pool.query(
      `UPDATE transactions 
       SET status = $1, mpesa_receipt = $2, notes = $3
       WHERE reference = $4`,
      [
        ResultCode === 0 ? 'Completed' : 'Failed',
        TransactionReceipt || null,
        ResultDesc,
        OriginatorConversationID
      ]
    );

    // Safaricom expects a 200 OK response with this specific JSON
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('B2C Callback Error:', error);
    res.status(500).end();
  }
};

// ============================================================
// POST /api/payments/mpesa/timeout
// Safaricom calls this if the request times out
// ============================================================
export const mpesaTimeout = async (req, res) => {
  console.log('M-Pesa Timeout:', req.body);
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
};