import { useEffect, useState } from 'react';
import { Container, Card, Spinner, Row, Col, Button, Modal, Form, Nav, Badge, Alert } from 'react-bootstrap';
import { staffApi } from '../../api/staffApi';
import { paymentApi } from '../../api/paymentApi'; // ⭐ Import paymentApi
import { formatCurrency, formatDate } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';

const InputManagement = () => {
  const [tab, setTab] = useState('requests'); // 'requests' | 'history'
  const [inputs, setInputs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ⭐ Store the default percentage from Admin settings
  const [defaultPercentage, setDefaultPercentage] = useState(25);

  // Issue Modal
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [unitCost, setUnitCost] = useState('');
  
  // Payment Method States
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [sendingStk, setSendingStk] = useState(false); // ⭐ STK Loading state

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await staffApi.getAllInputs();
      setInputs(data);
    } catch (err) {
      toast.error('Failed to load inputs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch the Admin's default percentage on load
  useEffect(() => { 
    loadData(); 
    staffApi.getInputSettings()
      .then(data => {
        if (data?.inputUpfrontPercentage !== undefined) {
          setDefaultPercentage(data.inputUpfrontPercentage);
        }
      })
      .catch(console.error);
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await staffApi.updateInputStatus(id, status);
      toast.success(`Request ${status.toLowerCase()}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const openIssueModal = (input) => {
    setSelected(input);
    setUnitCost(''); 
    setPaymentMethod('Cash'); 
    setReference('');         
    setShowModal(true);
  };

  // ⭐ New Handler: Send STK Push
  const handleSendStk = async () => {
    if (!formUpfront || formUpfront <= 0) {
      return toast.error('Unit cost must be entered first');
    }
    
    setSendingStk(true);
    try {
      const res = await paymentApi.collectMpesa({
        farmerId: selected.farmerId,
        amount: formUpfront,
        description: `Input: ${selected.inputType}`
      });
      toast.success('M-Pesa prompt sent! Waiting for farmer.');
      // Optionally populate reference with the Checkout ID
      setReference(res.checkoutRequestId || 'STK-SENT');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send STK push');
    } finally {
      setSendingStk(false);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submit if reference is required but empty
    if (formUpfront > 0 && paymentMethod !== 'Cash' && !reference.trim()) {
       return toast.error('Please enter a reference number');
    }

    setSubmitting(true);
    try {
      await staffApi.issueInput(selected.id, { 
        unitCost: Number(unitCost), 
        upfrontPercentage: Number(defaultPercentage),
        paymentMethod: paymentMethod,
        reference: reference.trim()
      });
      toast.success('Input issued and financials applied!');
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error('Failed to issue input');
    } finally {
      setSubmitting(false);
    }
  };

  const requests = inputs.filter(i => i.status === 'Requested' || i.status === 'Approved');
  const history = inputs.filter(i => i.status === 'Issued' || i.status === 'Rejected');

  const requestColumns = [
    { key: 'date', label: 'Date', render: (v) => <span className="text-muted small">{formatDate(v)}</span> },
    { key: 'memberNo', label: 'Member No.', render: (v) => <code>{v}</code> },
    { key: 'farmerName', label: 'Farmer', render: (v) => <span className="fw-semibold">{v}</span> },
    { key: 'inputType', label: 'Requested Item', render: (v, row) => <div><div className="fw-semibold">{v}</div><small className="text-muted">{row.quantity} {row.unit} {row.description && `- ${row.description}`}</small></div> },
    { 
      key: 'status', label: 'Status', 
      render: (v) => <Badge bg={v === 'Approved' ? 'success' : 'warning'} text={v === 'Requested' ? 'dark' : undefined}>{v}</Badge> 
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="d-flex gap-2">
          {row.status === 'Requested' && (
            <>
              <Button size="sm" variant="outline-success" onClick={() => handleStatusUpdate(row.id, 'Approved')}>Approve</Button>
              <Button size="sm" variant="outline-danger" onClick={() => handleStatusUpdate(row.id, 'Rejected')}>Reject</Button>
            </>
          )}
          {row.status === 'Approved' && (
            <Button size="sm" variant="success" onClick={() => openIssueModal(row)}>Issue to Farmer</Button>
          )}
        </div>
      )
    }
  ];

  const historyColumns = [
    { key: 'date', label: 'Date', render: (v) => <span className="text-muted small">{formatDate(v)}</span> },
    { key: 'memberNo', label: 'Member No.', render: (v) => <code>{v}</code> },
    { key: 'farmerName', label: 'Farmer' },
    { key: 'inputType', label: 'Input', render: (v, row) => <div>{v} <small className="text-muted">({row.quantity} {row.unit})</small></div> },
    { key: 'totalCost', label: 'Total Cost', render: (v) => formatCurrency(v) },
    { 
      key: 'upfrontAmount', 
      label: 'Paid Upfront', 
      render: (v, row) => (
        <div>
          <span className="text-success fw-bold">{formatCurrency(v)}</span> 
          <br/>
          <small className="text-muted">{row.upfrontPercentage}% ({row.upfrontPaymentMethod})</small>
        </div>
      ) 
    },
    { key: 'deductedAmount', label: 'Deducted', render: (v) => <span className="text-danger">{formatCurrency(v)}</span> },
  ];

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>;

  const formTotal = (Number(selected?.quantity) || 0) * (Number(unitCost) || 0);
  const formUpfront = formTotal * (Number(defaultPercentage) / 100); 
  const formDeducted = formTotal - formUpfront;

  return (
    <Container fluid className="px-0">
      <PageHeader title="Farm Input Management" subtitle="Approve requests and issue inputs to farmers" />

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom p-0">
          <Nav variant="tabs" className="payment-tabs">
            <Nav.Item><Nav.Link active={tab === 'requests'} onClick={() => setTab('requests')}>Pending Requests {requests.length > 0 && <Badge bg="danger" className="ms-2">{requests.length}</Badge>}</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={tab === 'history'} onClick={() => setTab('history')}>Issued History</Nav.Link></Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body className="p-0">
          {tab === 'requests' ? (
             requests.length === 0 ? <div className="text-center py-5 text-muted">No pending requests.</div> :
             <DataTable columns={requestColumns} data={requests} itemsPerPage={10} />
          ) : (
             <DataTable columns={historyColumns} data={history} itemsPerPage={10} />
          )}
        </Card.Body>
      </Card>

      {/* Issue Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton><Modal.Title>Issue Input to Farmer</Modal.Title></Modal.Header>
        <Form onSubmit={handleIssueSubmit}>
          <Modal.Body>
            {selected && (
              <>
                <Alert variant="info" className="small">
                  Issuing <strong>{selected.quantity} {selected.unit} {selected.inputType}</strong> to <strong>{selected.farmerName}</strong>.
                </Alert>
                
                <Form.Group className="mb-3">
                  <Form.Label>Unit Cost (KES) *</Form.Label>
                  <Form.Control type="number" min="0" required value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="e.g. 2500" />
                </Form.Group>

                {/* Payment Details Section */}
                {formUpfront > 0 && (
                  <Row className="mt-3 p-3 bg-light rounded border">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Payment Method *</Form.Label>
                        <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                          <option value="Cash">Cash</option>
                          <option value="M-Pesa STK">M-Pesa (STK Push)</option>
                          <option value="M-Pesa Code">M-Pesa (Manual Code)</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          Reference {paymentMethod !== 'Cash' ? '*' : '(Optional)'}
                        </Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder={
                            paymentMethod === 'M-Pesa STK' ? 'Click Send Prompt below' : 
                            paymentMethod === 'M-Pesa Code' ? 'e.g. QK12AB34CD' : 
                            paymentMethod === 'Bank Transfer' ? 'e.g. TRF-12345' : 
                            'e.g. Voucher #'
                          }
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                          required={paymentMethod !== 'Cash'}
                        />
                      </Form.Group>
                    </Col>
                    
                    {/* ⭐ ADDED: Send STK Push Button */}
                    {paymentMethod === 'M-Pesa STK' && (
                      <Col xs={12} className="mt-3">
                        <Button 
                          variant="outline-success" 
                          className="w-100" 
                          onClick={handleSendStk} 
                          disabled={sendingStk || !formUpfront}
                        >
                          {sendingStk ? 'Sending Prompt...' : `Send M-Pesa Prompt (KES ${formUpfront.toLocaleString()})`}
                        </Button>
                      </Col>
                    )}
                  </Row>
                )}

                <div className="border rounded p-3 mt-3 bg-light small">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Total Cost:</span> 
                    <strong>{formatCurrency(formTotal)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1 text-success">
                    <span>Paid Upfront ({defaultPercentage}%):</span> 
                    <strong>{formatCurrency(formUpfront)}</strong>
                  </div>
                  <div className="d-flex justify-content-between border-top pt-1 mt-1 text-danger">
                    <span>To be Deducted from Payment:</span> 
                    <strong>{formatCurrency(formDeducted)}</strong>
                  </div>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="success" size="sm" type="submit" disabled={submitting}>{submitting ? 'Issuing...' : 'Confirm Issue'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default InputManagement;