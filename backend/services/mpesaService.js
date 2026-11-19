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

// 1. Get OAuth Token
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

// 2. Generate Security Credential (Encrypt Password)
export const generateSecurityCredential = () => {
  // Reads the certificate you downloaded from Safaricom
  const certPath = path.join(__dirname, '../certificates/SandboxCertificate.cer');
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
export const sendB2CPayment = async ({ phone, amount, remarks, occasion }) => {
  const token = await getAccessToken();
  const securityCredential = generateSecurityCredential();

  // Format phone: 0712345678 -> 254712345678
  let msisdn = String(phone).replace(/\s/g, '');
  if (msisdn.startsWith('0')) msisdn = '254' + msisdn.slice(1);
  if (msisdn.startsWith('+')) msisdn = msisdn.slice(1);

  const payload = {
    InitiatorName: process.env.MPESA_INITIATOR_NAME,
    SecurityCredential: securityCredential,
    CommandID: 'BusinessPayment',
    Amount: Math.floor(amount),
    PartyA: process.env.MPESA_SHORTCODE,
    PartyB: msisdn,
    Remarks: remarks || 'Cooperative Payment',
    QueueTimeOutURL: `${process.env.API_BASE_URL}/api/staff/mpesa/timeout`,
    ResultURL: `${process.env.API_BASE_URL}/api/staff/mpesa/callback`,
    Occasion: occasion || '',
  };

  const response = await axios.post(
    `${BASE_URL}/mpesa/b2c/v3/paymentrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  return response.data; // Returns { ConversationID, OriginatorConversationID }
};