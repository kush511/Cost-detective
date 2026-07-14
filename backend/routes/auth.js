const express = require('express');
const { login, signup } = require('../services/authService');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const result = await signup(req.body || {});

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(201).json({
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Signup failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to create account.',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const result = await login(req.body || {});

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to sign in.',
    });
  }
});

module.exports = router;