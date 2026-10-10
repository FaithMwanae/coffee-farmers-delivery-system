import axios from 'axios';

const MPESA_BASE =
  process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

// Get OAuth token from Safaricom
const getAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const { data } = await axios.get(
    `${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  return data.access_token;
};

// Send money to a single phone number
export const sendB2CPayment = async ({ phone, amount, remarks, occasion }) => {
  const token = await getAccessToken();

  // Normalise phone: 0712345678 → 254712345678
  let msisdn = phone.replace(/\s/g, '');
  if (msisdn.startsWith('0')) msisdn = '254' + msisdn.slice(1);
  if (msisdn.startsWith('+')) msisdn = msisdn.slice(1);

  const payload = {
    InitiatorName: process.env.MPESA_INITIATOR_NAME,
    SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    CommandID: 'BusinessPayment',
    Amount: Math.floor(amount),
    PartyA: process.env.MPESA_SHORTCODE,
    PartyB: msisdn,
    Remarks: remarks || 'Cooperative payment',
    QueueTimeOutURL: `${process.env.API_BASE_URL}/api/staff/mpesa/timeout`,
    ResultURL: `${process.env.API_BASE_URL}/api/staff/mpesa/result`,
    Occasion: occasion || '',
  };

  const { data } = await axios.post(
    `${MPESA_BASE}/mpesa/b2c/v3/paymentrequest`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return data;
};

// Send to multiple farmers — sequential with small delay
export const sendBulkB2C = async (payments) => {
  const results = [];

  for (const p of payments) {
    try {
      const res = await sendB2CPayment({
        phone: p.phone,
        amount: p.amount,
        remarks: p.remarks,
      });
      results.push({ phone: p.phone, status: 'sent', response: res });
    } catch (err) {
      results.push({
        phone: p.phone,
        status: 'failed',
        error: err.response?.data || err.message,
      });
    }

    // 500ms gap between requests to respect Safaricom rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
};