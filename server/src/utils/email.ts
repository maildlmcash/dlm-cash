import nodemailer from 'nodemailer';
import { AppError } from '../middleware/errorHandler';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

export const initializeEmailService = () => {
  if (transporter) {
    return transporter;
  }

  try {
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587');
    const emailUser = process.env.EMAIL_HOST_USER || process.env.SMTP_EMAIL;
    const emailPassword = process.env.EMAIL_HOST_PASSWORD || process.env.SMTP_PASSWORD;
    const emailUseTLS = process.env.EMAIL_USE_TLS === 'True' || process.env.EMAIL_USE_TLS === 'true' || emailPort === 587;

    if (!emailUser || !emailPassword) {
      throw new Error('EMAIL_HOST_USER and EMAIL_HOST_PASSWORD (or SMTP_EMAIL and SMTP_PASSWORD) are required');
    }

    transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      tls: emailUseTLS ? {
        rejectUnauthorized: false,
      } : undefined,
    });

    // Verify connection (non-blocking)
    transporter.verify((error) => {
      if (error) {
        console.error('❌ Email service verification failed:', error.message);
        // Check if error has code property (nodemailer errors have this)
        const errorWithCode = error as any;
        if (errorWithCode.code === 'EAUTH') {
          console.error('⚠️  Gmail Authentication Error:');
          console.error('   1. Make sure you are using an App Password, not your regular Gmail password');
          console.error('   2. Go to: https://myaccount.google.com/apppasswords');
          console.error('   3. Generate an App Password for "Mail"');
          console.error('   4. Use that App Password in EMAIL_HOST_PASSWORD');
          console.error('   5. Make sure 2-Step Verification is enabled on your Google account');
        }
        // Don't throw error - allow server to start, email will fail when trying to send
      } else {
        console.log('✅ Email service is ready to send emails');
      }
    });

    return transporter;
  } catch (error) {
    console.error('Email service initialization error:', error);
    throw new AppError('Email service initialization failed', 500);
  }
};

/**
 * Send OTP email
 */
