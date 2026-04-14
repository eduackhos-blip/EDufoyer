/**
 * Email Verification System
 * Verifies that email addresses actually exist before allowing signup
 */

import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const resolveMx = promisify(dns.resolveMx);

/**
 * Check if email domain is from a known legitimate provider
 * @param {string} email - Email address to verify
 * @returns {boolean} - True if domain is from known provider
 */
export const isKnownEmailProvider = (email) => {
  // ONLY allow KIIT domains
  const knownProviders = [
    'kiit.ac.in',
    'kiit.edu.in'
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return knownProviders.includes(domain);
};

/**
 * Verify if email domain exists and has valid MX records
 * @param {string} email - Email address to verify
 * @returns {Promise<object>} - Verification result
 */
export const verifyEmailDomain = async (email) => {
  try {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        message: 'Email is required'
      };
    }

    const domain = email.split('@')[1];
    if (!domain) {
      return {
        isValid: false,
        message: 'Invalid email format'
      };
    }

    // If it's a known provider, skip DNS lookup
    if (isKnownEmailProvider(email)) {
      return {
        isValid: true,
        message: 'Email domain is from known provider',
        isKnownProvider: true
      };
    }

    // For other domains, try DNS lookup with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DNS lookup timeout')), 5000)
    );

    const mxPromise = resolveMx(domain);
    const mxRecords = await Promise.race([mxPromise, timeoutPromise]);
    
    if (mxRecords && mxRecords.length > 0) {
      return {
        isValid: true,
        message: 'Email domain is valid',
        mxRecords: mxRecords
      };
    } else {
      return {
        isValid: false,
        message: 'Email domain does not exist or cannot receive emails'
      };
    }
  } catch (error) {
    console.error('DNS lookup error:', error);
    
    // If DNS lookup fails but it's a known provider, still allow it
    if (isKnownEmailProvider(email)) {
      return {
        isValid: true,
        message: 'Email domain is from known provider (DNS lookup failed)',
        isKnownProvider: true
      };
    }
    
    return {
      isValid: false,
      message: 'Email domain verification failed'
    };
  }
};

/**
 * Send verification email to user
 * @param {string} email - Email address to send verification to
 * @param {string} verificationCode - Verification code
 * @returns {Promise<object>} - Send result
 */
export const sendVerificationEmail = async (email, verificationCode) => {
  try {
    // Create transporter (you can configure this with your SMTP settings)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Email Verification - EDUF OYER',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Verification</h2>
          <p>Thank you for signing up with EDUF OYER!</p>
          <p>Please use the following verification code to complete your registration:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1f2937; margin: 0; font-size: 32px; letter-spacing: 4px;">${verificationCode}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">EDUF OYER - Learn together and Earn together</p>
        </div>
      `,
      // Add headers to help with bounce detection
      headers: {
        'Return-Path': process.env.SMTP_USER || 'your-email@gmail.com',
        'X-Mailer': 'EDUF OYER Verification System'
      }
    };

    const result = await transporter.sendMail(mailOptions);
    
    // For now, we'll assume if the email was accepted by SMTP, it's valid
    // In a production system, you'd want to implement bounce handling
    return {
      success: true,
      message: 'Verification email sent successfully',
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Check for specific error types that indicate invalid email
    if (error.code === 'EENVELOPE' || error.responseCode === 550) {
      return {
        success: false,
        message: 'Email address does not exist or cannot receive emails'
      };
    }
    
    return {
      success: false,
      message: 'Failed to send verification email',
      error: error.message
    };
  }
};

/**
 * Generate verification code
 * @returns {string} - 6-digit verification code
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Check if email is from a known fake email service
 * @param {string} email - Email to check
 * @returns {boolean} - True if email is from fake service
 */
export const isFakeEmailService = (email) => {
  const fakeServices = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org',
    'getnada.com',
    'maildrop.cc',
    'yopmail.com',
    'sharklasers.com'
  ];

  const domain = email.split('@')[1];
  return fakeServices.includes(domain?.toLowerCase());
};

/**
 * Comprehensive email verification
 * @param {string} email - Email to verify
 * @returns {Promise<object>} - Verification result
 */
export const verifyEmail = async (email) => {
  try {
    // Check for fake email services
    if (isFakeEmailService(email)) {
      return {
        isValid: false,
        message: 'Temporary email services are not allowed'
      };
    }

    // Only allow KIIT email domains
    if (!isKnownEmailProvider(email)) {
      return {
        isValid: false,
        message: 'Only @kiit.ac.in email addresses are allowed for registration.'
      };
    }

    // Verify domain exists
    const domainCheck = await verifyEmailDomain(email);
    if (!domainCheck.isValid) {
      return domainCheck;
    }

    return {
      isValid: true,
      message: 'Email is valid and can receive emails'
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      isValid: false,
      message: 'Email verification failed'
    };
  }
};
