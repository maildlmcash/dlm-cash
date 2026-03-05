import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const addBankAccountValidation = [
  body('accountName').trim().notEmpty().withMessage('Account name is required'),
  body('accountNumber').trim().notEmpty().withMessage('Account number is required'),
  body('ifscCode').trim().notEmpty().withMessage('IFSC code is required').isLength({ min: 11, max: 11 }).withMessage('IFSC code must be 11 characters'),
  body('bankName').trim().notEmpty().withMessage('Bank name is required'),
  body('branchName').optional().trim(),
];

export const addBankAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accountName, accountNumber, ifscCode, bankName, branchName } = req.body;

    // Check if account number already exists for this user
    const existingAccount = await prisma.userBankAccount.findFirst({
      where: {
        userId: req.user.id,
        accountNumber: accountNumber,
        isActive: true,
      },
    });

    if (existingAccount) {
      throw new AppError('This bank account is already added', 400);
    }

    const bankAccount = await prisma.userBankAccount.create({
      data: {
        userId: req.user.id,
        accountName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        bankName,
        branchName: branchName || null,
      },
    });

    successResponse(res, bankAccount, 'Bank account added successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getUserBankAccounts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const bankAccounts = await prisma.userBankAccount.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    successResponse(res, bankAccounts, 'Bank accounts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteBankAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const bankAccount = await prisma.userBankAccount.findUnique({
      where: { id },
    });

    if (!bankAccount) {
      throw new AppError('Bank account not found', 404);
    }

    if (bankAccount.userId !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }

    // Soft delete by setting isActive to false
    await prisma.userBankAccount.update({
      where: { id },
      data: { isActive: false },
    });

    successResponse(res, null, 'Bank account deleted successfully');
  } catch (error) {
    next(error);
  }
};
