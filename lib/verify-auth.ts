/**
 * Temporary verification script to test auth utilities
 * Run with: tsx lib/verify-auth.ts
 * DELETE after verification complete
 */

import { hashPassword, verifyPassword, generateToken, verifyToken, TokenExpiredError, InvalidTokenError } from './auth';

async function runTests() {
  console.log('🧪 Testing Auth Utilities\n');
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Password Hashing
  console.log('Test 1: Password Hashing');
  try {
    const hash = await hashPassword('test123');
    if (hash.length === 60 && hash.startsWith('$2b$12$')) {
      console.log('✅ PASS - Hash is 60 characters and starts with $2b$12$');
      console.log(`   Hash: ${hash.substring(0, 20)}...`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Hash format incorrect: ${hash.substring(0, 30)}...`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error hashing password:', error);
    failedTests++;
  }
  console.log('');

  // Test 2: Password Verification - Correct Password
  console.log('Test 2: Password Verification (Correct)');
  try {
    const hash = await hashPassword('mypassword');
    const startTime = Date.now();
    const isValid = await verifyPassword('mypassword', hash);
    const duration = Date.now() - startTime;
    
    if (isValid && duration >= 50 && duration <= 500) {
      console.log(`✅ PASS - Correct password verified in ${duration}ms`);
      passedTests++;
    } else if (!isValid) {
      console.log('❌ FAIL - Correct password rejected');
      failedTests++;
    } else {
      console.log(`❌ FAIL - Timing unusual: ${duration}ms`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error verifying password:', error);
    failedTests++;
  }
  console.log('');

  // Test 3: Password Verification - Incorrect Password
  console.log('Test 3: Password Verification (Incorrect)');
  try {
    const hash = await hashPassword('mypassword');
    const startTime = Date.now();
    const isValid = await verifyPassword('wrongpassword', hash);
    const duration = Date.now() - startTime;
    
    if (!isValid && duration >= 50 && duration <= 500) {
      console.log(`✅ PASS - Incorrect password rejected in ${duration}ms`);
      passedTests++;
    } else if (isValid) {
      console.log('❌ FAIL - Incorrect password accepted!');
      failedTests++;
    } else {
      console.log(`❌ FAIL - Timing unusual: ${duration}ms`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error verifying password:', error);
    failedTests++;
  }
  console.log('');

  // Test 4: JWT Generation
  console.log('Test 4: JWT Generation');
  try {
    const token = await generateToken('test-user-id', false);
    if (token.length >= 100 && token.length <= 500 && token.split('.').length === 3) {
      console.log(`✅ PASS - Token generated (${token.length} characters, 3 parts)`);
      console.log(`   Token: ${token.substring(0, 50)}...`);
      passedTests++;
    } else {
      console.log(`❌ FAIL - Token format incorrect: ${token.substring(0, 50)}...`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error generating token:', error);
    failedTests++;
  }
  console.log('');

  // Test 5: JWT Verification - Valid Token
  console.log('Test 5: JWT Verification (Valid Token)');
  try {
    const testUserId = 'test-user-123';
    const token = await generateToken(testUserId, true);
    const payload = await verifyToken(token);
    
    if (payload.userId === testUserId && payload.isAdmin === true && payload.exp && payload.iat) {
      console.log('✅ PASS - Token verified successfully');
      console.log(`   UserId: ${payload.userId}`);
      console.log(`   IsAdmin: ${payload.isAdmin}`);
      console.log(`   Expires: ${new Date(payload.exp * 1000).toISOString()}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Payload incorrect:', payload);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error verifying token:', error);
    failedTests++;
  }
  console.log('');

  // Test 6: JWT Verification - Expired Token
  console.log('Test 6: JWT Verification (Expired Token)');
  try {
    // Manually create an expired token for testing
    const { SignJWT } = await import('jose');
    const expiredToken = await new SignJWT({
      userId: 'test-user',
      isAdmin: false,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600) // 1 hour ago
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1800) // Expired 30 min ago
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

    await verifyToken(expiredToken);
    console.log('❌ FAIL - Expired token was accepted!');
    failedTests++;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.log('✅ PASS - Expired token correctly rejected');
      console.log(`   Error: ${error.message}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Wrong error type:', error);
      failedTests++;
    }
  }
  console.log('');

  // Test 7: JWT Verification - Tampered Token
  console.log('Test 7: JWT Verification (Tampered Token)');
  try {
    const token = await generateToken('test-user', false);
    const tamperedToken = token.slice(0, -10) + 'tampered!!!';
    
    await verifyToken(tamperedToken);
    console.log('❌ FAIL - Tampered token was accepted!');
    failedTests++;
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      console.log('✅ PASS - Tampered token correctly rejected');
      console.log(`   Error: ${error.message}`);
      passedTests++;
    } else {
      console.log('❌ FAIL - Wrong error type:', error);
      failedTests++;
    }
  }
  console.log('');

  // Test 8: Password Hashing - Empty String
  console.log('Test 8: Password Hashing (Empty String)');
  try {
    const hash = await hashPassword('');
    if (hash.length === 60 && hash.startsWith('$2b$12$')) {
      console.log('✅ PASS - Empty string hashed successfully');
      passedTests++;
    } else {
      console.log('❌ FAIL - Empty string hash incorrect');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL - Error hashing empty string:', error);
    failedTests++;
  }
  console.log('');

  // Summary
  console.log('═'.repeat(60));
  console.log(`\n📊 Test Results: ${passedTests}/${passedTests + failedTests} passed\n`);
  
  if (failedTests === 0) {
    console.log('🎉 All tests passed! Auth utilities working correctly.\n');
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

