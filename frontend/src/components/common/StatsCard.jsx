import { Card } from 'react-bootstrap';

const StatsCard = ({ title, value, subtitle, color = 'primary', icon }) => {
  const colorMap = {
    primary: { bg: '#e8f0fe', fg: '#1a73e8' },
    success: { bg: '#e6f4ea', fg: '#1a4d2e' },
    warning: { bg: '#fef7e0', fg: '#b06000' },
    info:    { bg: '#e0f7fa', fg: '#00695c' },
    danger:  { bg: '#fce8e6', fg: '#c5221f' },
    secondary: { bg: '#f1f3f4', fg: '#5f6368' },
    dark:    { bg: '#e8eaed', fg: '#202124' },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <Card className="border-0 h-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <Card.Body className="p-3 p-md-4">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span
            className="text-uppercase fw-semibold"
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.5px',
              color: 'var(--kl-muted)',
            }}
          >
            {title}
          </span>
          {icon && (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: c.bg,
                color: c.fg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem',
              }}
            >
              <i className={`bi ${icon}`}></i>
            </div>
          )}
        </div>
        <div
          className="fw-bold mb-1"
          style={{ fontSize: 'clamp(1.2rem, 4vw, 1.55rem)', color: 'var(--kl-text)', lineHeight: 1.1 }}
        >
          {value}
        </div>
        {subtitle && (
          <small style={{ fontSize: '0.72rem', color: 'var(--kl-muted)' }}>
            {subtitle}
          </small>
        )}
      </Card.Body>
    </Card>
  );
};

export default StatsCard;