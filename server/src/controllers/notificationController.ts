import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { successResponse, paginatedResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user.id };
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    paginatedResponse(
      res,
      notifications,
      Number(page),
      Number(limit),
      total,
      'Notifications retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: {
        id,
        userId: req.user.id,
      },
      data: { isRead: true },
    });

    successResponse(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    successResponse(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    successResponse(res, { count }, 'Unread count retrieved successfully');
  } catch (error) {
    next(error);
  }
};
