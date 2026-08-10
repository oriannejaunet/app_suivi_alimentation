import { Router } from 'express';
import { getSummary, getHistory } from '../controllers/stats.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/summary', getSummary);
router.get('/history', getHistory);

export default router;
