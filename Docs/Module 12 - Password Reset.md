# Feature: Password Reset (Module 12)

**Core Problem:** Enable users to securely reset forgotten passwords via email verification without compromising account security.

**Total Chunks:** 2

**Total Estimated Duration:** 6-8 hours

**Feature Tracker Type:** New Feature

**Dependencies:** Module 3 (Email Service & OTP)

---

## Chunk Sequence Overview

| Chunk | Name | Category | Duration | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | Password Reset Backend & Email | 📊 Data | 3-4 hrs | Module 3 complete (email service working) |
| 2 | Reset Flow UI & Password Update | 🎨 UI | 3-4 hrs | Chunk 1 complete (reset tokens generating) |

---

# Chunk 1: 📊 Password Reset Backend & Email

Duration: 3-4 hours | Prerequisites: Module 3 complete (email service configured, OTP system working)

## Quick Reference

**Builds:** Password reset token generation, email sending, and token validation system

**Connects:** Reset request → Token generation → Email with link → Token validation → Password update

**Pattern:** Secure tokens with expiry, email delivery, database storage for tokens

**Watch For:** Token security, expiry handling, email enumeration, token reuse, race conditions

## Context

### User Problem

Users need a secure way to regain access to their accounts when they forget passwords without compromising security.

### From Module Brief

- **Reset Request:** User enters email, receives reset link
- **Secure Token:** Unique, unpredictable reset token
- **Email Delivery:** Reset link sent via email (reuse Module 3 email service)
- **Token Expiry:** Links expire after 1 hour
- **One-Time Use:** Token invalidated after use
- **No User Enumeration:** Don't reveal if email exists
- **Password Update:** User sets new password, token consumed

## What's Changing

### New Additions

- **requestPasswordReset Server Action:** Generates token, sends email
- **validateResetToken Server Action:** Checks token validity and expiry
- **resetPassword Server Action:** Updates password, invalidates token
- **generateResetToken utility:** Creates secure random token
- **Password Reset Email Template:** Email with reset link
- **Token Storage:** Store tokens in database (new table or reuse otp_codes)

### Modifications to Existing

- **Database Schema:** Add password_reset_tokens table OR add type field to otp_codes
- **Email Service:** Reuse from Module 3 for sending reset emails

### No Changes To

- Login functionality from Module 2
- User authentication
- OTP verification (separate flow)

## Data Flow

### Password Reset Request Flow

