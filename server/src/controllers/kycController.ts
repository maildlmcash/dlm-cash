import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const uploadKycValidation = [
  body('docType').isIn(['PAN', 'AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID']),
  body('phone').optional().custom((value) => {
    if (value) {
      // Accept E.164 format: +[country code][number]
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(value)) {
        throw new Error('Phone number must be in E.164 format (e.g., +1234567890)');
      }
    }
    return true;
  }),
];

export const uploadKyc = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { docType, phone } = req.body;
    const files = req.files as any;

    if (!files?.document || !files?.selfie) {
      throw new AppError('Document and selfie are required', 400);
    }

    // Check if user already has required documents (PAN + one additional)
    const existingKycDocs = await prisma.kycDocument.findMany({
      where: {
        userId: req.user.id,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    // Check if PAN is already submitted
    const hasPan = existingKycDocs.some(doc => doc.docType === 'PAN');
    
    // Check if an additional document is already submitted
    const hasAdditionalDoc = existingKycDocs.some(doc => 
      ['AADHAAR', 'PASSPORT', 'VOTER_ID'].includes(doc.docType)
    );

    // If submitting PAN and already have PAN
    if (docType === 'PAN' && hasPan) {
      throw new AppError('PAN Card already submitted', 400);
    }

    // If submitting additional doc and already have one
    if (['AADHAAR', 'PASSPORT', 'VOTER_ID'].includes(docType) && hasAdditionalDoc) {
      throw new AppError('Additional document already submitted', 400);
    }

    // If user has both PAN and additional doc and status is APPROVED, don't allow new submissions
    if (hasPan && hasAdditionalDoc) {
      const approvedKyc = existingKycDocs.find(doc => doc.status === 'APPROVED');
      if (approvedKyc) {
        throw new AppError('KYC already approved. Cannot submit new documents.', 400);
      }
    }

    // Update user's phone number if provided and different
    if (phone) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { phone: true },
      });

      if (user?.phone !== phone) {
        // Check if phone is already taken by another user
        const phoneExists = await prisma.user.findFirst({
          where: {
            phone,
            id: { not: req.user.id },
          },
        });

        if (phoneExists) {
          throw new AppError('Phone number already registered', 400);
        }

        // Update user phone
        await prisma.user.update({
          where: { id: req.user.id },
          data: { phone },
        });
      }
    }

    // Create the KYC document
    const kycDocument = await prisma.kycDocument.create({
      data: {
        userId: req.user.id,
        docType,
        fileUrl: files.document[0].path,
        selfieUrl: files.selfie[0].path,
        status: 'PENDING',
      },
    });

    // Check if user now has both PAN and an additional document
    const allKycDocs = await prisma.kycDocument.findMany({
      where: {
        userId: req.user.id,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    const hasPanNow = allKycDocs.some(doc => doc.docType === 'PAN');
    const hasAdditionalDocNow = allKycDocs.some(doc => 
      ['AADHAAR', 'PASSPORT', 'VOTER_ID'].includes(doc.docType)
    );

    // Only update user KYC status to PENDING if both documents are submitted
    if (hasPanNow && hasAdditionalDocNow) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { kycStatus: 'PENDING' },
      });
    }

    const message = hasPanNow && hasAdditionalDocNow
      ? 'KYC documents uploaded successfully. Your KYC is now pending review.'
      : docType === 'PAN'
      ? 'PAN Card uploaded successfully. Please upload an additional document (Aadhaar, Voter ID, or Passport).'
      : 'Document uploaded successfully. Please upload PAN Card to complete KYC submission.';

    successResponse(res, kycDocument, message, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyKyc = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const kycDocuments = await prisma.kycDocument.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, kycDocuments, 'KYC documents retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getKycStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { kycStatus: true },
    });

    successResponse(res, { kycStatus: user?.kycStatus }, 'KYC status retrieved successfully');
  } catch (error) {
    next(error);
  }
};
