/**
 * Test KIIT Email Validation
 * Test if kiit.ac.in emails are properly validated
 */

import { validateEmail, normalizeEmail } from './utils/emailValidator.js';
import { checkEmailWhitelist } from './utils/emailWhitelist.js';
import { verifyEmail } from './utils/emailVerification.js';

async function testKIITEmails() {
  console.log('🧪 Testing KIIT Email Validation...\n');

  const testEmails = [
    'student@kiit.ac.in',
    'faculty@kiit.ac.in',
    'admin@kiit.ac.in',
    'test@kiit.ac.in',
    'user@kiit.edu.in',
    'student@gmail.com',
    'fake@nonexistentdomain.com'
  ];

  console.log('Testing KIIT email validation:');
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

  console.log('\n🎯 KIIT Email Validation Test Complete!');
  console.log('\n📝 Expected Results:');
  console.log('   ✅ student@kiit.ac.in - KIIT student email');
  console.log('   ✅ faculty@kiit.ac.in - KIIT faculty email');
  console.log('   ✅ admin@kiit.ac.in - KIIT admin email');
  console.log('   ✅ test@kiit.ac.in - KIIT test email');
  console.log('   ✅ user@kiit.edu.in - KIIT alternative domain');
  console.log('   ✅ student@gmail.com - Gmail email');
  console.log('   ❌ fake@nonexistentdomain.com - Fake domain');
}

testKIITEmails().catch(console.error);
