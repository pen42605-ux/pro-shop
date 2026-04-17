'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

const publicDir = path.join(__dirname, '..', 'public');
const indexPath = path.join(publicDir, 'index.html');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// API first (/health, /auth/*, /auth/line/*)
app.use(routes);

app.use(
  express.static(publicDir, {
    fallthrough: true,
    index: false,
    dotfiles: 'ignore',
  })
);

// SPA fallback (VIP 商城多頁 + 無對應檔時回 index.html)
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }
  res.sendFile(indexPath, (err) => {
    if (err) next(err);
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
