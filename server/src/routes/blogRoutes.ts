import { Router } from 'express';
import {
  getPublishedPosts,
  getPostBySlug,
  getCategories,
  createPost,
  createPostValidation,
  updatePost,
  deletePost,
  createCategory,
} from '../controllers/blogController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

// Public routes
router.get('/posts', getPublishedPosts);
router.get('/posts/:slug', getPostBySlug);
router.get('/categories', getCategories);

// Admin routes
router.post(
  '/posts',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate(createPostValidation),
  createPost
);
router.put(
  '/posts/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN'),
  updatePost
);
router.delete(
  '/posts/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN'),
  deletePost
);
router.post(
  '/categories',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN'),
  createCategory
);

export default router;
