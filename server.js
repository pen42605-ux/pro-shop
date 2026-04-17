'use strict';

require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const { pool } = require('./src/services/db');

const port = (() => {
  const p = process.env.PORT;
  if (p !== undefined && String(p).trim() !== '') {
    const n = parseInt(String(p), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 3000;
})();
const server = http.createServer(app);

function shutdown(signal) {
  return new Promise((resolve) => {
    console.info(`${signal} received, closing HTTP server`);
    server.close((err) => {
      if (err) console.error(err);
      pool
        .end()
        .then(() => {
          console.info('PostgreSQL pool closed');
          resolve();
        })
        .catch((e) => {
          console.error('Error closing pool', e);
          resolve();
        });
    });
  });
}

async function onSignal(signal) {
  await shutdown(signal);
  process.exit(0);
}

process.once('SIGTERM', () => onSignal('SIGTERM'));
process.once('SIGINT', () => onSignal('SIGINT'));

server.listen(port, '0.0.0.0', () => {
  console.info(`HTTP server listening on 0.0.0.0:${port} (PORT=${process.env.PORT || ''})`);
});

server.on('error', (err) => {
  console.error('Server error', err);
  process.exit(1);
});
