import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const COOKIE_NAME = 'token';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '30d' });
}

export function verifyToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  return payload.sub;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
};

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge: MAX_AGE_MS });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
}

export function getTokenFromRequest(req) {
  return req.cookies?.[COOKIE_NAME];
}
