import { Router } from 'express';
import { externalController } from '../controllers/external.controller';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { createExternalExpenseSchema } from '../schemas/external.schema';

const router = Router();

router.post('/expense', validate(createExternalExpenseSchema), asyncHandler(externalController.createExpense));

export default router;
