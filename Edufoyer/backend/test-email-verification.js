/**
 * Test Email Verification System
 * This script tests the email verification functionality
 */

import { verifyEmail, generateVerificationCode } from './utils/emailVerification.js';

async function testEmailVerification() {
  console.log('🧪 Testing Email Verification System...\n');

  // Test 1: Generate verification code
  console.log('1. Testing verification code generation:');
  const code = generateVerificationCode();
  console.log(`   Generated code: ${code}`);
  console.log(`   Code length: ${code.length}`);
  console.log(`   Is 6 digits: ${/^\d{6}$/.test(code)}\n`);

  // Test 2: Test real email domains
  const testEmails = [
    'test@gmail.com',
    'user@yahoo.com',
    'admin@outlook.com',
    'fake@nonexistentdomain12345.com',
    'invalid@10minutemail.com'
  ];

  console.log('2. Testing email domain verification:');
  for (const email of testEmails) {
    try {
      const result = await verifyEmail(email);
      console.log(`   ${email}: ${result.isValid ? '✅ Valid' : '❌ Invalid'} - ${result.message}`);
    } catch (error) {
      console.log(`   ${email}: ❌ Error - ${error.message}`);
    }
  }

  console.log('\n🎯 Email Verification System Test Complete!');
  console.log('\n📝 Notes:');
  console.log('   - Real email domains (gmail.com, yahoo.com) should be valid');
  console.log('   - Fake domains should be invalid');
  console.log('   - Temporary email services should be blocked');
  console.log('   - DNS lookup may take a few seconds for each domain');
}

// Run the test
testEmailVerification().catch(console.error);
