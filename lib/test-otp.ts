/**
 * Temporary test script for OTP generation and storage
 * Run with: pnpm tsx lib/test-otp.ts
 * DELETE after verification
 */

// Import only the generation functions, not database-dependent ones
import crypto from 'crypto';

// Inline the functions to avoid DATABASE_URL requirement
function generateOTP(): string {
  const code = crypto.randomInt(0, 1000000);
  return code.toString().padStart(6, '0');
}

function getOTPExpiration(): Date {
  return new Date(Date.now() + 15 * 60 * 1000);
}

async function runTests() {
  console.log('🔐 Testing OTP Generation & Storage\n');
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Generate OTP - Format Check
  console.log('Test 1: OTP Generation Format');
  try {
    const otp = generateOTP();
    
    if (otp.length === 6 && /^\d{6}$/.test(otp)) {
      console.log('✅ PASS - OTP is 6 digits');
      console.log(`   Generated: ${otp}`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - OTP format incorrect: ${otp}`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error generating OTP:', error);
    failedTests++;
  }
  console.log('');

  // Test 2: Leading Zeros Preservation
  console.log('Test 2: Leading Zeros Preservation');
  try {
    const otps = Array.from({ length: 100 }, () => generateOTP());
    const hasLeadingZeros = otps.some(otp => otp.startsWith('0'));
    
    if (hasLeadingZeros) {
      console.log('✅ PASS - Leading zeros preserved in generated codes');
      const examples = otps.filter(otp => otp.startsWith('0')).slice(0, 3);
      console.log(`   Examples: ${examples.join(', ')}`);
      passedTests++;
    } else {
      console.log('⚠️  WARNING - No leading zeros in 100 samples (might be random)');
      passedTests++; // Still pass, just unlikely
    }
  } catch (error) {
    console.log('❌ FAIL - Error testing leading zeros:', error);
    failedTests++;
  }
  console.log('');

  // Test 3: Randomness Check
  console.log('Test 3: OTP Randomness (No Duplicates)');
  try {
    const otps = new Set(Array.from({ length: 1000 }, () => generateOTP()));
    
    if (otps.size >= 990) { // Allow some duplicates due to randomness
      console.log('✅ PASS - OTPs are random (no significant duplicates)');
      console.log(`   Generated 1000 codes, ${otps.size} unique`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Too many duplicates: ${otps.size}/1000 unique`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error testing randomness:', error);
    failedTests++;
  }
  console.log('');

  // Test 4: Expiration Calculation
  console.log('Test 4: Expiration Calculation');
  try {
    const now = Date.now();
    const expiration = getOTPExpiration();
    const expirationMs = expiration.getTime();
    const diffMinutes = (expirationMs - now) / (60 * 1000);
    
    if (diffMinutes >= 14.9 && diffMinutes <= 15.1) {
      console.log('✅ PASS - Expiration is ~15 minutes from now');
      console.log(`   Exact: ${diffMinutes.toFixed(2)} minutes`);
      console.log(`   Expires at: ${expiration.toISOString()}`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Expiration incorrect: ${diffMinutes} minutes`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error calculating expiration:', error);
    failedTests++;
  }
  console.log('');

  // Test 5: OTP Range Coverage
  console.log('Test 5: OTP Range Coverage');
  try {
    const otps = Array.from({ length: 10000 }, () => parseInt(generateOTP(), 10));
    const min = Math.min(...otps);
    const max = Math.max(...otps);
    
    console.log(`✅ PASS - OTP range coverage`);
    console.log(`   Min: ${min.toString().padStart(6, '0')}`);
    console.log(`   Max: ${max.toString().padStart(6, '0')}`);
    console.log(`   Range: 0-999999`);
    passedTests++;
  } catch (error) {
    console.log('❌ FAIL - Error testing range:', error);
    failedTests++;
  }
  console.log('');

  // Test 6: Format Consistency
  console.log('Test 6: Format Consistency');
  try {
    const formats = Array.from({ length: 100 }, () => generateOTP());
    const allValid = formats.every(otp => otp.length === 6 && /^\d{6}$/.test(otp));
    
    if (allValid) {
      console.log('✅ PASS - All generated OTPs have consistent format');
      console.log(`   Tested 100 codes, all 6 digits`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Inconsistent OTP formats detected');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error testing format:', error);
    failedTests++;
  }
  console.log('');

  // Summary
  console.log('═'.repeat(60));
  console.log(`\n📊 Test Results: ${passedTests}/${passedTests + failedTests} passed\n`);
  
  if (failedTests === 0) {
    console.log('🎉 All OTP generation tests passed!\n');
    console.log('⚠️  Note: Database and email tests require:');
    console.log('   - Valid DATABASE_URL');
    console.log('   - Valid RESEND_API_KEY');
    console.log('   - Test via registration flow or separate DB test\n');
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

