const jwt = require('jsonwebtoken');

function verifyAdminToken(req, res, next) {
  console.log('🔐 Verifying admin token...');
  console.log('🔐 Authorization header:', req.header('Authorization'));
  console.log('🔐 x-auth-token header:', req.header('x-auth-token'));
  
  const token = req.header('Authorization')?.split(' ')[1] || req.header('x-auth-token');

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    console.log('🔐 Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Token decoded:', decoded);

    if (decoded.role !== 'admin') {
      console.log('❌ Token role is not admin:', decoded.role);
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    req.admin = decoded;
    req.user = decoded; // For compatibility with existing code
    console.log('✅ Admin token verified successfully. Admin ID:', decoded.id);
    next();
  } catch (err) {
    console.error('❌ Admin token verification error:', err.message);
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

module.exports = verifyAdminToken;