import { Modal, Button } from 'react-bootstrap';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PaymentVoucherModal = ({ show, onHide, payment }) => {
  if (!payment) return null;

  const voucherNo = `KAL-PAY-${String(payment.id).padStart(4, '0')}-${new Date().getFullYear()}`;

  const handlePrint = () => window.print();

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="no-print">
        <Modal.Title style={{ fontSize: '1.05rem' }}>Payment Voucher</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="print-receipt p-4" style={{ background: '#fff' }}>
          {/* Header */}
          <div className="text-center mb-3">
            <h5 className="fw-bold mb-1" style={{ letterSpacing: '2px' }}>
              KALILUNI FACTORY
            </h5>
            <small className="text-muted d-block">CO-OPERATIVE SOCIETY</small>
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
              Payment Voucher
            </small>
          </div>

          <hr />

          {/* Voucher number + date */}
          <div className="d-flex justify-content-between mb-3 small">
            <div>
              <strong>Voucher No:</strong> <code>{voucherNo}</code>
            </div>
            <div>
              <strong>Date:</strong> {formatDate(payment.date)}
            </div>
          </div>

          <hr />

          {/* Farmer details */}
          <div className="mb-3 small">
            <p className="mb-1">
              <strong>Received from:</strong> Kaliluni Factory Co-operative Society
            </p>
            <p className="mb-1">
              <strong>Paid to:</strong> {payment.farmerName}
            </p>
            <p className="mb-1">
              <strong>Member No:</strong> <code>{payment.memberNo}</code>
            </p>
            {payment.phone && (
              <p className="mb-1">
                <strong>Phone:</strong> {payment.phone}
              </p>
            )}
          </div>

          <hr />

          {/* Amount box */}
          <div className="border rounded p-3 mb-3" style={{ background: '#fafbfc' }}>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted small">Amount Paid</span>
              <strong className="text-success" style={{ fontSize: '1.3rem' }}>
                {formatCurrency(payment.amount)}
              </strong>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted small">Payment Method</span>
              <strong>{payment.method}</strong>
            </div>
            {payment.reference && (
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Reference</span>
                <code>{payment.reference}</code>
              </div>
            )}
            <div className="d-flex justify-content-between py-2">
              <span className="text-muted small">Released By</span>
              <span className="small">{payment.releasedBy || '—'}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="row mt-4 pt-3">
            <div className="col-6">
              <div className="border-top pt-1" style={{ borderColor: '#000 !important' }}>
                <small className="text-muted">Farmer signature / thumbprint</small>
              </div>
            </div>
            <div className="col-6">
              <div className="border-top pt-1" style={{ borderColor: '#000 !important' }}>
                <small className="text-muted">Staff signature</small>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <small className="text-muted">
              This is your official payment voucher. Keep it safe for your records.
            </small>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="no-print">
        <Button variant="outline-secondary" size="sm" onClick={onHide}>
          Close
        </Button>
        <Button variant="success" size="sm" onClick={handlePrint}>
          <i className="bi bi-printer me-1"></i>
          Print Voucher
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentVoucherModal;

