import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateReferralCode,
} from '../utils/auth';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { sendOTPEmail, generateOTP } from '../utils/email';
import { generateEvmWallet, encryptPrivateKey } from '../utils/evmWallet';
// import { sendPhoneOTP } from '../utils/otp';

export const registerValidation = [
  body('email')
    .optional()
    .custom((value) => {
      // If email is provided, it must be valid
      if (value && value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error('Invalid email format');
        }
      }
      return true;
    })
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value) return true; // Optional field
      // Accept E.164 format: +[country code][number] (e.g., +1234567890)
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(value)) {
        throw new Error('Phone number must be in E.164 format (e.g., +1234567890)');
      }
      return true;
    })
    .custom((value, { req }) => {
      // At least one of email or phone must be provided
      if (!value && !req.body.email) {
        throw new Error('Either email or phone number is required');
      }
      return true;
    }),
  body('name').optional().trim(),
  body('referralCode').optional().trim(),
];

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, phone, name, referralCode } = req.body;

    if(!email && !phone) {
      throw new AppError('Email or phone number is required',400);
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
      },
    });

    if (existingUser) {
      throw new AppError('User already exists with this email or phone', 400);
    }

    // Verify referral code if provided
    // If invalid, silently ignore it and continue with signup (no referral applied)
    let referredById: string | undefined;
    if (referralCode) {
      // Normalize referral code (uppercase, trim)
      const normalizedReferralCode = referralCode.trim().toUpperCase();
      const referrer = await prisma.user.findUnique({
        where: { referralCode: normalizedReferralCode },
      });
      if (referrer) {
        referredById = referrer.id;
      }
      // If referral code is invalid, we don't throw an error
      // User can still sign up, but referral won't be applied
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate unique referral code
    let userReferralCode: string;
    let isUnique = false;
    while (!isUnique) {
      userReferralCode = generateReferralCode();
      const existing = await prisma.user.findUnique({
        where: { referralCode: userReferralCode },
      });
      if (!existing) isUnique = true;
    }

    // Generate EVM deposit wallet
    const evmWallet = generateEvmWallet();
    const encryptedPrivateKey = encryptPrivateKey(evmWallet.privateKey);

    // Create user with isVerified = false
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name,
        passwordHash,
        referralCode: userReferralCode!,
        referredById,
        role: 'USER',
        status: 'ACTIVE',
        isVerified: false, // User needs to verify OTP first
        depositWalletAddress: evmWallet.address,
        depositWalletPrivateKey: encryptedPrivateKey,
        depositWalletCreatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        referralCode: true,
        role: true,
        status: true,
        kycStatus: true,
        isVerified: true,
        depositWalletAddress: true,
      },
    });

    // Update referrer's referral counts if user was referred
    if (referredById) {
      await prisma.user.update({
        where: { id: referredById },
        data: {
          totalReferralCount: { increment: 1 },
          freeReferralCount: { increment: 1 },
        },
      });
    }

    // Create wallets for the user
    const walletTypes = ['INR', 'USDT', 'ROI', 'SALARY', 'BREAKDOWN'];
    await Promise.all(
      walletTypes.map((type) =>
        prisma.wallet.create({
          data: {
            userId: user.id,
            type: type as any,
            balance: '0',
            currency: type === 'INR' ? 'INR' : 'USDT',
          },
        })
      )
    );

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

    // Send OTP based on registration method
    if (email) {
      // Send OTP via email
      await sendOTPEmail(email, otp, name);
      
      // Store OTP in database
      await prisma.otpVerification.create({
        data: {
          email,
          otp,
          type: 'EMAIL',
          expiresAt,
        },
      });
    }

    if (phone) {
      // TODO: Firebase phone OTP - Commented out for now, will be enabled in production
      // Send OTP via Firebase (phone)
      // await sendPhoneOTP(phone);
      
      // Store OTP in database
      // Note: For now, we're not sending actual SMS. Any OTP will be accepted for phone verification.
      // This will be changed when Firebase is enabled in production.
      await prisma.otpVerification.create({
        data: {
          phone,
          otp,
          type: 'PHONE',
          expiresAt,
        },
      });
      
      const maskedPhone = phone.length > 8 
        ? `${phone.substring(0, 4)}****${phone.slice(-4)}` 
        : `${phone.substring(0, 2)}****`;
      console.log(`[DEV MODE] Phone OTP generated (not sent): ${otp} for ${maskedPhone}`);
    }

    successResponse(
      res,
      { 
        user, 
        message: 'Registration successful. Please verify your OTP to complete registration.',
        requiresVerification: true 
      },
      'Registration successful. OTP sent to your email/phone',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const loginValidation = [
  body('email')
    .optional()
    .custom((value) => {
      // Only validate if email is provided and not empty
      if (value && typeof value === 'string' && value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          throw new Error('Invalid email format');
        }
      }
      return true;
    })
    .customSanitizer((value) => {
      // Normalize email if provided
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim().toLowerCase();
      }
      return value;
    }),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value) return true; // Optional field
      // Accept E.164 format: +[country code][number] (e.g., +1234567890)
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(value)) {
        throw new Error('Phone number must be in E.164 format (e.g., +1234567890)');
      }
      return true;
    })
    .custom((value, { req }) => {
      // At least one of email or phone must be provided
      if (!value && !req.body.email) {
        throw new Error('Either email or phone number is required');
      }
      return true;
    }),
  body('password').notEmpty().withMessage('Password is required'),
];

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, phone, password } = req.body;

    // Clean up email - remove empty strings
    const cleanEmail = email && email.trim() ? email.trim() : undefined;
    const cleanPhone = phone && phone.trim() ? phone.trim() : undefined;

    if (!cleanEmail && !cleanPhone) {
      throw new AppError('Email or phone is required', 400);
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (!user) {
      // Don't reveal whether email/phone exists - security best practice
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      // Don't reveal whether password is wrong - security best practice
      throw new AppError('Invalid credentials', 401);
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is not active. Please contact support.', 403);
    }

    // Check if user is verified
    if (!user.isVerified) {
      const verificationType = cleanEmail ? 'email' : 'phone';
      throw new AppError(`Please verify your ${verificationType} with OTP before logging in`, 403);
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Record login log
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                     req.headers['x-real-ip'] as string || 
                     req.socket.remoteAddress || 
                     'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    try {
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          ipAddress,
          userAgent,
          success: true,
        },
      });
    } catch (logError) {
      // Log error but don't fail the login
      console.error('Failed to record login log:', logError);
    }

    const { passwordHash, ...userWithoutPassword } = user;

    successResponse(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        role: true,
        status: true,
        kycStatus: true,
        isVerified: true,
        totalReferralCount: true,
        paidReferralCount: true,
        freeReferralCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    successResponse(res, user, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
      },
    });

    successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newHash },
    });

    successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// OTP Verification Validation
