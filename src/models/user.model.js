'use strict';

const { pool } = require('../services/db');

async function findByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT id, email, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function createUser(email, passwordHash) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, created_at`,
    [email, passwordHash]
  );
  return rows[0];
}

module.exports = { findByEmail, findById, createUser };
