import pool from '../config/pool.js';

export const auditLogger = (action, detailsFn = null) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          const details = typeof detailsFn === 'function' ? detailsFn(req, body) : (detailsFn || '');
          await pool.query(
            `INSERT INTO audit_logs (user_name, role, action, details, ip)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.name || req.user.email, req.user.role, action, details, req.ip || '127.0.0.1']
          );
        } catch (err) {
          console.error('Audit log error:', err.message);
        }
      }
      return originalJson(body);
    };
    next();
  };
};