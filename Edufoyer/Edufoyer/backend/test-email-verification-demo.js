/**
 * Email Verification Demo
 * Shows how the system will work with real email verification
 */

import { verifyEmail, sendVerificationEmail, generateVerificationCode } from './utils/emailVerification.js';

async function demoEmailVerification() {
  console.log('🧪 Email Verification Demo...\n');

  const testEmails = [
    'shubham18031975@gmail.com',  // Real user email
    'test@gmail.com',             // Fake email
    'user@yahoo.com',             // Unknown if real
    'fake@nonexistentdomain.com'  // Fake domain
  ];

  console.log('📧 Testing Email Verification Process:\n');

  for (const email of testEmails) {
    console.log(`Testing: ${email}`);
    
    // Step 1: Check if email is from known provider
    const verification = await verifyEmail(email);
    console.log(`   Provider check: ${verification.isValid ? '✅' : '❌'} - ${verification.message}`);
    
    if (verification.isValid) {
      // Step 2: Generate verification code
      const code = generateVerificationCode();
      console.log(`   Verification code: ${code}`);
      
      // Step 3: Try to send verification email
      console.log(`   Attempting to send verification email...`);
      
      try {
        const emailResult = await sendVerificationEmail(email, code);
        if (emailResult.success) {
          console.log(`   ✅ Email sent successfully! User can verify.`);
          console.log(`   Result: ✅ ALLOWED (Email exists and can receive emails)`);
        } else {
          console.log(`   ❌ Failed to send email: ${emailResult.message}`);
          console.log(`   Result: ❌ BLOCKED (Email doesn't exist or can't receive emails)`);
        }
      } catch (error) {
        console.log(`   ❌ Email sending error: ${error.message}`);
        console.log(`   Result: ❌ BLOCKED (Email verification failed)`);
      }
    } else {
      console.log(`   Result: ❌ BLOCKED (Not from known provider)`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎯 Email Verification Demo Complete!');
  console.log('\n📝 How it works:');
  console.log('1. ✅ Only known email providers (Gmail, Yahoo, Outlook) are allowed');
  console.log('2. ✅ System tries to send verification email to the address');
  console.log('3. ✅ If email is sent successfully, user can verify and register');
  console.log('4. ❌ If email fails to send, registration is blocked');
  console.log('5. ❌ Only verified users can login');
}

demoEmailVerification().catch(console.error);
