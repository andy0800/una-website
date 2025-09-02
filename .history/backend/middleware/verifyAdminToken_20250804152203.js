const jwt = require('jsonwebtoken');

function verifyAdminToken(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1] || req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    req.admin = decoded;
    req.user = decoded; // For compatibility with existing code
    next();
  } catch (err) {
    console.error('Admin token verification error:', err.message);
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

module.exports = verifyAdminToken;