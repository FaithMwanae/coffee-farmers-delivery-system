import { Badge } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import { formatWeight, formatDate } from '../../utils/formatters';

const ReceiptCard = ({
  receiptNo,
  date,
  farmerName,
  memberNo,
  location,
  weight,
  cumulativeTotal,
  quality,
  status,
  showQr = false,
  qrValue,
  variant = 'print', // 'print' | 'verify'
}) => {
  return (
    <div className="receipt-card">
      {/* ---------- Header ---------- */}
      <div className="receipt-header">
        <h5 className="receipt-brand">KALILUNI FACTORY</h5>
        <p className="receipt-subtitle">Coffee Delivery Receipt</p>
      </div>

      {/* ---------- Detail rows ---------- */}
      <div className="receipt-body">
        <div className="receipt-row">
          <span className="receipt-label">Receipt No.</span>
          <code className="receipt-code">{receiptNo}</code>
        </div>

        <div className="receipt-row">
          <span className="receipt-label">Date Issued</span>
          <strong className="receipt-value">{formatDate(date)}</strong>
        </div>

        <div className="receipt-row">
          <span className="receipt-label">Farmer</span>
          <strong className="receipt-value">{farmerName}</strong>
        </div>

        <div className="receipt-row">
          <span className="receipt-label">Member No.</span>
          <code className="receipt-code">{memberNo}</code>
        </div>

        {location && (
          <div className="receipt-row">
            <span className="receipt-label">Location</span>
            <strong className="receipt-value">{location}</strong>
          </div>
        )}

        <div className="receipt-row">
          <span className="receipt-label">
            {cumulativeTotal != null ? 'This Delivery' : 'Weight'}
          </span>
          <span className="receipt-weight">{formatWeight(weight)}</span>
        </div>

        {cumulativeTotal != null && (
          <div className="receipt-row">
            <span className="receipt-label">Cumulative Total</span>
            <span className="receipt-value receipt-weight-lg">
              {formatWeight(cumulativeTotal)}
            </span>
          </div>
        )}

        <div className="receipt-row">
          <span className="receipt-label">Quality</span>
          <Badge bg="success" className="receipt-badge">{quality || 'Good'}</Badge>
        </div>

        <div className="receipt-row">
          <span className="receipt-label">Status</span>
          <Badge bg="success" className="receipt-badge">
            {status || 'Processed'}
          </Badge>
        </div>
      </div>

      {/* ---------- Footer ---------- */}
      <div className="receipt-footer">
        {variant === 'verify' ? (
          <div className="receipt-footer-verify">
            <i className="bi bi-shield-check me-1"></i>
            Verified by <strong>Kaliluni Farmers Co-operative Society</strong>.{' '}
            For any questions, contact the cooperative office.
          </div>
        ) : (
          <p className="receipt-thanks">Thank you for your delivery</p>
        )}

        {showQr && qrValue && (
          <div className="receipt-qr">
            <QRCodeSVG
              value={qrValue}
              size={110}
              level="M"
              bgColor="#ffffff"
              fgColor="#1a4d2e"
            />
            <p className="receipt-qr-caption">Scan to verify</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptCard;