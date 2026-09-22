const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div
      className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3"
      style={{
        paddingBottom: '16px',
        borderBottom: '1px solid var(--kl-border)',
      }}
    >
      <div>
        <h4
          className="mb-1 fw-semibold"
          style={{
            fontSize: 'clamp(1.15rem, 3vw, 1.35rem)',
            color: 'var(--kl-text)',
            letterSpacing: '-0.2px',
          }}
        >
          {title}
        </h4>
        {subtitle && (
          <p
            className="mb-0"
            style={{
              fontSize: 'clamp(0.8rem, 2.5vw, 0.875rem)',
              color: 'var(--kl-muted)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="w-100 w-sm-auto">{action}</div>}
    </div>
  );
};

export default PageHeader;