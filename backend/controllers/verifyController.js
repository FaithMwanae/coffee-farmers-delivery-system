import pool from '../config/pool.js';

// ============================================
// GET /api/verify/:receipt
// Public — anyone can verify a delivery receipt
// ============================================
export const verifyReceipt = async (req, res) => {
  const { receipt } = req.params;

  if (!receipt) {
    return res.status(400).json({ valid: false, message: 'Receipt number required.' });
  }

  try {
    const result = await pool.query(
      `SELECT
         d.id,
         d.receipt_no,
         d.date,
         d.weight,
         d.quality,
         d.notes,
         d.status,
         f.name AS farmer_name,
         f.member_no,
         f.location
       FROM deliveries d
       JOIN farmers f ON f.id = d.farmer_id
       WHERE d.receipt_no = $1
       LIMIT 1`,
      [receipt.toUpperCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        message: 'Receipt not found. Please check the number and try again.',
      });
    }

    const d = result.rows[0];

    res.json({
      valid: true,
      receipt: {
        receiptNo: d.receipt_no,
        date: d.date,
        weight: Number(d.weight),
        quality: d.quality,
        notes: d.notes,
        status: d.status,
        farmerName: d.farmer_name,
        memberNo: d.member_no,
        location: d.location,
      },
    });
  } catch (error) {
    console.error('Verify receipt error:', error);
    res.status(500).json({ valid: false, message: 'Server error.' });
  }
};