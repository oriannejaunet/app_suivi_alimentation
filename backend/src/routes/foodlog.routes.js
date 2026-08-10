import { Router } from 'express';
import { z } from 'zod';
import { createLog, listLogs, deleteLog } from '../controllers/foodlog.controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

const createLogSchema = z.object({
  barcode: z.string().optional(),
  foodName: z.string().min(1, 'Nom requis'),
  quantityG: z.number().positive('La quantité doit être positive'),
  caloriesPer100g: z.number().nonnegative(),
  proteinPer100g: z.number().nonnegative().optional(),
  carbsPer100g: z.number().nonnegative().optional(),
  fatPer100g: z.number().nonnegative().optional(),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

router.post('/', validateBody(createLogSchema), createLog);
router.get('/', listLogs);
router.delete('/:id', deleteLog);

export default router;
