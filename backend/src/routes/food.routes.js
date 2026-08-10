import { Router } from 'express';
import { z } from 'zod';
import { getByBarcode, search, createCustom } from '../controllers/food.controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

const customFoodSchema = z.object({
  foodName: z.string().min(1, 'Nom requis').max(100),
  caloriesPer100g: z.number().nonnegative(),
  proteinPer100g: z.number().nonnegative().optional(),
  carbsPer100g: z.number().nonnegative().optional(),
  fatPer100g: z.number().nonnegative().optional(),
});

router.get('/barcode/:barcode', getByBarcode);
router.get('/search', search);
router.post('/custom', validateBody(customFoodSchema), createCustom);

export default router;
