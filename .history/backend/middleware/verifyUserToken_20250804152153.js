const jwt = require('jsonwebtoken');

const verifyUserToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1] || req.header('x-auth-token');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure it's a user token (not admin)
    if (decoded.role === 'admin') {
      return res.status(403).json({ message: 'Access denied. User access only.' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = verifyUserToken;