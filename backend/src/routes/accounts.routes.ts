import { Router } from 'express';
import { accountsController } from '../controllers/accounts.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { createAccountSchema, updateAccountSchema } from '../schemas/account.schema';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(accountsController.list as any));
router.get('/balances', asyncHandler(accountsController.balances as any));
router.post('/', validate(createAccountSchema), asyncHandler(accountsController.create as any));
router.put('/:id', validate(updateAccountSchema), asyncHandler(accountsController.update as any));
router.delete('/:id', asyncHandler(accountsController.delete as any));

export default router;