export const sendOTPEmail = async (
  email: string,
  otp: string,
  name?: string
): Promise<void> => {
  try {
    const emailUser = process.env.EMAIL_HOST_USER || process.env.SMTP_EMAIL;
    const emailPassword = process.env.EMAIL_HOST_PASSWORD || process.env.SMTP_PASSWORD;
    const isDevelopment = process.env.NODE_ENV === 'development';

    // In development mode, if SMTP is not configured, log OTP instead of throwing error
    if (!emailUser || !emailPassword) {
      if (isDevelopment) {
        console.log('\n========================================');
        console.log('📧 EMAIL OTP (Development Mode)');
        console.log('========================================');
        console.log(`To: ${email}`);
        console.log(`OTP: ${otp}`);
        console.log(`Name: ${name || 'N/A'}`);
        console.log('========================================\n');
        return; // Successfully return without sending email
      } else {
        throw new AppError('Email credentials not configured', 500);
      }
    }

    if (!transporter) {
      initializeEmailService();
    }

    if (!transporter) {
      if (isDevelopment) {
        console.log('\n========================================');
        console.log('📧 EMAIL OTP (Development Mode - Transporter Failed)');
        console.log('========================================');
        console.log(`To: ${email}`);
        console.log(`OTP: ${otp}`);
        console.log(`Name: ${name || 'N/A'}`);
        console.log('========================================\n');
        return; // Successfully return without sending email
      } else {
        throw new AppError('Email service not initialized. Please check your SMTP configuration.', 500);
      }
    }

    const defaultFromEmail = process.env.DEFAULT_FROM_EMAIL || emailUser;

    const mailOptions = {
      from: `"DLM CASH" <${defaultFromEmail}>`,
      to: email,
      subject: 'Verify Your Email - DLM CASH',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f5a623 0%, #f5a623 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #000; margin: 0;">DLM CASH</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            ${name ? `<p>Hello ${name},</p>` : '<p>Hello,</p>'}
            <p>Thank you for registering with DLM CASH. Please use the following OTP to verify your email address:</p>
            <div style="background: #fff; border: 2px dashed #f5a623; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #f5a623; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes. Please do not share this code with anyone.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this verification, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} DLM CASH. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Email Verification - DLM CASH
        
        ${name ? `Hello ${name},` : 'Hello,'}
        
        Thank you for registering with DLM CASH. Please use the following OTP to verify your email address:
        
        OTP: ${otp}
        
        This OTP will expire in 10 minutes. Please do not share this code with anyone.
        
        If you didn't request this verification, please ignore this email.
        
        © ${new Date().getFullYear()} DLM CASH. All rights reserved.
      `,
    };

    // Send email and get response
    const info = await transporter!.sendMail(mailOptions);
    
    // Check if email was rejected by SMTP server
    if (info.rejected && info.rejected.length > 0) {
      throw new AppError(`Email rejected by server: ${info.rejected.join(', ')}`, 400);
    }

    // Check for specific error responses
    if (info.response && info.response.includes('550')) {
      throw new AppError('Email address does not exist or cannot receive mail', 400);
    }

    console.log(`✅ OTP email sent to ${email} (Message ID: ${info.messageId})`);
  } catch (error: any) {
    console.error('❌ Error sending OTP email:', error?.message || error);
    
    // Parse nodemailer errors for better messages
    if (error?.code === 'EENVELOPE') {
      throw new AppError('Invalid email address', 400);
    }
    if (error?.responseCode === 550) {
      throw new AppError('Email address does not exist or mailbox is unavailable', 400);
    }
    if (error?.responseCode === 553) {
      throw new AppError('Email address is invalid or mailbox name not allowed', 400);
    }
    
    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }
    
    // Provide helpful error messages
    const errorCode = error?.code;
    if (errorCode === 'EAUTH') {
      console.error('⚠️  Gmail Authentication Failed:');
      console.error('   - Make sure you are using an App Password (not regular password)');
      console.error('   - Generate App Password: https://myaccount.google.com/apppasswords');
      console.error('   - Enable 2-Step Verification if not already enabled');
      throw new AppError('Email authentication failed. Please check your SMTP credentials and use an App Password.', 500);
    }
    
    if (errorCode === 'ECONNECTION' || errorCode === 'ETIMEDOUT') {
      throw new AppError('Failed to connect to email server. Please check your network and SMTP settings.', 500);
    }
    
    throw new AppError(`Failed to send OTP email: ${error?.message || 'Unknown error'}`, 500);
  }
};

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send Authentication Key email to user
 */
export const sendAuthKeyEmail = async (
  email: string,
  authKeyCode: string,
  planName: string,
  userName?: string
): Promise<void> => {
  try {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400);
    }

    const emailUser = process.env.EMAIL_HOST_USER || process.env.SMTP_EMAIL;
    const emailPassword = process.env.EMAIL_HOST_PASSWORD || process.env.SMTP_PASSWORD;
    const isDevelopment = process.env.NODE_ENV === 'development';

    // In development mode, if SMTP is not configured, log Auth Key instead of throwing error
    if (!emailUser || !emailPassword) {
      if (isDevelopment) {
        console.log('\n========================================');
        console.log('🔑 AUTHENTICATION KEY EMAIL (Development Mode)');
        console.log('========================================');
        console.log(`To: ${email}`);
        console.log(`Auth Key: ${authKeyCode}`);
        console.log(`Plan: ${planName}`);
        console.log(`User: ${userName || 'N/A'}`);
        console.log('========================================\n');
        return; // Successfully return without sending email
      } else {
        throw new AppError('Email credentials not configured', 500);
      }
    }

    if (!transporter) {
      initializeEmailService();
    }

    if (!transporter) {
      if (isDevelopment) {
        console.log('\n========================================');
        console.log('🔑 AUTHENTICATION KEY EMAIL (Development Mode - Transporter Failed)');
        console.log('========================================');
        console.log(`To: ${email}`);
        console.log(`Auth Key: ${authKeyCode}`);
        console.log(`Plan: ${planName}`);
        console.log(`User: ${userName || 'N/A'}`);
        console.log('========================================\n');
        return; // Successfully return without sending email
      } else {
        throw new AppError('Email service not initialized. Please check your SMTP configuration.', 500);
      }
    }

    const defaultFromEmail = process.env.DEFAULT_FROM_EMAIL || emailUser;

    const mailOptions = {
      from: `"DLM CASH" <${defaultFromEmail}>`,
      to: email,
      subject: 'Your Authentication Key - DLM CASH',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Authentication Key</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #fff; margin: 0;">🔑 DLM CASH</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Your Authentication Key</h2>
            ${userName ? `<p>Hello ${userName},</p>` : '<p>Hello,</p>'}
            <p>An Authentication Key has been assigned to you for the <strong>${planName}</strong> investment plan.</p>
            <p>You can use this key to purchase your investment plan:</p>
            <div style="background: #fff; border: 3px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">Authentication Key</p>
              <h1 style="color: #667eea; font-size: 28px; letter-spacing: 3px; margin: 0; font-family: 'Courier New', monospace;">${authKeyCode}</h1>
            </div>
            <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px;"><strong>📌 How to use:</strong></p>
              <ol style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
                <li>Log in to your DLM CASH account</li>
                <li>Navigate to the Investment section</li>
                <li>Select the "${planName}" plan</li>
                <li>Choose "Authentication Key" as payment method</li>
                <li>Enter the key code above</li>
              </ol>
            </div>
            <p style="color: #d32f2f; font-size: 14px; background: #ffebee; padding: 10px; border-radius: 4px; border-left: 4px solid #d32f2f;">
              ⚠️ <strong>Important:</strong> This Authentication Key can only be used once. Please keep it secure and do not share it with anyone.
            </p>
            <p style="color: #666; font-size: 14px;">If you have any questions or didn't expect this key, please contact our support team immediately.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">© ${new Date().getFullYear()} DLM CASH. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Your Authentication Key - DLM CASH
        
        ${userName ? `Hello ${userName},` : 'Hello,'}
        
        An Authentication Key has been assigned to you for the ${planName} investment plan.
        
        Authentication Key: ${authKeyCode}
        
        How to use:
        1. Log in to your DLM CASH account
        2. Navigate to the Investment section
        3. Select the "${planName}" plan
        4. Choose "Authentication Key" as payment method
        5. Enter the key code above
        
        IMPORTANT: This Authentication Key can only be used once. Please keep it secure and do not share it with anyone.
        
        If you have any questions or didn't expect this key, please contact our support team immediately.
        
        © ${new Date().getFullYear()} DLM CASH. All rights reserved.
      `,
    };

    // Send email and get response
    const info = await transporter!.sendMail(mailOptions);
    
    // Check if email was rejected by SMTP server
    if (info.rejected && info.rejected.length > 0) {
      throw new AppError(`Email rejected by server: ${info.rejected.join(', ')}`, 400);
    }

    // Check for specific error responses
    if (info.response && info.response.includes('550')) {
      throw new AppError('Email address does not exist or cannot receive mail', 400);
    }

    console.log(`✅ Authentication Key email sent to ${email} (Message ID: ${info.messageId})`);
  } catch (error: any) {
    console.error('❌ Error sending Authentication Key email:', error?.message || error);
    
    // Parse nodemailer errors for better messages
    if (error?.code === 'EENVELOPE') {
      throw new AppError('Invalid email address', 400);
    }
    if (error?.responseCode === 550) {
      throw new AppError('Email address does not exist or mailbox is unavailable', 400);
    }
    if (error?.responseCode === 553) {
      throw new AppError('Email address is invalid or mailbox name not allowed', 400);
    }
    
    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(`Failed to send Authentication Key email: ${error?.message || 'Unknown error'}`, 500);
  }
};
