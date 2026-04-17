'use strict';

const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;

function assertSecret() {
  if (!secret) {
    const err = new Error('JWT_SECRET is not configured');
    err.statusCode = 500;
    throw err;
  }
}

function signPayload(payload, options = {}) {
  assertSecret();
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: options.expiresIn || '7d',
  });
}

function verifyToken(token) {
  assertSecret();
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

module.exports = { signPayload, verifyToken };
