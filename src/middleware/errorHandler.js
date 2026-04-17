'use strict';

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, _next) {
  const status = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const body = {
    error: status >= 500 && isProd ? 'Internal server error' : err.message || 'Error',
  };
  if (!isProd && err.details) body.details = err.details;
  if (status >= 500) console.error(err);
  res.status(status).json(body);
}

module.exports = { notFoundHandler, errorHandler };