export const verifyOtpValidation = [
  body('email').optional().isEmail().normalizeEmail(),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value) return true; // Optional field
      // Accept E.164 format: +[country code][number] (e.g., +1234567890)
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(value)) {
        throw new Error('Phone number must be in E.164 format (e.g., +1234567890)');
      }
      return true;
    }),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
];

// Verify OTP
export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, phone, otp } = req.body;

    if (!email && !phone) {
      throw new AppError('Email or phone is required', 400);
    }

    // Find the OTP record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
        verified: false,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent OTP
      },
    });

    if (!otpRecord) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Verify OTP
    // TODO: Firebase phone OTP - For phone verification, accept any OTP in development
    // This will be changed when Firebase is enabled in production
    if (otpRecord.type === 'PHONE') {
      // For phone OTP, accept any 6-digit code in development (Firebase not enabled)
      // In production, this will verify against the actual OTP sent via Firebase
      if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        throw new AppError('Invalid OTP format', 400);
      }
      const maskedPhone = phone && phone.length > 8 
        ? `${phone.substring(0, 4)}****${phone.slice(-4)}` 
        : phone ? `${phone.substring(0, 2)}****` : 'phone';
      console.log(`[DEV MODE] Phone OTP verification bypassed for ${maskedPhone}`);
    } else {
      // For email OTP, verify against stored OTP
      if (otpRecord.otp !== otp) {
        throw new AppError('Invalid OTP', 400);
      }
    }

    // Mark OTP as verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Update user's isVerified status
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    // Generate token
    const token = generateToken(user.id, user.role);

    const { passwordHash, ...userWithoutPassword } = user;

    successResponse(
      res,
      { 
        user: { ...userWithoutPassword, isVerified: true }, 
        token 
      },
      'OTP verified successfully. Account activated.'
    );
  } catch (error) {
    next(error);
  }
};

