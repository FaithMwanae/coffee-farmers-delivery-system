import axios from 'axios';

const BASE_URL = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// 1. Get OAuth Token from Safaricom
export const getAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return response.data.access_token; 
};

// 2. Send B2C Payment Request
export const sendB2CPayment = async ({ phone, amount, remarks, occasion }) => {
  const token = await getAccessToken();

  // Normalize phone: 0712345678 -> 254712345678
  let msisdn = String(phone).replace(/\s/g, '');
  if (msisdn.startsWith('0')) msisdn = '254' + msisdn.slice(1);
  if (msisdn.startsWith('+')) msisdn = msisdn.slice(1);

  const payload = {
    InitiatorName: process.env.MPESA_INITIATOR_NAME,
    SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    CommandID: 'BusinessPayment',
    Amount: Math.floor(amount),
    PartyA: process.env.MPESA_SHORTCODE,
    PartyB: msisdn,
    Remarks: remarks || 'Cooperative Payment',
    QueueTimeOutURL: `${process.env.API_BASE_URL}/api/staff/mpesa/timeout`,
    ResultURL: `${process.env.API_BASE_URL}/api/staff/mpesa/callback`,
    Occasion: occasion || 'Delivery Payment',
  };

  const response = await axios.post(
    `${BASE_URL}/mpesa/b2c/v3/paymentrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  // Returns { ConversationID, OriginatorConversationID, ResponseDescription }
  return response.data; 
};