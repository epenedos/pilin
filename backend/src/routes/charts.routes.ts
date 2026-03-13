import { Router } from 'express';
import { chartsController } from '../controllers/charts.controller';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();
router.use(authenticate);

router.get('/sankey/monthly', asyncHandler(chartsController.monthlySankey as any));
router.get('/sankey/annual', asyncHandler(chartsController.annualSankey as any));

export default router;
