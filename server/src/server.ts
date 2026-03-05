import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
// import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import routes from './routes';
import { initSchedulers } from './schedulers';
// import { initializeFirebase } from './utils/otp';
import { initializeEmailService } from './utils/email';
import path from 'path';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://*.walletconnect.com",
        "https://*.walletconnect.org",
        "https://*.web3modal.com",
        "https://*.web3modal.org",
        "wss://*.walletconnect.com",
        "wss://*.walletconnect.org",
        "https://rpc.sepolia.org",
        "https://*.infura.io",
        "https://*.alchemy.com",
        "*" // Allow all connects for ease of use with web3, or refine later
      ],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["'self'", "https://*.walletconnect.com", "https://*.walletconnect.org"],
    },
  },
  crossOriginOpenerPolicy: false, // Disabled for Base SDK Wallet functionality
}));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(compression());
// app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files with CORS headers
app.use('/uploads', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

app.use('/api/uploads', (_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// Handle 404 for API routes specifically
app.use('/api', notFoundHandler);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // In development, handle 404 for all other non-API routes natively
  app.use(notFoundHandler);
}

// Global Error handler
app.use(errorHandler);

// Initialize services
// TODO: Firebase initialization - Commented out for now, will be enabled in production
/*
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const firebaseApp = initializeFirebase();
    if (firebaseApp) {
      console.log('✅ Firebase initialized');
    } else {
      console.log('⚠️  Firebase initialization returned null');
    }
  } else {
    console.log('⚠️  Firebase not configured (FIREBASE_SERVICE_ACCOUNT missing)');
  }
} catch (error: any) {
  console.error('❌ Firebase initialization failed:', error.message);
}
*/
console.log('ℹ️  Firebase phone OTP disabled - Phone verification accepts any 6-digit code in development');

try {
  const emailUser = process.env.EMAIL_HOST_USER || process.env.SMTP_EMAIL;
  const emailPassword = process.env.EMAIL_HOST_PASSWORD || process.env.SMTP_PASSWORD;

  if (emailUser && emailPassword) {
    // Initialize email service (verification is non-blocking)
    initializeEmailService();
    console.log('ℹ️  Email service initialization started (checking credentials...)');
    console.log('   Note: If you see authentication errors, use Gmail App Password');
    console.log('   Generate at: https://myaccount.google.com/apppasswords');
  } else {
    console.log('⚠️  Email service not configured (EMAIL_HOST_USER/EMAIL_HOST_PASSWORD or SMTP_EMAIL/SMTP_PASSWORD missing)');
    console.log('   Email OTP will not work until SMTP credentials are configured');
  }
} catch (error: any) {
  console.error('❌ Email service initialization failed:', error.message);
  console.error('   Server will continue, but email sending will fail');
}

// Initialize schedulers
initSchedulers();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

export default app;
