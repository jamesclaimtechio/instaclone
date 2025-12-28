/**
 * Temporary test script for email service
 * Run with: pnpm tsx lib/test-email.ts
 * DELETE after verification
 */

import { sendTestEmail, sendOTPEmail } from './email';

async function runTests() {
  console.log('📧 Testing Email Service Integration\n');

  // Get test email from command line or use default
  const testEmail = process.argv[2] || 'test@example.com';

  console.log(`Test email address: ${testEmail}\n`);

  // Test 1: Send test email with template
  console.log('Test 1: Sending test OTP email...');
  try {
    const result = await sendTestEmail(testEmail);
    
    if (result.success) {
      console.log('✅ PASS - Email sent successfully');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Check ${testEmail} inbox\n`);
    } else {
      console.log('❌ FAIL - Email send failed');
      console.log(`   Error: ${result.error}\n`);
    }
  } catch (error: any) {
    console.log('❌ FAIL - Exception thrown');
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 2: Send OTP email with real function
  console.log('Test 2: Sending OTP email with sendOTPEmail...');
  try {
    const success = await sendOTPEmail(testEmail, 'testuser', '987654');
    
    if (success) {
      console.log('✅ PASS - OTP email sent successfully');
      console.log(`   Check ${testEmail} for code: 987654\n`);
    } else {
      console.log('❌ FAIL - OTP email send failed\n');
    }
  } catch (error: any) {
    console.log('❌ FAIL - Exception thrown');
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 3: Test with invalid email
  console.log('Test 3: Testing error handling with invalid email...');
  try {
    const success = await sendOTPEmail('invalid-email', 'testuser', '111111');
    
    if (!success) {
      console.log('✅ PASS - Invalid email handled gracefully (returned false)');
      console.log('   Error was caught and handled\n');
    } else {
      console.log('⚠️  WARNING - Invalid email succeeded (check Resend validation)\n');
    }
  } catch (error: any) {
    console.log('✅ PASS - Invalid email threw error');
    console.log(`   Error type: ${error.name}\n`);
  }

  console.log('═'.repeat(60));
  console.log('\n✅ Email service testing complete!');
  console.log('\nNext steps:');
  console.log('1. Check your email inbox for the test emails');
  console.log('2. Verify HTML renders correctly');
  console.log('3. Check OTP code is prominent and readable');
  console.log('4. Test on mobile if possible\n');
}

runTests().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

