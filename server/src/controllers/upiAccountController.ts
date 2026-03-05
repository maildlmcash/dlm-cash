import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

// Validation for creating/updating UPI account
export const createUpiAccountValidation = [
  body('displayName').trim().notEmpty().withMessage('Display name is required'),
  body('upiId').trim().notEmpty().withMessage('UPI ID is required')
    .matches(/^[\w.-]+@[\w.-]+$/).withMessage('Invalid UPI ID format'),
  body('isActive').optional().isBoolean(),
  body('visibilityType').optional().isIn(['ALL_USERS', 'KYC_VERIFIED', 'SPECIFIC_USERS']),
  body('assignedUserIds').optional(),
];

export const updateUpiAccountValidation = [
  body('displayName').optional().trim().notEmpty(),
  body('upiId').optional().trim().notEmpty()
    .matches(/^[\w.-]+@[\w.-]+$/).withMessage('Invalid UPI ID format'),
  body('isActive').optional().isBoolean(),
  body('visibilityType').optional().isIn(['ALL_USERS', 'KYC_VERIFIED', 'SPECIFIC_USERS']),
  body('assignedUserIds').optional(),
];

// Get all UPI accounts (admin only)
export const getAllUpiAccounts = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const upiAccounts = await prisma.upiAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, upiAccounts, 'UPI accounts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get active UPI accounts (for users)
export const getActiveUpiAccounts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isKycVerified = user.kycStatus === 'APPROVED';

    // Build the filter based on visibility rules
    const upiAccounts = await prisma.upiAccount.findMany({
      where: {
        isActive: true,
        OR: [
          { visibilityType: 'ALL_USERS' },
          { visibilityType: 'KYC_VERIFIED', ...(isKycVerified ? {} : { id: 'never' }) },
          { visibilityType: 'SPECIFIC_USERS', assignedUserIds: { has: userId } }
        ]
      },
      select: {
        id: true,
        displayName: true,
        upiId: true,
        qrCodeUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, upiAccounts, 'Active UPI accounts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get UPI account by ID
export const getUpiAccountById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const upiAccount = await prisma.upiAccount.findUnique({
      where: { id },
    });

    if (!upiAccount) {
      throw new AppError('UPI account not found', 404);
    }

    successResponse(res, upiAccount, 'UPI account retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Create UPI account
export const createUpiAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { displayName, upiId, isActive, visibilityType, assignedUserIds } = req.body;
    const file = req.file;

    // Build QR code URL from uploaded file
    let qrCodeUrl = null;
    if (file) {
      qrCodeUrl = `/uploads/${file.filename}`;
    }

    // Parse assignedUserIds if it's a string (from FormData)
    let parsedAssignedUserIds = [];
    if (assignedUserIds) {
      try {
        parsedAssignedUserIds = typeof assignedUserIds === 'string' ? JSON.parse(assignedUserIds) : assignedUserIds;
      } catch (e) {
        parsedAssignedUserIds = [];
      }
    }

    // Parse isActive if it's a string (from FormData)
    const parsedIsActive = isActive === 'true' || isActive === true;

    const upiAccount = await prisma.upiAccount.create({
      data: {
        displayName,
        upiId,
        qrCodeUrl,
        isActive: parsedIsActive,
        visibilityType: visibilityType || 'ALL_USERS',
        assignedUserIds: parsedAssignedUserIds,
      },
    });

    successResponse(res, upiAccount, 'UPI account created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Update UPI account
export const updateUpiAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { displayName, upiId, isActive, visibilityType, assignedUserIds } = req.body;
    const file = req.file;

    const upiAccount = await prisma.upiAccount.findUnique({
      where: { id },
    });

    if (!upiAccount) {
      throw new AppError('UPI account not found', 404);
    }

    // Build update data
    const updateData: any = {};
    if (displayName) updateData.displayName = displayName;
    if (upiId) updateData.upiId = upiId;
    
    // Parse isActive if it's a string (from FormData)
    if (isActive !== undefined) {
      updateData.isActive = isActive === 'true' || isActive === true;
    }
    
    if (visibilityType) updateData.visibilityType = visibilityType;
    
    // Parse assignedUserIds if it's a string (from FormData)
    if (assignedUserIds !== undefined) {
      try {
        updateData.assignedUserIds = typeof assignedUserIds === 'string' ? JSON.parse(assignedUserIds) : assignedUserIds;
      } catch (e) {
        updateData.assignedUserIds = [];
      }
    }
    
    // Handle QR code file upload
    if (file) {
      updateData.qrCodeUrl = `/uploads/${file.filename}`;
    }

    const updatedUpiAccount = await prisma.upiAccount.update({
      where: { id },
      data: updateData,
    });

    successResponse(res, updatedUpiAccount, 'UPI account updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete UPI account
export const deleteUpiAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const upiAccount = await prisma.upiAccount.findUnique({
      where: { id },
      include: {
        deposits: {
          where: {
            status: 'PENDING',
          },
        },
      },
    });

    if (!upiAccount) {
      throw new AppError('UPI account not found', 404);
    }

    // Check if there are pending deposits for this account
    if (upiAccount.deposits.length > 0) {
      throw new AppError('Cannot delete UPI account with pending deposits', 400);
    }

    await prisma.upiAccount.delete({
      where: { id },
    });

    successResponse(res, null, 'UPI account deleted successfully');
  } catch (error) {
    next(error);
  }
};
