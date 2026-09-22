import { useEffect, useState } from 'react';
import { Container, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { farmerApi } from '../../api/farmerApi';
import { formatDate, formatWeight } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { Button } from 'react-bootstrap';
import { exportToPDF, makeFileName } from '../../utils/exportUtils';
import { toast } from 'react-toastify';
const DeliveryHistory = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await farmerApi.getDeliveries();
        setDeliveries(data);
      } catch (err) {
        setError('Failed to load deliveries');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'weight',
      label: 'Weight',
      render: (val) => formatWeight(val),
    },
    {
      key: 'receipt',
      label: 'Receipt No.',
      render: (val) => <code>{val}</code>,
    },
    {
      key: 'quality',
      label: 'Quality',
      render: (val) => (
        <Badge
          bg={
            val === 'Excellent' ? 'success' : val === 'Good' ? 'info' : 'warning'
          }
        >
          {val}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge bg={val === 'Processed' ? 'success' : 'warning'}>{val}</Badge>
      ),
    },
  ];

  const totalWeight = deliveries.reduce((sum, d) => sum + d.weight, 0);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid>
      <PageHeader
        title="Delivery History"
        subtitle={`Total: ${formatWeight(totalWeight)} from ${deliveries.length} deliveries`}
        />

      <Card className="shadow-sm border-0">
        <Card.Body>
          <DataTable
            columns={columns}
            data={deliveries}
            searchPlaceholder="Search by receipt or quality..."
            searchKeys={['receipt', 'quality', 'status']}
            itemsPerPage={10}
            emptyMessage="No deliveries found"
          />
        </Card.Body>
      </Card>
    </Container>
  );
};
  const handleDownloadHistory = () => {
    try {
      const pdfColumns = [
        { key: 'date', label: 'Date' },
        { key: 'weight', label: 'Weight (kg)' },
        { key: 'receipt', label: 'Receipt No' },
        { key: 'quality', label: 'Quality' },
        { key: 'status', label: 'Status' },
      ];

      const pdfRows = deliveries.map((d) => ({
        date: formatDate(d.date),
        weight: Number(d.weight).toLocaleString(),
        receipt: d.receipt || d.receipt_no,
        quality: d.quality || '—',
        status: d.status || 'Processed',
      }));

      exportToPDF({
        title: 'My Delivery History',
        subtitle: `Total: ${formatWeight(deliveries.reduce((s, x) => s + Number(x.weight || 0), 0))}`,
        columns: pdfColumns,
        rows: pdfRows,
        fileName: `${makeFileName('my_deliveries')}.pdf`,
      });
      toast.success('Delivery history downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };
export default DeliveryHistory;