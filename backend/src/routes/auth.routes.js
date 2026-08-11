import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { register, login, logout, me } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const credentialsSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

router.post('/register', authLimiter, validateBody(credentialsSchema), register);
router.post('/login', authLimiter, validateBody(credentialsSchema), login);
router.post('/logout', logout);
router.get('/me', me);

export default router;
