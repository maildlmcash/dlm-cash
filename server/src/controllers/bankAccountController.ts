import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

// Validation for creating/updating bank account
export const createBankAccountValidation = [
  body('accountName').trim().notEmpty().withMessage('Account name is required'),
  body('accountNumber').trim().notEmpty().withMessage('Account number is required'),
  body('ifscCode').trim().notEmpty().withMessage('IFSC code is required'),
  body('bankName').trim().notEmpty().withMessage('Bank name is required'),
  body('branchName').optional().trim(),
  body('upiId').optional().trim(),
  body('isActive').optional().isBoolean(),
  body('visibilityType').optional().isIn(['ALL_USERS', 'KYC_VERIFIED', 'SPECIFIC_USERS']),
  body('assignedUserIds').optional().isArray(),
];

export const updateBankAccountValidation = [
  body('accountName').optional().trim().notEmpty(),
  body('accountNumber').optional().trim().notEmpty(),
  body('ifscCode').optional().trim().notEmpty(),
  body('bankName').optional().trim().notEmpty(),
  body('branchName').optional().trim(),
  body('upiId').optional().trim(),
  body('isActive').optional().isBoolean(),
  body('visibilityType').optional().isIn(['ALL_USERS', 'KYC_VERIFIED', 'SPECIFIC_USERS']),
  body('assignedUserIds').optional().isArray(),
];

// Get all bank accounts (admin only)
export const getAllBankAccounts = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const bankAccounts = await prisma.bankAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, bankAccounts, 'Bank accounts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get active bank accounts (for users)
export const getActiveBankAccounts = async (
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
    const bankAccounts = await prisma.bankAccount.findMany({
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
        accountName: true,
        accountNumber: true,
        ifscCode: true,
        bankName: true,
        branchName: true,
        upiId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, bankAccounts, 'Active bank accounts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get bank account by ID
export const getBankAccountById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!bankAccount) {
      throw new AppError('Bank account not found', 404);
    }

    successResponse(res, bankAccount, 'Bank account retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Create bank account
export const createBankAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accountName, accountNumber, ifscCode, bankName, branchName, upiId, isActive, visibilityType, assignedUserIds } = req.body;

    const bankAccount = await prisma.bankAccount.create({
      data: {
        accountName,
        accountNumber,
        ifscCode,
        bankName,
        branchName: branchName || null,
        upiId: upiId || null,
        isActive: isActive !== undefined ? isActive : true,
        visibilityType: visibilityType || 'ALL_USERS',
        assignedUserIds: assignedUserIds || [],
      },
    });

    successResponse(res, bankAccount, 'Bank account created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Update bank account
export const updateBankAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { accountName, accountNumber, ifscCode, bankName, branchName, upiId, isActive, visibilityType, assignedUserIds } = req.body;

    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!bankAccount) {
      throw new AppError('Bank account not found', 404);
    }

    const updatedBankAccount = await prisma.bankAccount.update({
      where: { id },
      data: {
        ...(accountName && { accountName }),
        ...(accountNumber && { accountNumber }),
        ...(ifscCode && { ifscCode }),
        ...(bankName && { bankName }),
        ...(branchName !== undefined && { branchName: branchName || null }),
        ...(upiId !== undefined && { upiId: upiId || null }),
        ...(isActive !== undefined && { isActive }),
        ...(visibilityType && { visibilityType }),
        ...(assignedUserIds !== undefined && { assignedUserIds }),
      },
    });

    successResponse(res, updatedBankAccount, 'Bank account updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete bank account
export const deleteBankAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id },
      include: {
        deposits: {
          where: {
            status: 'PENDING',
          },
        },
      },
    });

    if (!bankAccount) {
      throw new AppError('Bank account not found', 404);
    }

    // Check if there are pending deposits for this account
    if (bankAccount.deposits.length > 0) {
      throw new AppError('Cannot delete bank account with pending deposits', 400);
    }

    await prisma.bankAccount.delete({
      where: { id },
    });

    successResponse(res, null, 'Bank account deleted successfully');
  } catch (error) {
    next(error);
  }
};

