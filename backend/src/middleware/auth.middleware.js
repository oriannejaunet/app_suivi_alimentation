import { getTokenFromRequest, verifyToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Session invalide ou expirée' });
  }
}
