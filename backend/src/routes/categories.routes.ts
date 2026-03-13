import { Router } from 'express';
import { categoriesController } from '../controllers/categories.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(categoriesController.list as any));
router.post('/', validate(createCategorySchema), asyncHandler(categoriesController.create as any));
router.put('/:id', validate(updateCategorySchema), asyncHandler(categoriesController.update as any));
router.delete('/:id', asyncHandler(categoriesController.delete as any));

export default router;
