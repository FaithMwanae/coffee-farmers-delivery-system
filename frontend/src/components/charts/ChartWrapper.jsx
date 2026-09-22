import { Card, Spinner, Alert } from 'react-bootstrap';

const ChartWrapper = ({ title, icon, height = 300, loading, error, children }) => {
  return (
    <Card className="shadow-sm border-0 h-100 chart-wrapper">
      <Card.Body>
        <h5 className="mb-3" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.15rem)' }}>
          {icon && <span className="me-2">{icon}</span>}
          {title}
        </h5>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height }}>
            <Spinner animation="border" variant="success" />
          </div>
        ) : error ? (
          <Alert variant="warning" className="mb-0">{error}</Alert>
        ) : (
          <div
            style={{
              height: 'auto',
              minHeight: '220px',
              maxHeight: `${height}px`,
            }}
          >
            {children}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ChartWrapper;