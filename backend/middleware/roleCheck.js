export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // CEO has access to everything except admin-only routes (handled by allowedRoles)
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This action requires one of: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
};