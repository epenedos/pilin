import { Router } from 'express';
import { budgetsController } from '../controllers/budgets.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { createBudgetSchema, updateBudgetSchema, copyBudgetSchema } from '../schemas/budget.schema';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(budgetsController.list as any));
router.post('/', validate(createBudgetSchema), asyncHandler(budgetsController.create as any));
router.post('/copy', validate(copyBudgetSchema), asyncHandler(budgetsController.copy as any));
router.put('/:id', validate(updateBudgetSchema), asyncHandler(budgetsController.update as any));
router.delete('/:id', asyncHandler(budgetsController.delete as any));

export default router;