1. **Trigger:** User clicks "Forgot Password" on login page
2. **User Input:** Enters email address
3. **Server Action Call:** requestPasswordReset(email)
4. **User Lookup:** Query database for user with email
5. **Token Generation:** Generate secure random token (crypto.randomBytes or UUID)
6. **Token Storage:** INSERT into password_reset_tokens (or otp_codes) with userId, token, expiresAt (1 hour from now)
7. **Email Send:** Send email with reset link: /reset-password?token=TOKEN
8. **Conditional Branches:**
    - If email exists → Generate token, send email, return generic success
    - If email not found → Return generic success (don't reveal existence)
    - If email service fails → Log error, return generic success (retry async)
    - If database error → Return error "Something went wrong"
9. **Response:** Always "If account exists, reset email sent" (no enumeration)
10. **Final State:** Token stored, email sent (or queued)

### Token Validation Flow

1. **Trigger:** User clicks reset link from email
2. **URL Parse:** Extract token from query params
3. **Server Action:** validateResetToken(token)
4. **Database Query:** SELECT from password_reset_tokens WHERE token = $1
5. **Validation Checks:**
    - Token exists in database
    - Token not expired (expiresAt > now())
    - Token not already used (optional used_at field)
6. **Conditional Branches:**
    - If valid → Return { valid: true, userId: X }
    - If expired → Return { valid: false, error: "Link expired" }
    - If not found → Return { valid: false, error: "Invalid link" }
    - If already used → Return { valid: false, error: "Link already used" }
7. **Final State:** Token validity confirmed

### Password Update Flow

1. **Trigger:** User submits new password on reset form
2. **Server Action:** resetPassword(token, newPassword)
3. **Token Validation:** Re-validate token (check not expired, not used)
4. **Password Hash:** Hash new password with bcrypt (same as registration)
5. **Database Update:** UPDATE users SET passwordHash = $1 WHERE id = userId
6. **Token Invalidation:** DELETE token OR UPDATE set used_at = now()
7. **Conditional Branches:**
    - If success → Return success, redirect to login
    - If token invalid → Return error "Invalid or expired link"
    - If same password → Allow (no check required per spec)
    - If database error → Return error "Failed to reset password"
8. **Final State:** Password updated, token invalidated, user can log in

## Things to Watch For

**Token Predictability** → Sequential or guessable tokens → Prevention: Use crypto.randomBytes(32) or UUID v4 for unpredictable tokens

**Email Enumeration** → Different responses for existing vs non-existing emails → Prevention: Always return same success message regardless of email existence

**Token Expiry Not Enforced** → Expired tokens still work → Prevention: Check expiresAt < now() in validation, reject if expired

**Token Reuse** → Same token used multiple times → Prevention: Delete or mark token as used after password reset

**Timing Attack** → Response time reveals email existence → Prevention: Execute same steps for existing and non-existing emails

**Token in URL** → Token visible in browser history → Prevention: Acceptable for reset flow, but document that token is one-time use

**Token Too Short** → 6-character token easily brute forced → Prevention: Use at least 32-byte (64-char hex) token

**Multiple Reset Requests** → User requests reset multiple times → Prevention: Invalidate previous tokens when new one generated, or allow multiple active

**Email Service Down** → Reset fails silently → Prevention: Queue email for retry, log errors, but show success to user

**Token Storage Insecure** → Tokens stored in plain text → Prevention: Acceptable for time-limited tokens, or hash tokens (but URL contains plain token)

**No Rate Limiting** → Attacker spams reset requests → Prevention: Rate limit by IP or email (e.g., max 3 requests per hour)

**Password Strength Not Checked** → User sets weak password → Prevention: Per spec, accept any password (no restrictions)

**Same Password Allowed** → User resets to same password → Prevention: Per spec, this is allowed (no check needed)

**Token Collision** → Two users get same token → Prevention: Cryptographically random tokens make collision virtually impossible

**Link Expires While Using** → User on form when token expires → Prevention: Re-validate token on submission, clear error message

**Token in Email Plain Text** → Token visible if email intercepted → Prevention: Use HTTPS links, acceptable for time-limited tokens

**Phishing Risk** → Fake reset emails → Prevention: Use consistent sender email, educate users (out of scope for MVP)

**Account Takeover via Reset** → Attacker resets victim's password → Prevention: Requires access to victim's email, which is the security boundary

**Token Length in Database** → VARCHAR too short for token → Prevention: Store as VARCHAR(255) or TEXT to accommodate long tokens

**Foreign Key on UserId** → Constraint issues if user deleted → Prevention: Foreign key with ON DELETE CASCADE for tokens table

**Timezone Issues** → ExpiresAt in wrong timezone → Prevention: Store in UTC, calculate expiry correctly

**Token Cleanup** → Old tokens accumulate in database → Prevention: Periodic cleanup job OR database TTL (optional for MVP)

**Multiple Active Tokens** → User has 5 valid tokens → Prevention: Either allow (acceptable) or invalidate old tokens on new request

**Email Delivery Delay** → Email takes 10 minutes to arrive → Prevention: Document expected delivery time, token valid for 1 hour

**Token Validation Race** → Token validated twice simultaneously → Prevention: Use database transaction or unique constraint to prevent double use

**Password Update Without Validation** → Updating password without checking token → Prevention: Always validate token before allowing password update

**Error Message Leakage** → Detailed errors reveal system info → Prevention: Generic error messages, log details server-side

**Session Not Invalidated** → Old sessions still valid after reset → Prevention: Optional enhancement to invalidate all sessions after password reset

**CSRF on Reset** → Attacker triggers reset for victim → Prevention: Next.js Server Actions have CSRF protection

**Token in Logs** → Token logged in server logs → Prevention: Avoid logging tokens in plain text

**Null Token** → Code doesn't handle null token → Prevention: Validate token exists and is string before processing

**Empty Password** → User submits empty password → Prevention: Validate password length > 0 (even though spec says no restrictions)

## Testing Verification

### Existing Features Still Work

- [ ]  Login still works with existing password
- [ ]  Registration still works
- [ ]  Email OTP (Module 3) still works

### New Functionality Works

- [ ]  requestPasswordReset generates token and sends email
- [ ]  Reset email received within reasonable time
- [ ]  Reset link contains token in URL
- [ ]  validateResetToken returns valid for fresh token
- [ ]  validateResetToken returns invalid for expired token
- [ ]  resetPassword updates user password
- [ ]  Token invalidated after use
- [ ]  User can log in with new password
- [ ]  Request for non-existent email returns generic success

### Edge Cases

- [ ]  Token expires after 1 hour (test with shortened expiry)
- [ ]  Expired token rejected with clear error
- [ ]  Used token cannot be reused
- [ ]  Multiple reset requests work correctly
- [ ]  Invalid token format handled gracefully
- [ ]  Empty email returns validation error
- [ ]  Same password reset works (allowed)
- [ ]  Token is sufficiently random (visual inspection)
- [ ]  Email enumeration not possible (same response always)

---

# Chunk 2: 🎨 Reset Flow UI & Password Update

Duration: 3-4 hours | Prerequisites: Chunk 1 complete (reset token system working, emails sending)

## Quick Reference

**Builds:** Complete password reset user interface from request to completion

**Connects:** Forgot password link → Request form → Email → Reset page → Success → Login

**Pattern:** Multi-step form flow with validation and clear feedback

**Watch For:** Token handling in URL, form validation, error messaging, mobile UX

## Context

### User Problem

Users need a clear, intuitive interface to request password reset and complete the process successfully.

### From Module Brief

- **Forgot Password Link:** On login page, clearly visible
- **Request Form:** Simple email input
- **Confirmation Message:** "Check your email for reset link"
- **Reset Page:** Form to enter new password with token validation
- **Success Flow:** Clear success message, redirect to login
- **Error Handling:** Clear errors for expired/invalid links

## What's Changing

### New Additions

- **Forgot Password Link:** On login page
- **Request Reset Page:** /forgot-password with email input form
- **Reset Password Page:** /reset-password with new password form
- **Token Validation on Page Load:** Validates token when reset page loads
- **Success Page/Message:** Confirmation after successful reset
- **Error States:** Clear messaging for all error scenarios

### Modifications to Existing

- **Login Page:** Add "Forgot Password?" link

### No Changes To

- Login form logic (except adding link)
- Registration flow
- Email service

## Data Flow

### Password Reset User Flow

1. **Trigger:** User clicks "Forgot Password" on login page
2. **Request Page:** Navigate to /forgot-password
3. **Email Input:** User enters email, clicks "Send Reset Link"
4. **Loading State:** Button shows "Sending..."
5. **Server Action:** Call requestPasswordReset(email)
6. **Success Message:** "Check your email for reset instructions"
7. **Email Arrival:** User receives email with reset link
8. **Click Link:** User clicks link, navigates to /reset-password?token=XXX
9. **Page Load:** Token validated on load
10. **Conditional Display:**
    - If valid → Show password input form
    - If invalid → Show error and link to request new reset
    - If expired → Show error and link to request new reset
11. **Password Entry:** User enters new password
12. **Submit:** Call resetPassword(token, password)
13. **Success:** Show "Password reset successful! Please log in."
14. **Redirect:** Navigate to login page
15. **Final State:** User logs in with new password

## UX Specification

### User Flow

- Trigger: Click "Forgot Password?" on login page
- Step 1: See request reset page with email input
- Step 2: Enter email, click "Send Reset Link"
- Step 3: See message "Check your email"
- Step 4: Open email, click reset link
- Step 5: See reset password form
- Step 6: Enter new password, click "Reset Password"
- Step 7: See success message
- Step 8: Redirected to login
- Step 9: Log in with new password

### Empty States

- Request page: Empty email input with placeholder
- Reset page: Empty password input

### Loading States

- Send button: "Send Reset Link" → "Sending..." with spinner
- Reset button: "Reset Password" → "Resetting..." with spinner

### Error States

- Invalid email format: "Please enter a valid email"
- Empty email: "Email required"
- Empty password: "Password required"
- Invalid token: "Reset link is invalid. Please request a new one."
- Expired token: "Reset link has expired. Please request a new one."
- Network error: "Something went wrong. Please try again."

### Responsive Behavior

- Mobile: Full-width forms, large inputs, prominent buttons
- Desktop: Centered forms with max-width, comfortable spacing
- All sizes: Clear error messages, readable text

## Things to Watch For

**Forgot Password Link Not Visible** → Users can't find link → Prevention: Place prominently below login form

**Email Input Validation Missing** → Invalid email submitted → Prevention: Validate email format on client and server

**Token Not Parsed from URL** → Reset page doesn't get token → Prevention: Parse query params with Next.js useSearchParams

**Token Validation on Client** → Trusting client-side validation → Prevention: Always re-validate token on server when resetting password

**Password Visibility Toggle Missing** → Users can't see password they're typing → Prevention: Add show/password toggle icon (optional but helpful)

**Password Confirmation Field** → Requiring password twice → Prevention: Master Spec doesn't mention this, single field is fine

**No Password Strength Indicator** → No feedback on password strength → Prevention: Per spec, accept any password, but could add indicator

**Token Exposed in Client State** → Token stored in local state unnecessarily → Prevention: Keep token in URL, don't store separately

**Back Button After Reset** → User presses back to reset page → Prevention: Token already used, show error or redirect

**Success Message Too Brief** → User doesn't see success before redirect → Prevention: Show message for 2-3 seconds before redirect

**Redirect Too Fast** → Auto-redirect happens too quickly → Prevention: Wait 2-3 seconds or require user to click "Go to Login"

**Error Not Displayed** → Server error happens silently → Prevention: Always display error messages to user

**Form Not Clearing** → Email remains in input after success → Prevention: Clear form or irrelevant since navigating away

**Multiple Submissions** → User clicks send multiple times → Prevention: Disable button during submission

**Token in Browser History** → Token visible in history → Prevention: Acceptable, token is one-time use and expires

**Accessibility Missing** → Screen readers can't use forms → Prevention: Add labels, ARIA attributes, clear error announcements

**Mobile Keyboard Issues** → Email keyboard doesn't show @ → Prevention: Set input type="email" for correct keyboard

**Form Not Centered** → Layout broken on different screens → Prevention: Center form, test on multiple screen sizes

**Link Text Confusing** → "Forgot Password" vs "Reset Password" → Prevention: Use clear, consistent terminology

**Too Many Clicks** → User has to click through multiple pages → Prevention: Minimal flow: request → email → reset → login

**Email Case Sensitivity** → "[John@Email.com](mailto:John@Email.com)" vs "[john@email.com](mailto:john@email.com)" → Prevention: Normalize email to lowercase before lookup

**Rate Limiting UI** → No indication user is rate limited → Prevention: Show error "Too many requests. Try again later."

**Success Message Generic** → Doesn't tell user what to do next → Prevention: "Password reset successful! Please log in with your new password."

**Token Validation Error Not Clear** → "Error" doesn't explain issue → Prevention: Specific messages for expired vs invalid vs used tokens

**New Token Request Button Missing** → Expired link, no way to request new one → Prevention: "Request New Reset Link" button on error page

**Breadcrumbs Missing** → User lost in flow → Prevention: Clear page titles: "Forgot Password", "Reset Password"

**Email Doesn't Arrive** → No guidance for user → Prevention: "Email not received? Check spam or try again in a few minutes"

**Password Requirements Not Stated** → User doesn't know if restrictions → Prevention: Per spec no restrictions, but state "Choose a new password"

**Form Labels Not Associated** → Clicking label doesn't focus input → Prevention: Use htmlFor on labels matching input id

**Enter Key Not Working** → User expects Enter to submit → Prevention: Ensure form onSubmit handler or button click works with Enter

**Focus Not Managed** → After error, focus not returned to input → Prevention: Focus first input field after error

**Loading State Not Visible** → No indication form is processing → Prevention: Clear loading state on button and disabled inputs

**Error Styling Not Prominent** → User doesn't notice error → Prevention: Red text, icon, positioned near relevant input

**Success Styling Not Celebratory** → Plain text doesn't feel successful → Prevention: Green checkmark, positive messaging

**Mobile Submit Button Hidden** → Keyboard covers button → Prevention: Ensure button scrolls into view, or use sticky button

**Browser Autocomplete Interferes** → Saved passwords auto-fill → Prevention: Set autoComplete="off" or allow it (could be helpful)

## Testing Verification

### Existing Features Still Work

- [ ]  Login page still works normally
- [ ]  Regular login still functions
- [ ]  Registration still works

### New Functionality Works

- [ ]  "Forgot Password?" link visible on login page
- [ ]  Clicking link navigates to /forgot-password
- [ ]  Email input accepts text
- [ ]  Submit button triggers request
- [ ]  Success message appears: "Check your email"
- [ ]  Reset email received with link
- [ ]  Clicking email link opens /reset-password with token
- [ ]  Reset page validates token on load
- [ ]  Valid token shows password input form
- [ ]  Password input accepts text
- [ ]  Submit updates password successfully
- [ ]  Success message displays
- [ ]  Redirect to login works
- [ ]  User can log in with new password

### Edge Cases

- [ ]  Invalid email format shows error
- [ ]  Empty email shows error
- [ ]  Empty password shows error
- [ ]  Expired token shows appropriate error
- [ ]  Invalid token shows appropriate error
- [ ]  Used token shows error (can't reuse)
- [ ]  Multiple submit clicks don't cause issues
- [ ]  Mobile keyboard shows email keyboard for email input
- [ ]  Error messages clearly visible
- [ ]  Success message visible before redirect
- [ ]  Form accessible with keyboard only
- [ ]  Screen reader can navigate forms

---

## Feature Acceptance Tests

**Run these after both chunks are complete:**

### Core Tests (from Module Brief)

- [ ]  Click "Forgot Password" → Enter email → Reset email received
- [ ]  Click reset link in email → Navigate to reset form
- [ ]  Enter new password and submit → Password updated successfully
- [ ]  Log in with new password → Login successful
- [ ]  Wait 61 minutes → try reset link → Error: "Reset link expired"
- [ ]  Request reset with non-existent email → Show "Email sent" (no error)

### Edge Cases (from Module Brief)

- [ ]  Request reset twice → Only second link works
- [ ]  Use reset link twice → Second use rejected (already used)
- [ ]  Tamper with reset token → Error: "Invalid reset link"
- [ ]  Reset password to same as old password → Accepted

### Integration Tests

- [ ]  Reset password → log out → log in with new password → Success
- [ ]  User has active session → resets password → can still use active session (or force logout)
- [ ]  Reset flow doesn't interfere with OTP email verification

---

## Implementation Notes

**Token Generation:**

```tsx
import crypto from 'crypto';

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex'); // 64-char hex string
}
```

**Token Expiry Calculation:**

```tsx
const expiresAt = new Date([Date.now](http://Date.now)() + 60 * 60 * 1000); // 1 hour from now
```

**Email Template:**

Reuse email service from Module 3, create reset email template:

- Subject: "Reset Your Password"
- Body: "Click this link to reset your password: [Reset Link]. Link expires in 1 hour."
- Reset Link: `${BASE_URL}/reset-password?token=${token}`

**Database Schema Option 1 (New Table):**

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Database Schema Option 2 (Reuse otp_codes):**

Add `type` field: 'otp' | 'password_reset'

**Security Best Practices:**

- Use HTTPS in production
- Tokens cryptographically random
- Time-limited (1 hour)
- One-time use
- No email enumeration