// Resend OTP
export const resendOtpValidation = [
  body('email').optional().isEmail().normalizeEmail(),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value) return true; // Optional field
      // Accept E.164 format: +[country code][number] (e.g., +1234567890)
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(value)) {
        throw new Error('Phone number must be in E.164 format (e.g., +1234567890)');
      }
      return true;
    }),
];

export const resendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      throw new AppError('Email or phone is required', 400);
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete old OTPs
    await prisma.otpVerification.deleteMany({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
      },
    });

    // Send OTP
    if (email) {
      await sendOTPEmail(email, otp, user.name || undefined);
      await prisma.otpVerification.create({
        data: {
          email,
          otp,
          type: 'EMAIL',
          expiresAt,
        },
      });
    }

    if (phone) {
      // TODO: Firebase phone OTP - Commented out for now, will be enabled in production
      // await sendPhoneOTP(phone);
      
      // Store OTP in database
      // Note: For now, we're not sending actual SMS. Any OTP will be accepted for phone verification.
      await prisma.otpVerification.create({
        data: {
          phone,
          otp,
          type: 'PHONE',
          expiresAt,
        },
      });
      
      const maskedPhone = phone.length > 8 
        ? `${phone.substring(0, 4)}****${phone.slice(-4)}` 
        : `${phone.substring(0, 2)}****`;
      console.log(`[DEV MODE] Phone OTP regenerated (not sent): ${otp} for ${maskedPhone}`);
    }

    successResponse(res, null, 'OTP resent successfully');
  } catch (error) {
    next(error);
  }
};

// Forgot Password - Request OTP
export const forgotPasswordValidation = [
  body('email')
    .optional()
    .custom((value) => {
      if (value && typeof value === 'string' && value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          throw new Error('Invalid email format');
        }
      }
      return true;
    })
    .customSanitizer((value) => {
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim().toLowerCase();
      }
      return value;
    }),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(value)) {
        throw new Error('Phone number must be in E.164 format (e.g., +1234567890)');
      }
      return true;
    })
    .custom((value, { req }) => {
      if (!value && !req.body.email) {
        throw new Error('Either email or phone number is required');
      }
      return true;
    }),
];

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phone } = req.body;

    // Clean up email - remove empty strings
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : undefined;
    const cleanPhone = phone && phone.trim() ? phone.trim() : undefined;

    if (!cleanEmail && !cleanPhone) {
      throw new AppError('Email or phone number is required', 400);
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (!user) {
      throw new AppError('No account found with this email or phone number', 404);
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

    // Delete existing password reset OTPs for this user
    await prisma.otpVerification.deleteMany({
      where: {
        OR: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
        type: cleanEmail ? 'EMAIL' : 'PHONE',
        verified: false,
      },
    });

    // Send OTP based on method
    if (cleanEmail) {
      // Send OTP via email
      await sendOTPEmail(cleanEmail, otp, user.name || undefined);
      
      // Store OTP in database with purpose 'PASSWORD_RESET'
      await prisma.otpVerification.create({
        data: {
          email: cleanEmail,
          otp,
          type: 'EMAIL',
          expiresAt,
        },
      });
    }

    if (cleanPhone) {
      // TODO: Firebase phone OTP - Commented out for now, will be enabled in production
      // await sendPhoneOTP(cleanPhone);
      
      // Store OTP in database
      // Note: For now, we're not sending actual SMS. Any OTP will be accepted for phone verification.
      await prisma.otpVerification.create({
        data: {
          phone: cleanPhone,
          otp,
          type: 'PHONE',
          expiresAt,
        },
      });
      
      const maskedPhone = cleanPhone.length > 8 
        ? `${cleanPhone.substring(0, 4)}****${cleanPhone.slice(-4)}` 
        : `${cleanPhone.substring(0, 2)}****`;
      console.log(`[DEV MODE] Password reset OTP generated (not sent): ${otp} for ${maskedPhone}`);
    }

    successResponse(res, null, 'OTP has been sent successfully');
  } catch (error) {
    next(error);
  }
};

// Verify OTP for Password Reset
export const verifyPasswordResetOtpValidation = [
  body('email')
    .optional()
    .custom((value) => {
      if (value && typeof value === 'string' && value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          throw new Error('Invalid email format');
        }
      }
      return true;
    })
    .customSanitizer((value) => {
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim().toLowerCase();
      }
      return value;
    }),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(value)) {
        throw new Error('Phone number must be in E.164 format (e.g., +1234567890)');
      }
      return true;
    })
    .custom((value, { req }) => {
      if (!value && !req.body.email) {
        throw new Error('Either email or phone number is required');
      }
      return true;
    }),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
];

