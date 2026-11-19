import axios from 'axios';
import crypto from 'crypto';

const BASE_URL = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// 1. Get OAuth Token (Cached so we don't hit Safaricom's rate limits)
let cachedToken = null;
let tokenExpiry = 0;

export const getAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  
  cachedToken = response.data.access_token;
  tokenExpiry = Date.now() + (Number(response.data.expires_in || 3599) - 60) * 1000;
  return cachedToken;
};

// 2. Generate Security Credential
export const generateSecurityCredential = () => {
  const credential = process.env.MPESA_SECURITY_CREDENTIAL;
  
  if (!credential) {
    throw new Error("MPESA_SECURITY_CREDENTIAL is missing from environment variables.");
  }
  
  return credential;
};

// 3. Send B2C Payment
export const sendB2CPayment = async ({ phone, amount, remarks, occasion, callbackRef }) => {
  const token = await getAccessToken();
  const securityCredential = generateSecurityCredential();

  // ⭐ FIX 1: Strict Phone Number Formatting (Always 12 digits: 254XXXXXXXXX)
  let msisdn = String(phone).replace(/\D/g, ''); // Remove +, spaces, dashes
  if (msisdn.startsWith('0')) {
    msisdn = '254' + msisdn.slice(1);
  }
  // Safaricom strictly requires 12 digits. If it's 13 (e.g., 2547110872684), cut it to 12.
  if (msisdn.length > 12) {
    msisdn = msisdn.slice(0, 12);
  }
  
  // Generate a unique reference so we can match the callback later
  const conversationId = callbackRef || `B2C-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  // ⭐ FIX 2: Prevent "undefined" in the callback URLs
  const baseUrl = process.env.API_BASE_URL || 'https://kaliluni-backend.onrender.com';

  const payload = {
    OriginatorConversationID: conversationId,
    InitiatorName: process.env.MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: 'BusinessPayment',
    Amount: Math.floor(amount),
    PartyA: process.env.MPESA_SHORTCODE,
    PartyB: msisdn,
    Remarks: String(remarks || 'Cooperative Payment').slice(0, 100),
    
    // ⭐ Use the baseUrl variable here
    QueueTimeOutURL: `${baseUrl}/api/payments/mpesa/timeout`,
    ResultURL: `${baseUrl}/api/payments/mpesa/b2c-callback`,
    
    Occasion: String(occasion || 'Payout').slice(0, 100),
  };

  const response = await axios.post(
    `${BASE_URL}/mpesa/b2c/v3/paymentrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  return {
    ...response.data,
    reference: conversationId 
  };
};
// ============================================================
// 4. STK Push (Collecting money FROM farmer)
// ============================================================
export const initiateStkPush = async ({ phone, amount, accountRef, description }) => {
  const token = await getAccessToken();

  // Format phone number
  let msisdn = String(phone).replace(/\D/g, '');
  if (msisdn.startsWith('0')) msisdn = '254' + msisdn.slice(1);
  if (msisdn.length > 12) msisdn = msisdn.slice(0, 12);

  // Generate Timestamp (YYYYMMDDHHmmss)
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const timestamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;

  // STK Password is a base64 string of Shortcode + Passkey + Timestamp
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  const baseUrl = process.env.API_BASE_URL || 'https://kaliluni-backend.onrender.com';

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline', // Use 'CustomerBuyGoodsOnline' if you use a Till Number
    Amount: Math.floor(amount),
    PartyA: msisdn,      // The farmer paying
    PartyB: shortcode,   // The cooperative receiving
    PhoneNumber: msisdn, // The phone that gets the prompt
    CallBackURL: `${baseUrl}/api/payments/mpesa/stk-callback`,
    AccountReference: String(accountRef || 'KFCS-Input').slice(0, 12),
    TransactionDesc: String(description || 'Farm Input').slice(0, 13),
  };

  const response = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  return response.data; // Returns { CheckoutRequestID, ResponseCode, ... }
};