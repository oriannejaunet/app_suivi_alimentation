import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { signToken, setAuthCookie, clearAuthCookie, getTokenFromRequest, verifyToken } from '../utils/jwt.js';
import { HttpError } from '../middleware/errorHandler.js';

function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user; // eslint-disable-line no-unused-vars
  return publicUser;
}

export async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(409, 'Un compte existe déjà avec cet email');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    setAuthCookie(res, signToken(user.id));
    res.status(201).json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new HttpError(401, 'Email ou mot de passe incorrect');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new HttpError(401, 'Email ou mot de passe incorrect');
    }
    setAuthCookie(res, signToken(user.id));
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  clearAuthCookie(res);
  res.status(204).end();
}

export async function me(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    const userId = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    res.json(toPublicUser(user));
  } catch {
    res.status(401).json({ error: 'Session invalide ou expirée' });
  }
}
