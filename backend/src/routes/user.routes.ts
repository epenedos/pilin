import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { changePasswordSchema, updateCurrencySchema } from '../schemas/user.schema';

const router = Router();
router.use(authenticate);

router.get('/me', asyncHandler(userController.getProfile as any));
router.put('/me/password', validate(changePasswordSchema), asyncHandler(userController.changePassword as any));
router.put('/me/currency', validate(updateCurrencySchema), asyncHandler(userController.updateCurrency as any));

export default router;
