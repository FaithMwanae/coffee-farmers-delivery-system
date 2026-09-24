import { useEffect, useState } from 'react';
import {
  Container, Card, Button, Modal, Form, Badge, Spinner, Alert,
  Row, Col, ButtonGroup,
} from 'react-bootstrap';
import { adminApi } from '../../api/adminApi';
import { formatDateTime, formatRelativeTime, isUserOnline } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [tick, setTick] = useState(0); // ⭐ forces re-render for time updates

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'farmer',
    password: '',
  });

  // Load users
  const loadUsers = async () => {
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ⭐ Auto-refresh timestamps every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({ name: '', email: '', role: 'farmer', password: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Please fill in name and email');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await adminApi.updateUser(editId, {
          name: form.name,
          email: form.email,
          role: form.role,
        });
        toast.success('User updated');
      } else {
        await adminApi.createUser(form);
        toast.success('User created');
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const action = user.status === 'Active' ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    try {
      await adminApi.toggleUserStatus(user.id);
      toast.success(`User ${action}d`);
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const roleBadge = (role) => {
    const colors = {
      farmer: 'success',
      staff: 'primary',
      admin: 'dark',
      ceo: 'danger',
    };
    return (
      <Badge
        bg={colors[role] || 'secondary'}
        className="fw-normal"
        style={{ fontSize: '0.65rem', letterSpacing: '0.5px', padding: '5px 8px' }}
      >
        {role.toUpperCase()}
      </Badge>
    );
  };

  // ⭐ Last Login cell — shows relative time + online dot
  const renderLastLogin = (dateString, status) => {
    if (!dateString) {
      return <span className="text-muted small">Never logged in</span>;
    }

    const online = isUserOnline(dateString) && status === 'Active';

    return (
      <div className="d-flex align-items-center gap-2">
        {online && (
          <span
            title="Online now"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              display: 'inline-block',
              boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.2)',
            }}
          />
        )}
        <div>
          <div
            className={online ? 'text-success fw-semibold' : 'text-dark'}
            style={{ fontSize: '0.82rem' }}
          >
            {formatRelativeTime(dateString)}
          </div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
            {formatDateTime(dateString)}
          </div>
        </div>
      </div>
    );
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (v) => roleBadge(v) },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <Badge
          bg={v === 'Active' ? 'success' : 'secondary'}
          className="fw-normal"
          style={{ fontSize: '0.7rem' }}
        >
          {v}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (v, row) => renderLastLogin(v, row.status),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <ButtonGroup size="sm">
          <Button
            variant="outline-primary"
            onClick={() => handleOpenEdit(row)}
            style={{ fontSize: '0.8rem' }}
          >
            Edit
          </Button>
          <Button
            variant={row.status === 'Active' ? 'outline-danger' : 'outline-success'}
            onClick={() => handleToggleStatus(row)}
            style={{ fontSize: '0.8rem' }}
          >
            {row.status === 'Active' ? 'Deactivate' : 'Activate'}
          </Button>
        </ButtonGroup>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3 small">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  const counts = {
    farmers: users.filter((u) => u.role === 'farmer').length,
    staff: users.filter((u) => u.role === 'staff').length,
    admins: users.filter((u) => u.role === 'admin').length,
    ceos: users.filter((u) => u.role === 'ceo').length,
    online: users.filter((u) => isUserOnline(u.lastLogin) && u.status === 'Active').length,
  };

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} registered users — ${counts.online} online now`}
        action={
          <Button variant="success" size="sm" onClick={handleOpenCreate}>
            Add New User
          </Button>
        }
      />

      {/* Stats */}
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <StatsCard
            title="Farmers"
            value={counts.farmers}
            subtitle="Registered members"
            color="success"
            icon="bi-people"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Staff"
            value={counts.staff}
            subtitle="Operations team"
            color="primary"
            icon="bi-person-badge"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Admins & CEO"
            value={counts.admins + counts.ceos}
            subtitle="Leadership"
            color="dark"
            icon="bi-shield-lock"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Online Now"
            value={counts.online}
            subtitle="Active in last 5 min"
            color="success"
            icon="bi-circle-fill"
          />
        </Col>
      </Row>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <DataTable
            columns={columns}
            data={users}
            searchPlaceholder="Search by name, email, or role..."
            searchKeys={['name', 'email', 'role', 'status']}
            itemsPerPage={10}
          />
        </Card.Body>
      </Card>

      {/* Add / Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            {editId ? 'Edit User' : 'Create New User'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">
                Full Name *
              </Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
                style={{ fontSize: '0.9rem' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">
                Email Address *
              </Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@kaliluni.com"
                required
                style={{ fontSize: '0.9rem' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">
                Role *
              </Form.Label>
              <Form.Select
                name="role"
                value={form.role}
                onChange={handleChange}
                style={{ fontSize: '0.9rem' }}
              >
                <option value="farmer">Farmer</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="ceo">CEO</option>
              </Form.Select>
            </Form.Group>

            {!editId && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Initial Password
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Leave blank for default: password"
                    style={{ fontSize: '0.9rem' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Minimum 6 characters. Default is "password".
                  </Form.Text>
                </Form.Group>

                <Alert variant="light" className="mb-0 small border">
                  <i className="bi bi-info-circle me-1"></i>
                  The user will be able to log in immediately with these credentials.
                </Alert>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowModal(false)}
              style={{ fontSize: '0.85rem' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              size="sm"
              disabled={saving}
              style={{ fontSize: '0.85rem' }}
            >
              {saving ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : editId ? (
                'Update User'
              ) : (
                'Create User'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default UserManagement;