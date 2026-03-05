import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse, paginatedResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { sendAuthKeyEmail } from '../utils/email';

// Generate unique Authentication Key code with plan prefix
function generateAuthKeyCode(planName: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  // Get first 4 letters of plan name, convert to uppercase, and remove non-alphanumeric
  let prefix = planName
    .replace(/[^a-zA-Z0-9]/g, '') // Remove non-alphanumeric characters
    .toUpperCase()
    .substring(0, 4);
  
  // Pad with random characters if less than 4 characters
  while (prefix.length < 4) {
    prefix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Generate remaining 8 random characters
  let randomPart = '';
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return prefix + randomPart;
}

export const generateAuthKeysValidation = [
  body('planId').isUUID(),
  body('quantity').isInt({ min: 1, max: 1000 }),
  body('distributeToUserId').optional().isUUID(),
];

// Generate Authentication Keys for a plan
export const generateAuthKeys = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { planId, quantity, distributeToUserId } = req.body;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    const authKeys = [];
    for (let i = 0; i < quantity; i++) {
      let code = generateAuthKeyCode(plan.name);
      let isUnique = false;
      
      // Ensure code is unique
      while (!isUnique) {
        const existing = await prisma.authKey.findUnique({
          where: { code },
        });
        if (!existing) {
          isUnique = true;
        } else {
          code = generateAuthKeyCode(plan.name);
        }
      }

      const authKey = await prisma.authKey.create({
        data: {
          code,
          planId,
          generatedBy: req.user.id,
          distributedTo: distributeToUserId || null,
          status: 'ACTIVE',
        },
      });

      authKeys.push(authKey);
    }

    successResponse(res, { authKeys, count: authKeys.length }, `${quantity} Authentication Keys generated successfully`, 201);
  } catch (error) {
    next(error);
  }
};

// Get all Authentication Keys with filters
export const getAuthKeys = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 20, planId, status, distributedTo } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (planId) where.planId = planId;
    if (status) where.status = status;
    if (distributedTo === 'any') {
      // Filter for any distributed E-PINs (not null)
      where.distributedTo = { not: null };
    } else if (distributedTo === 'false') {
      // Filter for not distributed (null)
      where.distributedTo = null;
    } else if (distributedTo && distributedTo !== 'any' && distributedTo !== 'false') {
      // If specific user ID provided
      where.distributedTo = distributedTo;
    }

    const [authKeysData, total] = await Promise.all([
      prisma.authKey.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              amount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.authKey.count({ where }),
    ]);

    // Fetch user information for usedBy and distributedTo fields
    const authKeys = await Promise.all(
      authKeysData.map(async (authKey) => {
        let usedByUser = null;
        let distributedToUser = null;
        
        if (authKey.usedBy) {
          const user = await prisma.user.findUnique({
            where: { id: authKey.usedBy },
            select: {
              id: true,
              name: true,
              email: true,
            },
          });
          if (user) {
            usedByUser = {
              id: user.id,
              name: user.name,
              email: user.email || '',
            };
          }
        }
        
        if (authKey.distributedTo) {
          const user = await prisma.user.findUnique({
            where: { id: authKey.distributedTo },
            select: {
              id: true,
              name: true,
              email: true,
            },
          });
          if (user) {
            distributedToUser = {
              id: user.id,
              name: user.name,
              email: user.email || '',
            };
          }
        }
        
        return {
          ...authKey,
          usedByUser,
          distributedToUser,
        };
      })
    );

    paginatedResponse(
      res,
      authKeys,
      Number(page),
      Number(limit),
      total,
      'E-PINs retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// Distribute Authentication Key to a user
export const distributeAuthKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const authKey = await prisma.authKey.findUnique({
      where: { id },
      include: {
        plan: true,
      },
    });

    if (!authKey) {
      throw new AppError('Authentication Key not found', 404);
    }

    if (authKey.status !== 'ACTIVE') {
      throw new AppError('Authentication Key is not active', 400);
    }

    if (authKey.distributedTo) {
      throw new AppError('Authentication Key is already distributed to a user', 400);
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.email) {
      throw new AppError('User does not have an email address', 400);
    }

    // Update Authentication Key
    const updatedAuthKey = await prisma.authKey.update({
      where: { id },
      data: {
        distributedTo: userId,
      },
      include: {
        plan: true,
      },
    });

    // Send Authentication Key email to user
    try {
      await sendAuthKeyEmail(
        user.email,
        authKey.code,
        authKey.plan.name,
        user.name || undefined
      );
    } catch (emailError) {
      console.error('Failed to send Authentication Key email:', emailError);
      // Continue even if email fails - key is still distributed
    }

    successResponse(res, updatedAuthKey, 'Authentication Key distributed successfully and email sent to user');
  } catch (error) {
    next(error);
  }
};

