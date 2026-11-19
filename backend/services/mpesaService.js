import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  // Token usually expires in 3600 seconds. We subtract 60s to be safe.
  tokenExpiry = Date.now() + (Number(response.data.expires_in || 3599) - 60) * 1000;
  return cachedToken;
};

// 2. Generate Security Credential (Encrypt Password)
export const generateSecurityCredential = () => {
  const certPath = path.join(__dirname, '../certificates/SandboxCertificate.cer');
  
  if (!fs.existsSync(certPath)) {
    throw new Error(`Certificate missing at ${certPath}. Did you commit it to Git?`);
  }

  const certificate = fs.readFileSync(certPath, 'utf8');
  const publicKey = crypto.createPublicKey(certificate);

  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(process.env.MPESA_INITIATOR_PASSWORD)
  );

  return encrypted.toString('base64');
};

// 3. Send B2C Payment
export const sendB2CPayment = async ({ phone, amount, remarks, occasion, callbackRef }) => {
  const token = await getAccessToken();
  const securityCredential = generateSecurityCredential();

  // Format phone: 0712345678 or +254712345678 -> 254712345678
  let msisdn = String(phone).replace(/\D/g, ''); // Remove all non-digits
  if (msisdn.startsWith('0')) msisdn = '254' + msisdn.slice(1);
  
  // Generate a unique reference so we can match the callback later
  const conversationId = callbackRef || `B2C-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const payload = {
    OriginatorConversationID: conversationId, // Important for matching
    InitiatorName: process.env.MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: 'BusinessPayment',
    Amount: Math.floor(amount),
    PartyA: process.env.MPESA_SHORTCODE,
    PartyB: msisdn,
    Remarks: String(remarks || 'Cooperative Payment').slice(0, 100),
    
    // ⭐ FIXED: These URLs now point to your actual payment routes
    QueueTimeOutURL: `${process.env.API_BASE_URL}/api/payments/mpesa/timeout`,
    ResultURL: `${process.env.API_BASE_URL}/api/payments/mpesa/b2c-callback`,
    
    Occasion: String(occasion || 'Payout').slice(0, 100),
  };

  const response = await axios.post(
    `${BASE_URL}/mpesa/b2c/v3/paymentrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  return {
    ...response.data,
    reference: conversationId // Pass this back to the controller to save in DB
  };
};