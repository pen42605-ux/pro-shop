'use strict';

const { pool } = require('../services/db');

async function health(_req, res) {
  let dbOk = false;
  try {
    await pool.query('SELECT 1');
    dbOk = true;
  } catch {
    dbOk = false;
  }

  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    database: dbOk ? 'up' : 'down',
    uptime: process.uptime(),
  });
}

module.exports = { health };
