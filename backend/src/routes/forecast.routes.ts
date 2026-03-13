import { Router } from 'express';
import { forecastController } from '../controllers/forecast.controller';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(forecastController.forecast as any));

export default router;
