import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const createTicketValidation = [
  body('subject').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
];

export const createTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subject, description, priority } = req.body;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.id,
        subject,
        description,
        status: 'OPEN',
        priority: priority || 'MEDIUM',
      },
    });

    successResponse(res, ticket, 'Support ticket created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user.id };
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    paginatedResponse(
      res,
      tickets,
      Number(page),
      Number(limit),
      total,
      'Support tickets retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    successResponse(res, ticket, 'Ticket retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Admin functions
export const getAllTickets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    paginatedResponse(
      res,
      tickets,
      Number(page),
      Number(limit),
      total,
      'All tickets retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status,
        assignedTo,
      },
    });

    successResponse(res, ticket, 'Ticket status updated successfully');
  } catch (error) {
    next(error);
  }
};
