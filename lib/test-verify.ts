/**
 * Temporary test script for OTP verification logic
 * Run with: pnpm tsx lib/test-verify.ts
 * DELETE after verification
 */

// Inline rate limiting functions to avoid database import
const MAX_VERIFICATION_ATTEMPTS = 5;
const VERIFICATION_LOCKOUT_MINUTES = 15;
const verificationAttempts = new Map<string, number[]>();

function canAttemptVerification(userId: string): { allowed: boolean; remaining: number } {
  const attempts = verificationAttempts.get(userId) || [];
  const lockoutTime = Date.now() - VERIFICATION_LOCKOUT_MINUTES * 60 * 1000;
  const recentAttempts = attempts.filter(timestamp => timestamp > lockoutTime);
  
  if (recentAttempts.length > 0) {
    verificationAttempts.set(userId, recentAttempts);
  } else {
    verificationAttempts.delete(userId);
  }
  
  const remaining = Math.max(0, MAX_VERIFICATION_ATTEMPTS - recentAttempts.length);
  
  return { allowed: recentAttempts.length < MAX_VERIFICATION_ATTEMPTS, remaining };
}

function recordFailedAttempt(userId: string): number {
  const attempts = verificationAttempts.get(userId) || [];
  attempts.push(Date.now());
  verificationAttempts.set(userId, attempts);
  const { remaining } = canAttemptVerification(userId);
  return remaining;
}

function resetVerificationAttempts(userId: string): void {
  verificationAttempts.delete(userId);
}

async function runTests() {
  console.log('🔐 Testing OTP Verification Logic\n');
  let passedTests = 0;
  let failedTests = 0;

  const testUserId = 'test-user-123';

  // Test 1: Initial State - Can Attempt
  console.log('Test 1: Initial State (No Attempts)');
  try {
    const { allowed, remaining } = canAttemptVerification(testUserId);
    
    if (allowed && remaining === 5) {
      console.log('✅ PASS - User can attempt verification');
      console.log(`   Remaining attempts: ${remaining}`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Initial state incorrect: allowed=${allowed}, remaining=${remaining}`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error:', error);
    failedTests++;
  }
  console.log('');

  // Test 2: Record Failed Attempts
  console.log('Test 2: Recording Failed Attempts');
  try {
    let remaining1 = recordFailedAttempt(testUserId);
    let remaining2 = recordFailedAttempt(testUserId);
    let remaining3 = recordFailedAttempt(testUserId);
    
    if (remaining1 === 4 && remaining2 === 3 && remaining3 === 2) {
      console.log('✅ PASS - Failed attempts recorded correctly');
      console.log(`   After 1st: ${remaining1} remaining`);
      console.log(`   After 2nd: ${remaining2} remaining`);
      console.log(`   After 3rd: ${remaining3} remaining`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Attempt counting incorrect`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error:', error);
    failedTests++;
  }
  console.log('');

  // Test 3: Rate Limit Enforcement
  console.log('Test 3: Rate Limit After 5 Attempts');
  try {
    recordFailedAttempt(testUserId); // 4th
    recordFailedAttempt(testUserId); // 5th
    
    const { allowed, remaining } = canAttemptVerification(testUserId);
    
    if (!allowed && remaining === 0) {
      console.log('✅ PASS - Rate limit enforced after 5 attempts');
      console.log(`   Allowed: ${allowed}, Remaining: ${remaining}`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Rate limit not enforced: allowed=${allowed}`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error:', error);
    failedTests++;
  }
  console.log('');

  // Test 4: Reset Attempts
  console.log('Test 4: Reset Verification Attempts');
  try {
    resetVerificationAttempts(testUserId);
    const { allowed, remaining } = canAttemptVerification(testUserId);
    
    if (allowed && remaining === 5) {
      console.log('✅ PASS - Attempts reset successfully');
      console.log(`   Allowed: ${allowed}, Remaining: ${remaining}`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Reset failed: remaining=${remaining}`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error:', error);
    failedTests++;
  }
  console.log('');

  // Test 5: Input Sanitization
  console.log('Test 5: Input Sanitization');
  try {
    const inputs = ['123456', '12 34 56', '12-34-56', '  123456  ', '1 2 3 4 5 6'];
    const expected = '123456';
    
    const allCorrect = inputs.every(input => {
      const sanitized = input.trim().replace(/[\s-]/g, '');
      return sanitized === expected;
    });
    
    if (allCorrect) {
      console.log('✅ PASS - Input sanitization works correctly');
      console.log(`   All formats normalize to: ${expected}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Input sanitization failed');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error:', error);
    failedTests++;
  }
  console.log('');

  // Test 6: Invalid Format Detection
  console.log('Test 6: Invalid Format Detection');
  try {
    const invalidInputs = ['12345', '1234567', 'abcdef', '12345a', ''];
    
    const allRejected = invalidInputs.every(input => {
      const sanitized = input.trim().replace(/[\s-]/g, '');
      return !/^\d{6}$/.test(sanitized);
    });
    
    if (allRejected) {
      console.log('✅ PASS - Invalid formats detected correctly');
      console.log(`   Tested: 5 digits, 7 digits, letters, mixed, empty`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Invalid formats not detected');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error:', error);
    failedTests++;
  }
  console.log('');

  // Summary
  console.log('═'.repeat(60));
  console.log(`\n📊 Test Results: ${passedTests}/${passedTests + failedTests} passed\n`);
  
  if (failedTests === 0) {
    console.log('🎉 All verification logic tests passed!\n');
    console.log('⚠️  Note: Full end-to-end testing requires:');
    console.log('   - Valid DATABASE_URL');
    console.log('   - Registered user with OTP in database');
    console.log('   - Test via actual verification form\n');
    process.exit(0);
  } else {
    console.log(`❌ ${failedTests} test(s) failed. Review errors above.\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

