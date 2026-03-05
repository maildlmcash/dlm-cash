export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  app: {
    name: process.env.APP_NAME || 'DLM Crypto Platform',
    url: process.env.APP_URL || 'http://localhost:3000',
  },
  referral: {
    codeLength: parseInt(process.env.REFERRAL_CODE_LENGTH || '8'),
    maxLevels: parseInt(process.env.MAX_REFERRAL_LEVELS || '2'),
  },
  smtp: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    useTLS: process.env.EMAIL_USE_TLS === 'True' || process.env.EMAIL_USE_TLS === 'true',
    user: process.env.EMAIL_HOST_USER || process.env.SMTP_EMAIL,
    password: process.env.EMAIL_HOST_PASSWORD || process.env.SMTP_PASSWORD,
    fromEmail: process.env.DEFAULT_FROM_EMAIL || process.env.EMAIL_HOST_USER || process.env.SMTP_EMAIL,
  },
  firebase: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10'),
  },
};
