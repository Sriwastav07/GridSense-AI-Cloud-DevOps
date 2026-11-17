const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set before the authentication routes are loaded.');
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Demo credentials are available only outside production.
    const demoLoginEnabled = process.env.NODE_ENV !== 'production' &&
      process.env.ALLOW_DEMO_LOGIN !== 'false';
    if (demoLoginEnabled && (
      (email === 'admin@gridsense.com' && password === 'adminpassword') ||
      (email === 'operator@gridsense.com' && password === 'operatorpassword')
    )) {
      const role = email === 'admin@gridsense.com' ? 'Admin' : 'Operator';
      const name = role === 'Admin' ? 'Jane Doe (Admin)' : 'John Smith (Operator)';
      
      const token = jwt.sign(
        { email, role, name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        token,
        user: { email, role, name }
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Token Required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or Expired Token' });
    req.user = user;
    next();
  });
}

module.exports = {
  router,
  authenticateToken
};
