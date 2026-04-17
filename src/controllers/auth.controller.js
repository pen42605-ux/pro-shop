'use strict';

const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const { signPayload } = require('../services/jwt.service');

const SALT_ROUNDS = 12;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateEmail(email) {
  if (!email || email.length > 255) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function register(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await userModel.findByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userModel.createUser(email, passwordHash);
  const token = signPayload({ sub: String(user.id), email: user.email });

  return res.status(201).json({
    user: { id: user.id, email: user.email, created_at: user.created_at },
    token,
  });
}

async function login(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!validateEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const user = await userModel.findByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signPayload({ sub: String(user.id), email: user.email });
  return res.json({
    user: { id: user.id, email: user.email, created_at: user.created_at },
    token,
  });
}

async function me(req, res) {
  const user = await userModel.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user });
}

module.exports = { register, login, me };
