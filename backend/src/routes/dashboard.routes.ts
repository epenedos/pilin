import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/summary', asyncHandler(dashboardController.summary as any));

export default router;
