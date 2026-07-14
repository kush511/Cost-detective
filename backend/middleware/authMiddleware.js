const jwt = require('jsonwebtoken');
const { findUserById } = require('../services/authService');

function getJwtSecret() {
  return process.env.JWT_SECRET || '';
}

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    const secret = getJwtSecret();
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Authentication is not configured.',
      });
    }

    const payload = jwt.verify(token, secret);
    const userId = Number(payload.sub);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
}

module.exports = {
  requireAuth,
};