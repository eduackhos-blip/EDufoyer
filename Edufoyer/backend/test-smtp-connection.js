/**
 * Test SMTP Connection
 * Test if the SMTP settings are working correctly
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSMTPConnection() {
  console.log('🧪 Testing SMTP Connection...\n');

  console.log('📧 SMTP Configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log(`   Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'Not set'}`);

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('\n🔍 Testing SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Test sending email
    console.log('\n📤 Testing email sending...');
    const testEmail = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to yourself for testing
      subject: 'SMTP Test - EDUF OYER',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">SMTP Test Successful!</h2>
          <p>Your SMTP configuration is working correctly.</p>
          <p>Time: ${new Date().toLocaleString()}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">EDUF OYER - Learn together and Earn together</p>
        </div>
      `
    };

    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log('\n🎉 SMTP configuration is working perfectly!');

  } catch (error) {
    console.log('❌ SMTP connection failed!');
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication Error Solutions:');
      console.log('1. Enable 2-Factor Authentication on your Gmail account');
      console.log('2. Generate a new App Password:');
      console.log('   - Go to Google Account settings');
      console.log('   - Security → 2-Step Verification → App passwords');
      console.log('   - Generate a new app password for "Mail"');
      console.log('   - Use the 16-character password (no spaces)');
      console.log('3. Update your .env file with the new app password');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Connection Error Solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify SMTP_HOST and SMTP_PORT settings');
      console.log('3. Try using port 465 with secure: true');
    }
  }
}

testSMTPConnection().catch(console.error);
