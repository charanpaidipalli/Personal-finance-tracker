const { createHash, randomBytes, scrypt, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const scryptAsync = promisify(scrypt);

const COOKIE_NAME = 'finance_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password, salt) {
  const key = await scryptAsync(password, salt, 64);
  return key.toString('hex');
}

async function verifyPassword(password, salt, storedHash) {
  const actual = Buffer.from(await hashPassword(password, salt), 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: SESSION_DURATION
  };
}

function createSessionToken() {
  return randomBytes(32).toString('hex');
}

function readSessionToken(req) {
  const cookie = (req.headers.cookie || '')
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${COOKIE_NAME}=`));
  return cookie?.slice(COOKIE_NAME.length + 1);
}

module.exports = {
  COOKIE_NAME,
  SESSION_DURATION,
  createSessionToken,
  hashPassword,
  hashToken,
  readSessionToken,
  sessionCookieOptions,
  verifyPassword
};