// Distribute Authentication Key to manual email
export const distributeAuthKeyToEmailValidation = [
  body('email').isEmail().normalizeEmail(),
];

export const distributeAuthKeyToEmail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const authKey = await prisma.authKey.findUnique({
      where: { id },
      include: {
        plan: true,
      },
    });

    if (!authKey) {
      throw new AppError('Authentication Key not found', 404);
    }

    if (authKey.status !== 'ACTIVE') {
      throw new AppError('Authentication Key is not active', 400);
    }

    if (authKey.distributedTo) {
      throw new AppError('Authentication Key is already distributed', 400);
    }

    // Send Authentication Key email FIRST before assigning
    try {
      await sendAuthKeyEmail(
        email,
        authKey.code,
        authKey.plan.name,
        undefined // No name for manual emails
      );
    } catch (emailError) {
      console.error('Failed to send Authentication Key email:', emailError);
      // Don't assign the key if email fails
      throw new AppError(`Failed to send email to ${email}. Please verify the email address is correct.`, 400);
    }

    // Only assign the key AFTER email is successfully sent
    const updatedAuthKey = await prisma.authKey.update({
      where: { id },
      data: {
        distributedTo: email, // Store the actual email address
      },
      include: {
        plan: true,
      },
    });

    successResponse(res, updatedAuthKey, `Authentication Key sent successfully to ${email}`);
  } catch (error) {
    next(error);
  }
};

// Get Authentication Key statistics
export const getAuthKeyStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { planId } = req.query;

    const where: any = {};
    if (planId) where.planId = planId as string;

    const [total, active, used, distributed, notDistributed] = await Promise.all([
      prisma.authKey.count({ where }),
      prisma.authKey.count({ where: { ...where, status: 'ACTIVE', usedBy: null } }),
      prisma.authKey.count({ where: { ...where, usedBy: { not: null } } }),
      prisma.authKey.count({ where: { ...where, distributedTo: { not: null } } }),
      prisma.authKey.count({ where: { ...where, distributedTo: null } }),
    ]);

    // Get stats by plan if planId is not specified
    let statsByPlan: any[] = [];
    if (!planId) {
      const plans = await prisma.plan.findMany({
        select: { id: true, name: true },
      });

      statsByPlan = await Promise.all(
        plans.map(async (plan) => {
          const planWhere = { ...where, planId: plan.id };
          const [planTotal, planActive, planUsed, planDistributed, planNotDistributed] = await Promise.all([
            prisma.authKey.count({ where: planWhere }),
            prisma.authKey.count({ where: { ...planWhere, status: 'ACTIVE', usedBy: null } }),
            prisma.authKey.count({ where: { ...planWhere, usedBy: { not: null } } }),
            prisma.authKey.count({ where: { ...planWhere, distributedTo: { not: null } } }),
            prisma.authKey.count({ where: { ...planWhere, distributedTo: null } }),
          ]);

          return {
            planId: plan.id,
            planName: plan.name,
            total: planTotal,
            active: planActive,
            used: planUsed,
            distributed: planDistributed,
            notDistributed: planNotDistributed,
            remaining: planTotal - planUsed,
          };
        })
      );
    }

    successResponse(
      res,
      {
        total,
        active,
        used,
        distributed,
        notDistributed,
        remaining: total - used,
        statsByPlan,
      },
      'Authentication Key statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};


