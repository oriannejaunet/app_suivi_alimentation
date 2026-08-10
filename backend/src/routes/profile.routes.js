import { Router } from 'express';
import { z } from 'zod';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

const profileSchema = z.object({
  heightCm: z.number().positive().max(300).optional(),
  weightKg: z.number().positive().max(500).optional(),
  age: z.number().int().positive().max(130).optional(),
  gender: z.enum(['male', 'female']).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  goal: z.enum(['lose', 'maintain', 'gain']).optional(),
  goalRateKcal: z.number().int().min(-1500).max(1500).optional(),
});

router.get('/', getProfile);
router.put('/', validateBody(profileSchema), updateProfile);

export default router;
