import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

// Public blog endpoints
export const getPublishedPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isPublished: true };
    if (category) where.categoryId = category;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { shortDesc: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          category: true,
        },
        orderBy: { publishAt: 'desc' },
      }),
      prisma.blogPost.count({ where }),
    ]);

    paginatedResponse(
      res,
      posts,
      Number(page),
      Number(limit),
      total,
      'Blog posts retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getPostBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        comments: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!post || !post.isPublished) {
      throw new AppError('Post not found', 404);
    }

    // Increment views
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { views: post.views + 1 },
    });

    successResponse(res, post, 'Post retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
    });

    successResponse(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Admin blog management
export const createPostValidation = [
  body('title').notEmpty().trim(),
  body('slug').notEmpty().trim(),
  body('content').notEmpty(),
  body('categoryId').optional().isUUID(),
  body('isPublished').optional().isBoolean(),
];

export const createPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, slug, shortDesc, content, categoryId, isPublished, tags, authorName } = req.body;

    // Check if slug exists
    const existing = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new AppError('Slug already exists', 400);
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        shortDesc,
        content,
        categoryId,
        isPublished: isPublished || false,
        publishAt: isPublished ? new Date() : null,
        tags: tags || [],
        authorName,
      },
    });

    successResponse(res, post, 'Post created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, slug, shortDesc, content, categoryId, isPublished, tags, authorName } = req.body;

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        shortDesc,
        content,
        categoryId,
        isPublished,
        publishAt: isPublished ? new Date() : null,
        tags,
        authorName,
      },
    });

    successResponse(res, post, 'Post updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.blogPost.delete({
      where: { id },
    });

    successResponse(res, null, 'Post deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, color } = req.body;
    
    // Generate slug from name if not provided
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = await prisma.blogCategory.create({
      data: { name, slug, color },
    });

    successResponse(res, category, 'Category created successfully', 201);
  } catch (error) {
    next(error);
  }
};
