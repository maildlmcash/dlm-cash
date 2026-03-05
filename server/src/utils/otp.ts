import * as admin from 'firebase-admin';
import { AppError } from '../middleware/errorHandler';

// Initialize Firebase Admin
let firebaseApp: admin.app.App | null = null;

// TODO: Firebase initialization - Commented out for now, will be enabled in production
export const initializeFirebase = () => {
  // Firebase initialization is disabled for now
  // Uncomment this code when ready to enable Firebase phone OTP in production
  
  /*
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      firebaseApp = admin.app();
      return firebaseApp;
    }

    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccount) {
      console.warn('FIREBASE_SERVICE_ACCOUNT not found. Firebase phone OTP will not work.');
      return null;
    }

    // Parse service account JSON
    let serviceAccountJson;
    try {
      serviceAccountJson = typeof serviceAccount === 'string' 
        ? JSON.parse(serviceAccount) 
        : serviceAccount;
    } catch (parseError) {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON format');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountJson as admin.ServiceAccount),
    });

    console.log('Firebase Admin initialized successfully');
    return firebaseApp;
  } catch (error: any) {
    console.error('Firebase initialization error:', error.message);
    // Don't throw error, just log it - app can still work without Firebase
    return null;
  }
  */
  
  console.log('[DEV MODE] Firebase initialization skipped - Phone OTP disabled');
  return null;
};

/**
 * Send OTP to phone number using Firebase
 * Note: Firebase Admin SDK doesn't directly send SMS OTPs.
 * For production, you may need to:
 * 1. Use Firebase Cloud Functions with a service like Twilio
 * 2. Use Firebase Auth on client-side and verify ID token on server
 * 3. Use a dedicated SMS service (Twilio, AWS SNS, etc.)
 * 
 * This function generates OTP and stores it. The actual SMS sending
 * should be handled by your SMS provider or Firebase Cloud Functions.
 */
// TODO: Firebase phone OTP - Commented out for now, will be enabled in production
export const sendPhoneOTP = async (phoneNumber: string): Promise<string> => {
  // Firebase phone OTP sending is disabled for now
  // Uncomment this code when ready to enable Firebase phone OTP in production
  
  /*
  try {
    // Initialize Firebase if not already done
    if (!firebaseApp) {
      initializeFirebase();
    }

    // Format phone number (ensure it starts with +)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Validate phone number format
    if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
      throw new AppError('Invalid phone number format. Must be in E.164 format (e.g., +1234567890)', 400);
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Note: Firebase Admin SDK doesn't send SMS directly
    // The OTP will be stored in the database by the authController
    // For actual SMS sending, you need to:
    // 1. Set up Firebase Cloud Functions to send SMS via Twilio/AWS SNS
    // 2. Or use Firebase Auth client-side and verify ID token server-side
    // 3. Or integrate with a dedicated SMS service
    
    // If you have Firebase Cloud Functions set up for SMS, you can call it here
    // For now, we return the OTP which will be stored in the database
    // The actual SMS sending should be handled by your SMS service
    
    console.log(`OTP generated for phone: ${formattedPhone.substring(0, 4)}****${formattedPhone.slice(-4)}`);
    
    return otp;
  } catch (error: any) {
    console.error('Error in sendPhoneOTP:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to process phone OTP request', 500);
  }
  */
  
  // For now, just generate and return OTP (not sent via Firebase)
  // This will be replaced with actual Firebase SMS sending in production
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[DEV MODE] Phone OTP generated (not sent via Firebase): ${otp} for ${formattedPhone.substring(0, 4)}****${formattedPhone.slice(-4)}`);
  return otp;
};

/**
 * Verify phone OTP
 * This function verifies the OTP against the stored value in the database.
 * For Firebase Auth verification, you would verify the ID token from the client.
 * 
 * Note: Actual OTP verification is handled in authController by checking against
 * the OtpVerification table. This function is kept for potential future use
 * with Firebase Auth ID token verification.
 */
export const verifyPhoneOTP = async (
  phoneNumber: string,
  otp: string
): Promise<boolean> => {
  try {
    // OTP verification is handled in the authController by checking against
    // the OtpVerification table in the database
    
    // If using Firebase Auth client-side verification:
    // 1. Client verifies OTP with Firebase Auth
    // 2. Client gets ID token
    // 3. Server verifies ID token using Firebase Admin SDK
    // Example:
    // const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    // const decodedToken = await admin.auth().verifyIdToken(idToken);
    // return decodedToken.phone_number === formattedPhone;
    
    // For now, return true as verification is done in authController
    // The parameters are kept for API compatibility
    void phoneNumber;
    void otp;
    
    return true;
  } catch (error: any) {
    console.error('Error verifying phone OTP:', error);
    throw new AppError('Failed to verify OTP', 500);
  }
};

/**
 * Verify Firebase ID token (for client-side Firebase Auth flow)
 * Use this when client verifies OTP with Firebase Auth and sends ID token
 */
export const verifyFirebaseIdToken = async (idToken: string): Promise<admin.auth.DecodedIdToken> => {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    if (!firebaseApp) {
      throw new AppError('Firebase not initialized', 500);
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    console.error('Error verifying Firebase ID token:', error);
    throw new AppError('Invalid or expired Firebase token', 401);
  }
};

