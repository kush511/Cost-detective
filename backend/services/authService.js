const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../database/db');

function getJwtSecret() {
  return process.env.JWT_SECRET || '';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function createToken(user) {
  const secret = getJwtSecret();

  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
    },
    secret,
    { expiresIn: '7d' }
  );
}

async function findUserByEmail(email) {
  const result = await query(
    `
      SELECT id, email, password_hash
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [normalizeEmail(email)]
  );

  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await query(
    `
      SELECT id, email
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function signup({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    return { success: false, statusCode: 400, message: 'Please enter a valid email address.' };
  }

  if (!isValidPassword(password)) {
    return { success: false, statusCode: 400, message: 'Password must be at least 8 characters long.' };
  }

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    return { success: false, statusCode: 409, message: 'Email already exists.' };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await query(
    `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email
    `,
    [normalizedEmail, passwordHash]
  );

  const user = result.rows[0];
  return {
    success: true,
    token: createToken(user),
    user,
  };
}

async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail) || !password) {
    return { success: false, statusCode: 400, message: 'Please enter valid credentials.' };
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return { success: false, statusCode: 401, message: 'Invalid credentials.' };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return { success: false, statusCode: 401, message: 'Invalid credentials.' };
  }

  return {
    success: true,
    token: createToken(user),
    user: {
      id: user.id,
      email: user.email,
    },
  };
}

module.exports = {
  signup,
  login,
  findUserById,
  createToken,
};