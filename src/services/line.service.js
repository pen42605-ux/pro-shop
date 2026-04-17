'use strict';

const axios = require('axios');

const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';

function requireLineConfig() {
  const { LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, LINE_REDIRECT_URI } = process.env;
  if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET || !LINE_REDIRECT_URI) {
    const err = new Error('LINE OAuth is not fully configured');
    err.statusCode = 503;
    throw err;
  }
  return { LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, LINE_REDIRECT_URI };
}

/**
 * Build LINE Login authorization URL (v2.1).
 * @param {{ state: string, scope?: string }} opts
 */
function getAuthorizeUrl(opts) {
  const { LINE_CHANNEL_ID, LINE_REDIRECT_URI } = requireLineConfig();
  const scope = opts.scope || 'profile openid email';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CHANNEL_ID,
    redirect_uri: LINE_REDIRECT_URI,
    scope,
    state: opts.state,
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token and fetch profile.
 * @param {string} code
 * @param {string} [state] unused; validate against session in real apps
 */
async function exchangeCodeForProfile(code) {
  const { LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, LINE_REDIRECT_URI } = requireLineConfig();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: LINE_REDIRECT_URI,
    client_id: LINE_CHANNEL_ID,
    client_secret: LINE_CHANNEL_SECRET,
  });

  const tokenRes = await axios.post(LINE_TOKEN_URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10_000,
    validateStatus: (s) => s < 500,
  });

  if (tokenRes.status !== 200 || !tokenRes.data?.access_token) {
    const err = new Error('LINE token exchange failed');
    err.statusCode = 400;
    err.details = tokenRes.data;
    throw err;
  }

  const accessToken = tokenRes.data.access_token;

  const profileRes = await axios.get(LINE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 10_000,
    validateStatus: (s) => s < 500,
  });

  if (profileRes.status !== 200) {
    const err = new Error('LINE profile fetch failed');
    err.statusCode = 502;
    err.details = profileRes.data;
    throw err;
  }

  return { profile: profileRes.data, accessToken };
}

module.exports = { getAuthorizeUrl, exchangeCodeForProfile };
