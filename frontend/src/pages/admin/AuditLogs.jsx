import { useEffect, useState } from 'react';
import { Container, Card, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { adminApi } from '../../api/adminApi';
import { formatDateTime } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminApi.getAuditLogs();
        setLogs(data);
      } catch (err) {
        setError('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const actionColor = (action) => {
    if (action.includes('LOGIN')) return 'success';
    if (action.includes('DELETE')) return 'danger';
    if (action.includes('UPDATE')) return 'warning';
    if (action.includes('CREATE') || action.includes('RECORD') || action.includes('REGISTER')) return 'primary';
    return 'secondary';
  };

  const columns = [
    { key: 'timestamp', label: 'Timestamp', render: (v) => <span className="small">{formatDateTime(v)}</span> },
    { key: 'user', label: 'User' },
    {
      key: 'role',
      label: 'Role',
      render: (v) => <Badge bg="light" text="dark">{v}</Badge>,
    },
    {
      key: 'action',
      label: 'Action',
      render: (v) => <Badge bg={actionColor(v)}>{v}</Badge>,
    },
    { key: 'details', label: 'Details', render: (v) => <span className="small text-muted">{v}</span> },
    { key: 'ip', label: 'IP Address', render: (v) => <code className="small">{v}</code> },
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  const stats = {
    total: logs.length,
    logins: logs.filter((l) => l.action === 'LOGIN').length,
    changes: logs.filter((l) => l.action.includes('UPDATE') || l.action.includes('CREATE') || l.action.includes('RECORD')).length,
    uniqueUsers: new Set(logs.map((l) => l.user)).size,
  };

  return (
    <Container fluid>
      <PageHeader
        title="Audit Logs"
        subtitle="Track all user activity in the system"
        />

      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <StatsCard title="Total Events" value={stats.total} color="secondary" />
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <StatsCard title="Logins" value={stats.logins} color="success" />
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <StatsCard title="Data Changes" value={stats.changes} color="warning" />
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <StatsCard title="Unique Users" value={stats.uniqueUsers} color="primary" />
        </Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <DataTable
            columns={columns}
            data={logs}
            searchPlaceholder="Search by user, action, or details..."
            searchKeys={['user', 'action', 'details', 'role']}
            itemsPerPage={15}
          />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AuditLogs;