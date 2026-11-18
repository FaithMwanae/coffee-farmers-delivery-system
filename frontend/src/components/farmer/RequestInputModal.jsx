import { useState } from 'react';
import { Modal, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { farmerApi } from '../../api/farmerApi';
import { toast } from 'react-toastify';

const INPUT_TYPES = ['Fertilizer', 'Pesticide', 'Seedling', 'Equipment', 'Other'];
const UNITS = ['bag', 'kg', 'litre', 'piece', 'unit'];

const RequestInputModal = ({ show, onHide, onSuccess }) => {
  const [inputType, setInputType] = useState('Fertilizer');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('bag');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await farmerApi.requestInput({
        inputType,
        quantity: Number(quantity),
        unit,
        description,
      });
      toast.success('Input request submitted to staff!');
      if (onSuccess) await onSuccess();
      onHide();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton={!submitting}>
        <Modal.Title style={{ fontSize: '1.05rem' }}>Request Farm Input</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Alert variant="light" className="small border mb-3">
            <i className="bi bi-info-circle me-1"></i>
            Request your fertilizer or pesticide here. Staff will review, approve, and call you to pick it up.
          </Alert>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-secondary">Input Type *</Form.Label>
            <Form.Select value={inputType} onChange={(e) => setInputType(e.target.value)} disabled={submitting}>
              {INPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Form.Select>
          </Form.Group>

          <Row className="mb-3">
            <Col xs={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary">Quantity *</Form.Label>
                <Form.Control type="number" min="0.1" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required disabled={submitting} />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary">Unit</Form.Label>
                <Form.Select value={unit} onChange={(e) => setUnit(e.target.value)} disabled={submitting}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-0">
            <Form.Label className="small fw-semibold text-secondary">Notes / Description</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={2} 
              placeholder="e.g. DAP for top dressing" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              disabled={submitting} 
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={submitting}>Cancel</Button>
          <Button variant="success" size="sm" type="submit" disabled={submitting}>
            {submitting ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Submitting...</> : 'Submit Request'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RequestInputModal;