import { useEffect, useState } from 'react';
import { Container, Card, Button, Modal, Form, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { adminApi } from '../../api/adminApi';
import { formatDateTime } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import PasswordStrengthMeter from '../../components/common/PasswordStrengthMeter';
import { checkPasswordStrength } from '../../utils/passwordStrength';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'farmer' });

  const loadUsers = async () => {
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({ name: '', email: '', role: 'farmer', password: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditId(user.id);
    setForm({ name: user.name, email: user.email, role: user.role });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Please fill all fields');
      return;
    }

    if (!editId && form.password) {
      const strength = checkPasswordStrength(form.password);
      if (!strength.isValid) {
        toast.error('Password does not meet strong security requirements.');
        return;
      }
    }

    setSaving(true);
    try {
      if (editId) {
        await adminApi.updateUser(editId, { name: form.name, email: form.email, role: form.role });
        toast.success('User updated!');
      } else {
        await adminApi.createUser(form);
        toast.success('User created!');
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await adminApi.toggleUserStatus(user.id);
      toast.success(`User ${user.status === 'Active' ? 'deactivated' : 'activated'}`);
      loadUsers();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const roleBadge = (role) => {
    const colors = { farmer: 'success', staff: 'primary', admin: 'dark' };
    return <Badge bg={colors[role] || 'secondary'}>{role.toUpperCase()}</Badge>;
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (v) => roleBadge(v) },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <Badge bg={v === 'Active' ? 'success' : 'secondary'}>{v}</Badge>,
    },
    { key: 'lastLogin', label: 'Last Login', render: (v) => <span className="small text-muted">{v}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="d-flex gap-1">
          <Button size="sm" variant="outline-primary" onClick={() => handleOpenEdit(row)}>
            ✏️ Edit
          </Button>
          <Button
            size="sm"
            variant={row.status === 'Active' ? 'outline-danger' : 'outline-success'}
            onClick={() => handleToggleStatus(row)}
          >
            {row.status === 'Active' ? '🚫 Deactivate' : '✅ Activate'}
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  const counts = {
    farmers: users.filter((u) => u.role === 'farmer').length,
    staff: users.filter((u) => u.role === 'staff').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  return (
    <Container fluid>
      <PageHeader
        title="User Management"
        subtitle={`${users.length} registered users`}
        action={
          <Button variant="success" onClick={handleOpenCreate}>
            ➕ Add New User
          </Button>
        }
      />

      <Row className="mb-4">
        <Col md={4} sm={6} className="mb-3">
          <StatsCard title="Farmers" value={counts.farmers} color="success" />
        </Col>
        <Col md={4} sm={6} className="mb-3">
          <StatsCard title="Staff" value={counts.staff} color="primary" />
        </Col>
        <Col md={4} sm={6} className="mb-3">
          <StatsCard title="Admins" value={counts.admins} color="dark" />
        </Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <DataTable
            columns={columns}
            data={users}
            searchPlaceholder="Search by name, email, or role..."
            searchKeys={['name', 'email', 'role']}
            itemsPerPage={10}
          />
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editId ? 'Edit User' : 'Create New User'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full Name *</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email Address *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@kaliluni.com"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role *</Form.Label>
              <Form.Select name="role" value={form.role} onChange={handleChange}>
                <option value="farmer">Farmer</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
            {!editId && (
              <>
                <Form.Group className="mb-2">
                  <Form.Label>Initial Password (Optional)</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={form.password || ''}
                    onChange={handleChange}
                    placeholder="Leave empty for default: 'password'"
                  />
                  {form.password && <PasswordStrengthMeter password={form.password} />}
                </Form.Group>
                <Alert variant="info" className="mb-0 small">
                  {form.password
                    ? 'Ensure the password satisfies strong security requirements.'
                    : "If left blank, default password 'password' is used. User can change or reset it anytime."}
                </Alert>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update User' : 'Create User'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default UserManagement;