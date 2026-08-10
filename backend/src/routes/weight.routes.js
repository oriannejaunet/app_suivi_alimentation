import { Router } from 'express';
import { z } from 'zod';
import { logWeight, listWeights } from '../controllers/weight.controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

const logWeightSchema = z.object({
  weightKg: z.number().positive().max(500),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

router.post('/', validateBody(logWeightSchema), logWeight);
router.get('/', listWeights);

export default router;