export const verifyPasswordResetOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phone, otp } = req.body;

    // Clean up email - remove empty strings
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : undefined;
    const cleanPhone = phone && phone.trim() ? phone.trim() : undefined;

    if (!cleanEmail && !cleanPhone) {
      throw new AppError('Email or phone number is required', 400);
    }

    // Find the most recent unverified OTP
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        OR: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
        verified: false,
        expiresAt: { gt: new Date() },
        type: cleanEmail ? 'EMAIL' : 'PHONE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      // Check if there's an expired OTP
      const expiredOtp = await prisma.otpVerification.findFirst({
        where: {
          OR: [
            ...(cleanEmail ? [{ email: cleanEmail }] : []),
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
          ],
          verified: false,
          type: cleanEmail ? 'EMAIL' : 'PHONE',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (expiredOtp && expiredOtp.expiresAt <= new Date()) {
        throw new AppError('OTP has expired. Please request a new OTP', 400);
      }
      throw new AppError('Invalid or expired OTP. Please request a new OTP', 400);
    }

    // Verify OTP
    // TODO: Firebase phone OTP - For phone verification, accept any OTP in development
    if (otpRecord.type === 'PHONE') {
      // For phone OTP, accept any 6-digit code in development (Firebase not enabled)
      if (!/^\d{6}$/.test(otp)) {
        throw new AppError('OTP must be 6 digits', 400);
      }
      // Accept any OTP for phone in development
      const maskedPhone = cleanPhone && cleanPhone.length > 8 
        ? `${cleanPhone.substring(0, 4)}****${cleanPhone.slice(-4)}` 
        : cleanPhone ? `${cleanPhone.substring(0, 2)}****` : 'phone';
      console.log(`[DEV MODE] Password reset OTP verification bypassed for ${maskedPhone}`);
    } else {
      // For email OTP, verify against stored OTP
      if (otpRecord.otp !== otp) {
        throw new AppError('Invalid OTP. Please check and try again', 400);
      }
    }

    // Mark OTP as verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Return success - frontend will use this to proceed to reset password
    successResponse(res, { verified: true }, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};

// Reset Password
export const resetPasswordValidation = [
  body('email')
    .optional()
    .custom((value) => {
      if (value && typeof value === 'string' && value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          throw new Error('Invalid email format');
        }
      }
      return true;
    })
    .customSanitizer((value) => {
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim().toLowerCase();
      }
      return value;
    }),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(value)) {
        throw new Error('Phone number must be in E.164 format (e.g., +1234567890)');
      }
      return true;
    })
    .custom((value, { req }) => {
      if (!value && !req.body.email) {
        throw new Error('Either email or phone number is required');
      }
      return true;
    }),
  body('otp')
    .optional()
    .custom((value) => {
      // OTP is optional since it's already verified, but if provided, must be 6 digits
      if (value && (!/^\d{6}$/.test(value))) {
        throw new Error('OTP must be 6 digits');
      }
      return true;
    }),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phone, otp, newPassword } = req.body;

    // Clean up email - remove empty strings
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : undefined;
    const cleanPhone = phone && phone.trim() ? phone.trim() : undefined;

    if (!cleanEmail && !cleanPhone) {
      throw new AppError('Email or phone number is required', 400);
    }

    // Find the verified OTP record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        OR: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
        verified: true,
        expiresAt: { gt: new Date() },
        type: cleanEmail ? 'EMAIL' : 'PHONE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new AppError('OTP not verified or expired. Please request a new OTP', 400);
    }

    // Verify OTP again if provided (for phone, accept any 6-digit in dev)
    // Note: OTP is optional since it's already verified, but we check it if provided
    if (otp) {
      if (otpRecord.type === 'PHONE') {
        if (!/^\d{6}$/.test(otp)) {
          throw new AppError('OTP must be 6 digits', 400);
        }
        // Accept any OTP for phone in development
      } else {
        if (otpRecord.otp !== otp) {
          throw new AppError('Invalid OTP', 400);
        }
      }
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Delete the used OTP
    await prisma.otpVerification.delete({
      where: { id: otpRecord.id },
    });

    successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};
