import { Router } from 'express';
import { entriesController } from '../controllers/entries.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { createEntrySchema, updateEntrySchema, updateRecurringSchema } from '../schemas/entry.schema';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(entriesController.list as any));
router.post('/', validate(createEntrySchema), asyncHandler(entriesController.create as any));
router.put('/:id', validate(updateEntrySchema), asyncHandler(entriesController.update as any));
router.delete('/:id', asyncHandler(entriesController.delete as any));

router.get('/recurring', asyncHandler(entriesController.listRecurring as any));
router.put('/recurring/:id', validate(updateRecurringSchema), asyncHandler(entriesController.updateRecurring as any));
router.delete('/recurring/:id', asyncHandler(entriesController.deleteRecurring as any));

export default router;
