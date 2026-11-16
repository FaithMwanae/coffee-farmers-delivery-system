import { useEffect, useState, useMemo } from 'react';
import { Container, Card, Badge, Spinner, Alert, Row, Col, Button, Modal, Form } from 'react-bootstrap';
import { staffApi } from '../../api/staffApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import FarmerSearchSelect from '../../components/forms/FarmerSearchSelect';
import { toast } from 'react-toastify';

const INPUT_TYPES = ['Fertilizer', 'Pesticide', 'Seedling', 'Equipment', 'Other'];
const UNITS = ['bag', 'kg', 'litre', 'piece', 'unit'];

const InputManagement = () => {
  const [inputs, setInputs] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    farmerId: '', inputType: 'Fertilizer', description: '', quantity: 1, unit: 'bag', unitCost: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [inputsData, farmersData] = await Promise.all([
        staffApi.getAllInputs(),
        staffApi.getAllFarmers(),
      ]);
      setInputs(Array.isArray(inputsData) ? inputsData : []);
      setFarmers(Array.isArray(farmersData) ? farmersData : []);
    } catch (err) {
      toast.error('Failed to load inputs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.farmerId) return toast.error('Select a farmer');
    
    setSubmitting(true);
    try {
      await staffApi.recordInput({
        ...form,
        quantity: Number(form.quantity) || 1,
        unitCost: Number(form.unitCost) || 0,
      });
      toast.success('Input recorded and deduction applied');
      setShowModal(false);
      setForm({ farmerId: '', inputType: 'Fertilizer', description: '', quantity: 1, unit: 'bag', unitCost: '' });
      loadData();
    } catch (err) {
      toast.error('Failed to record input');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = useMemo(() => inputs.reduce((acc, i) => {
    acc.cost += Number(i.totalCost) || 0;
    acc.farmers.add(i.farmerId);
    return acc;
  }, { cost: 0, farmers: new Set() }), [inputs]);

  const columns = [
    { key: 'date', label: 'Date', render: (v) => <span className="text-muted small">{formatDate(v)}</span> },
    { key: 'memberNo', label: 'Member No.', render: (v) => <code>{v}</code> },
    { key: 'farmerName', label: 'Farmer', render: (v) => <span className="fw-semibold">{v}</span> },
    { 
      key: 'inputType', 
      label: 'Input', 
      render: (v, row) => (
        <div>
          <div className="fw-semibold">{v}</div>
          <small className="text-muted">{row.quantity} {row.unit} {row.description ? `- ${row.description}` : ''}</small>
        </div>
      ) 
    },
    { key: 'totalCost', label: 'Deduction', render: (v) => <span className="fw-bold text-danger">{formatCurrency(v)}</span> },
  ];

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>;

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="Farm Input Allocation"
        subtitle="Track fertilizers, pesticides, and other inputs issued to farmers"
        action={<Button variant="success" size="sm" onClick={() => setShowModal(true)}><i className="bi bi-plus-lg me-1"></i>Record Input</Button>}
      />

      <Row className="g-3 mb-4">
        <Col xs={6} lg={4}><StatsCard title="Total Allocations" value={inputs.length} color="primary" icon="bi-box-seam" /></Col>
        <Col xs={6} lg={4}><StatsCard title="Farmers Served" value={totals.farmers.size} color="info" icon="bi-people" /></Col>
        <Col xs={6} lg={4}><StatsCard title="Total Value Deducted" value={formatCurrency(totals.cost)} color="danger" icon="bi-cash-stack" /></Col>
      </Row>

      <Card>
        <Card.Body className="p-0">
          <DataTable columns={columns} data={inputs} searchPlaceholder="Search by farmer, member no, or input..." searchKeys={['farmerName', 'memberNo', 'inputType']} itemsPerPage={10} />
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => !submitting && setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton={!submitting}><Modal.Title>Record Farm Input</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <FarmerSearchSelect farmers={farmers} value={form.farmerId} onChange={(id) => setForm({ ...form, farmerId: id })} required />
            
            <Row className="mt-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Input Type</Form.Label>
                  <Form.Select value={form.inputType} onChange={(e) => setForm({ ...form, inputType: e.target.value })}>
                    {INPUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Unit</Form.Label>
                  <Form.Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mt-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control type="number" min="0.1" step="0.1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Unit Cost (KES)</Form.Label>
                  <Form.Control type="number" min="0" placeholder="e.g. 2500" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mt-3">
              <Form.Label>Notes / Description</Form.Label>
              <Form.Control type="text" placeholder="e.g. NPK top dressing" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Form.Group>

            <Alert variant="light" className="mt-3 border small">
              <strong>Total Cost:</strong> {formatCurrency((Number(form.quantity) || 0) * (Number(form.unitCost) || 0))}
              <br /><small className="text-muted">This amount will be automatically deducted from the farmer's final payment.</small>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</Button>
            <Button variant="success" size="sm" type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Input'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default InputManagement;