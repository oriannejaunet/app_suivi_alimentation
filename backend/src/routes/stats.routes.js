import { Router } from 'express';
import { z } from 'zod';
import { getSummary, getHistory } from '../controllers/stats.controller.js';
import { validateQuery } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

const summaryQuerySchema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const historyQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

router.get('/summary', validateQuery(summaryQuerySchema), getSummary);
router.get('/history', validateQuery(historyQuerySchema), getHistory);

export default router;
