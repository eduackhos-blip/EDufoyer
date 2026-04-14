/**
 * Strict Email Validation Test
 * Test the email validation with known providers only
 */

import { validateEmail, normalizeEmail } from './utils/emailValidator.js';
import { checkEmailWhitelist } from './utils/emailWhitelist.js';
import { verifyEmail } from './utils/emailVerification.js';

async function testStrictEmailValidation() {
  console.log('🧪 Testing Strict Email Validation...\n');

  const testEmails = [
    'shubham18031975@gmail.com',  // Real user email
    'test@gmail.com',             // Fake but valid domain
    'user@yahoo.com',             // Real domain
    'admin@outlook.com',          // Real domain
    'fake@nonexistentdomain.com', // Fake domain
    'invalid@10minutemail.com',   // Temporary service
    'user@company.com',           // Unknown domain
    'test@university.edu'         // Unknown domain
  ];

  console.log('Testing strict email validation:');
  for (const email of testEmails) {
    console.log(`\n📧 Testing: ${email}`);
    
    // Step 1: Basic format validation
    const emailValidation = validateEmail(email);
    console.log(`   Format valid: ${emailValidation.isValid ? '✅' : '❌'} - ${emailValidation.message}`);
    
    if (!emailValidation.isValid) {
      console.log(`   Result: ❌ BLOCKED (Invalid format)`);
      continue;
    }
    
    // Step 2: Whitelist check
    const whitelistCheck = checkEmailWhitelist(email);
    console.log(`   Whitelist approved: ${whitelistCheck.isApproved ? '✅' : '❌'} - ${whitelistCheck.message}`);
    
    if (!whitelistCheck.isApproved) {
      console.log(`   Result: ❌ BLOCKED (Not in whitelist)`);
      continue;
    }
    
    // Step 3: Email verification (known providers + DNS check)
    try {
      const emailVerification = await verifyEmail(email);
      console.log(`   Email verification: ${emailVerification.isValid ? '✅' : '❌'} - ${emailVerification.message}`);
      
      if (emailVerification.isValid) {
        console.log(`   Result: ✅ ALLOWED`);
      } else {
        console.log(`   Result: ❌ BLOCKED (Email verification failed)`);
      }
    } catch (error) {
      console.log(`   Result: ❌ BLOCKED (Verification error: ${error.message})`);
    }
  }

  console.log('\n🎯 Strict Email Validation Test Complete!');
  console.log('\n📝 Expected Results:');
  console.log('   ✅ shubham18031975@gmail.com - Real user email');
  console.log('   ❌ test@gmail.com - Fake email (doesn\'t exist)');
  console.log('   ❌ user@yahoo.com - Unknown if real');
  console.log('   ❌ admin@outlook.com - Unknown if real');
  console.log('   ❌ fake@nonexistentdomain.com - Fake domain');
  console.log('   ❌ invalid@10minutemail.com - Temporary service');
  console.log('   ❌ user@company.com - Unknown domain');
  console.log('   ❌ test@university.edu - Unknown domain');
}

testStrictEmailValidation().catch(console.error);
