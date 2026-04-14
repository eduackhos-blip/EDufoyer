/**
 * Simple Email Validation Test
 * Test the email validation without DNS lookup
 */

import { validateEmail, normalizeEmail } from './utils/emailValidator.js';
import { checkEmailWhitelist } from './utils/emailWhitelist.js';

function testEmailValidation() {
  console.log('🧪 Testing Email Validation...\n');

  const testEmails = [
    'shubham18031975@gmail.com',
    'test@gmail.com',
    'user@yahoo.com',
    'admin@outlook.com',
    'invalid@10minutemail.com',
    'fake@nonexistentdomain.com'
  ];

  console.log('Testing email validation:');
  for (const email of testEmails) {
    const emailValidation = validateEmail(email);
    const whitelistCheck = checkEmailWhitelist(email);
    
    console.log(`\n📧 ${email}:`);
    console.log(`   Format valid: ${emailValidation.isValid ? '✅' : '❌'} - ${emailValidation.message}`);
    console.log(`   Whitelist approved: ${whitelistCheck.isApproved ? '✅' : '❌'} - ${whitelistCheck.message}`);
    console.log(`   Normalized: ${normalizeEmail(email)}`);
    console.log(`   Overall result: ${emailValidation.isValid && whitelistCheck.isApproved ? '✅ ALLOWED' : '❌ BLOCKED'}`);
  }

  console.log('\n🎯 Email Validation Test Complete!');
}

testEmailValidation();
