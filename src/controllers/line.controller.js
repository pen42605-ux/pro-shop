'use strict';

const crypto = require('crypto');
const lineService = require('../services/line.service');

/**
 * Returns LINE authorize URL. In production, persist `state` server-side and verify on callback.
 */
function lineAuthorizeUrl(req, res, next) {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    const url = lineService.getAuthorizeUrl({ state });
    return res.json({ url, state });
  } catch (e) {
    return next(e);
  }
}

async function lineCallback(req, res, next) {
  const code = req.query.code;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code' });
  }
  try {
    const { profile } = await lineService.exchangeCodeForProfile(code);
    return res.json({ lineUserId: profile.userId, displayName: profile.displayName });
  } catch (e) {
    return next(e);
  }
}

module.exports = { lineAuthorizeUrl, lineCallback };
