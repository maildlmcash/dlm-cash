import { Router } from 'express';
import {
  register,
  registerValidation,
  validateReferral,
  startRegistration,
  verifyRegistrationOtp,
  login,
  loginValidation,
  getProfile,
  updateProfile,
  changePassword,
  changePasswordValidation,
  verifyOTP,
  verifyOtpValidation,
  resendOTP,
  resendOtpValidation,
  forgotPassword,
  forgotPasswordValidation,
  verifyPasswordResetOTP,
  verifyPasswordResetOtpValidation,
  resetPassword,
  resetPasswordValidation,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

router.post('/register',  validate(registerValidation), register);
router.post('/register/start', startRegistration);
router.post('/register/verify-otp', verifyRegistrationOtp);
router.post('/validate-referral', validateReferral);
router.post('/login', validate(loginValidation), login);
router.post('/verify-otp',  validate(verifyOtpValidation), verifyOTP);
router.post('/resend-otp',  validate(resendOtpValidation), resendOTP);
router.post('/forgot-password', validate(forgotPasswordValidation), forgotPassword);
router.post('/verify-password-reset-otp', validate(verifyPasswordResetOtpValidation), verifyPasswordResetOTP);
router.post('/reset-password', validate(resetPasswordValidation), resetPassword);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, validate(changePasswordValidation), changePassword);

export default router;
