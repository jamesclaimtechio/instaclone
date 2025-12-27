# Feature: Email Service & OTP Verification

**Core Problem:** Verify user email ownership through OTP codes sent via email, preventing spam accounts and ensuring communication channel validity.

**Total Chunks:** 4

**Total Estimated Duration:** 8-12 hours

**Feature Tracker Type:** New Feature

---

## Chunk Sequence Overview

| Chunk | Name | Category | Duration | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | Email Service Integration | 🔌 | 2-3 hrs | Module 1 (Database with otp_codes table exists) |
| 2 | OTP Generation & Storage | ⚙️ | 2-3 hrs | Chunk 1 (Email service can send emails) |
| 3 | OTP Verification Flow | 🔐 | 2-3 hrs | Chunk 2 (OTPs stored in database) |
| 4 | Verification UI & Enforcement | 🎨 | 2-3 hrs | Chunk 3 (Verification logic works) |

---

# Chunk 1: 🔌 Email Service Integration

Duration: 2-3 hours | Prerequisites: Module 1 completed (Database with otp_codes table exists)

## Quick Reference

**Builds:** Production-ready email sending infrastructure with transactional email service integration, HTML email templates, and comprehensive error handling.

**Connects:** Application code → Email service API (Resend/SendGrid/Postmark) → SMTP delivery → User's inbox

**Pattern:** Service abstraction layer with retry logic, template rendering, and environment-based configuration

**Watch For:**

1. Emails landing in spam due to missing SPF/DKIM records
2. Email service API keys exposed in client-side code
3. Rate limits exceeded during testing causing account suspension

## Context

### User Problem

Application needs reliable email delivery for OTP codes with professional templates and tracking capabilities before verification flow can be implemented.

### From Module Brief

- **Email service integration**: Resend, SendGrid, or similar transactional email service
- **Template system**: HTML email templates for OTP delivery with clear branding
- **Error handling**: Graceful handling of email service failures without exposing errors to users
- **Environment configuration**: API keys and sender addresses managed via environment variables
- **Delivery speed**: Emails must arrive within seconds for acceptable UX

## What's Changing

### New Additions

- **Email service client**: Wrapper around chosen email service API (Resend, SendGrid, or Postmark), provides abstraction for sending emails
- **Email configuration**: Environment variables for API key, sender email, sender name, from address
- **OTP email template**: HTML template for OTP delivery with 6-digit code prominently displayed, includes app branding and instructions
- **Email sending utility**: Function that accepts recipient, subject, HTML content, sends via service, returns success/failure
- **Email retry logic**: Automatic retry on transient failures (network errors, rate limits), exponential backoff strategy
- **Email error types**: Custom error classes for different failure modes (invalid recipient, service unavailable, rate limited)
- **Email logging**: Server-side logging of email send attempts with success/failure status (no sensitive content logged)
- **Template rendering utility**: Function that accepts template name and data, renders HTML with substitutions
- **Email queue preparation**: Structure ready for queue implementation later if send volume increases

### Modifications to Existing

- **Environment variables**: Add EMAIL_SERVICE_API_KEY, EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME to .env.local
- **.env.example**: Document email service configuration with setup instructions
- **.gitignore**: Ensure email logs not committed if writing to local files

### No Changes To

- **Database schema**: No changes to otp_codes table yet
- **Authentication flows**: Email service is dependency, not dependent on auth
- **User-facing UI**: Email templates are server-rendered, no client changes

## Data Flow

### Email Sending Flow

1. Application code calls email sending utility with recipient, subject, template name, template data
2. Template rendering utility loads HTML template
3. Template variables substituted (OTP code, username, etc.)
4. Email service client prepares API request with rendered HTML
5. API request sent to email service (Resend/SendGrid/Postmark)
6. Email service validates request and queues for delivery
- If successful → Returns message ID, email queued for delivery
- If invalid request → Returns 4xx error, log and return failure
- If service error → Returns 5xx error, retry with backoff
1. Email service delivers to recipient's mail server via SMTP
2. Final state: Email delivered to inbox or retry exhausted

### Email Delivery Tracking Flow

1. Email service delivers email to recipient's mail server
2. Email service sends webhook notification (if configured)
3. Application receives delivery status (delivered, bounced, opened)
- Not required for MVP, but service supports it
1. Final state: Delivery status known for debugging

### Email Retry Flow

1. Initial send attempt fails with network error or 5xx response
2. Retry utility waits exponential backoff delay (1s, 2s, 4s)
3. Retry attempt made with same request
4. Max 3 retries attempted
- If any retry succeeds → Return success
- If all retries fail → Return failure, log error
1. Final state: Best effort delivery attempted

## Things to Watch For

**API key exposed in client code** → Email service compromised, quota exhausted → Store EMAIL_SERVICE_API_KEY server-side only, never use NEXT_PUBLIC_ prefix, only access in Server Actions and API routes

**Sender email not verified** → Emails rejected by service → Most services require verifying sender domain or email address, complete verification in service dashboard before testing

**SPF/DKIM records not configured** → Emails land in spam → Configure DNS records as instructed by email service for domain authentication, verify setup with service's testing tools

**DMARC policy too strict** → Emails rejected by recipient servers → Set DMARC policy to p=none initially, monitor reports before tightening to p=quarantine or p=reject

**Rate limits not respected** → Account suspended for abuse → Respect service's rate limits (Resend: 100/day free tier, SendGrid: 100/day free), implement rate limiting before hitting limits

**Email content triggers spam filters** → Low delivery rate → Avoid spam trigger words (FREE, URGENT, WIN), include unsubscribe link, maintain text/HTML balance, use professional templates

**Retry logic causes duplicate emails** → User receives multiple OTP codes → Track message IDs, don't retry if first attempt returned success response (even if webhook shows failure later)

**Retry on permanent failures** → Wasted API calls → Don't retry on 4xx errors (invalid recipient, authentication failed), only retry 5xx and network errors

**No exponential backoff** → Retry storm overwhelms service → Implement exponential backoff (1s, 2s, 4s) between retries to avoid thundering herd

**Infinite retry loop** → Application hangs → Set max retry attempts (3), timeout per attempt (10s), total timeout (30s)

**Email service credentials in git** → Security breach → Verify .env.local in .gitignore, only commit .env.example with placeholder values

**HTML template not responsive** → Email unreadable on mobile → Use email-safe HTML (tables for layout), test in Litmus or Email on Acid, ensure OTP code readable on all devices

**Template uses external images** → Images blocked, template broken → Inline critical images as base64 or use email service's hosted images, provide alt text for accessibility

**Template lacks plain text version** → Spam score increases → Provide plain text alternative, many email services auto-generate but explicit is better

**Template contains JavaScript** → Script stripped by email clients → Never use JavaScript in email templates, all email clients remove it for security

**OTP code not prominent** → User can't find code → Make 6-digit code large, bold, centered, in contrasting color, clearly labeled

**Email lacks clear sender identity** → User thinks it's spam → Set FROM_NAME to app name, FROM_ADDRESS to [no-reply@yourdomain.com](mailto:no-reply@yourdomain.com) or similar recognizable address

**Reply-to not set** → User replies go nowhere → Set reply-to to support email if monitoring replies, or clearly state "This is an automated email, do not reply"

**Subject line too vague** → Email ignored or marked spam → Use specific subject like "Your verification code for [App Name]", avoid generic "Verification Code"

**Email too long** → User scrolls to find code → Keep email concise, OTP code above the fold, minimal additional text

**No expiration time communicated** → User tries expired code → State in email "This code expires in 15 minutes" so user knows urgency

**Branding inconsistent** → User questions legitimacy → Use consistent colors, logo, fonts matching app's visual identity

**No call to action** → User doesn't know what to do → Clear CTA: "Enter this code in the app to verify your email"

**Link instead of code** → Different UX than spec → Master Spec specifies 6-digit code, not magic link, ensure user enters code manually

**Email service switch breaks implementation** → Vendor lock-in → Abstract email service behind interface, switching from Resend to SendGrid only requires changing one module

**Webhook endpoint not secured** → Attackers fake delivery events → Verify webhook signatures using service's secret key, reject unsigned requests

**Email logs contain sensitive data** → Privacy violation → Log recipient address, status, timestamp only, never log email content or OTP codes

**Synchronous email sending blocks request** → Slow response times → Email sending should be async, return response immediately while email sends in background (or use queue)

**No timeout on email API calls** → Request hangs indefinitely → Set reasonable timeout (10s) on HTTP requests to email service

**Email service API down** → All registrations fail → Implement circuit breaker pattern or queue emails for later delivery (not in this chunk, but plan for it)

**Test emails counted against quota** → Run out of quota before launch → Use email service's test mode or sandbox environment during development

**Production credentials used in dev** → Test emails sent to real users → Use separate API keys for dev/staging/production, configure based on NODE_ENV

**Batch sending not utilized** → Inefficient API usage → Not needed for MVP (one email at a time), but batch API available if sending to multiple recipients

**Template versioning not tracked** → Can't rollback bad template → Version templates in git, use template names like otp-v1.html, otp-v2.html for easy rollback

**A/B testing not supported** → Can't optimize open rates → Not needed for MVP, but email services support A/B testing for subject lines and content

**Delivery webhooks not configured** → Can't debug delivery issues → Configure webhooks in email service dashboard for delivered, bounced, opened events, log to monitoring service

**Bounce handling not implemented** → Invalid emails pollute database → Not in this chunk, plan to mark email as invalid after hard bounce

**Complaint handling not implemented** → Users mark as spam, sender reputation damaged → Monitor spam complaint rate, implement unsubscribe (not needed for transactional OTP emails)

**Email preview not tested** → Template broken in Outlook/Gmail → Test email rendering in major clients (Gmail, Outlook, Apple Mail) using service's preview tool

**Inline CSS not used** → Styles not applied → Email clients strip <style> tags, use inline styles for all formatting

**Dark mode not considered** → Email unreadable in dark mode → Use light background colors, avoid relying on transparency, test in dark mode clients

## Testing Verification

### Existing Features Still Work

- [ ]  Next.js app runs → No errors from email service integration
- [ ]  Registration works → Email service doesn't interfere with auth flows

### New Functionality Works

- [ ]  Send test email with utility → Email arrives in inbox within seconds
- [ ]  Check email content → HTML renders correctly, OTP code visible
- [ ]  Check sender info → FROM name and address match configuration
- [ ]  Send to invalid email → Returns error without retrying
- [ ]  Simulate service error → Retries with exponential backoff
- [ ]  Max retries exhausted → Returns failure after 3 attempts
- [ ]  Check email service dashboard → Sent emails appear in activity log
- [ ]  Verify SPF/DKIM → Email headers show PASS for authentication
- [ ]  Test mobile rendering → Email readable on small screens
- [ ]  Test plain text version → Fallback works for text-only clients

### Edge Cases

- [ ]  Send email with very long recipient name → Handles gracefully
- [ ]  Send with missing template data → Returns clear error or uses defaults
- [ ]  API key invalid → Returns authentication error without crashing
- [ ]  Network timeout during send → Retries then fails gracefully
- [ ]  Service rate limit hit → Backs off and retries or returns rate limit error
- [ ]  Send to multiple recipients sequentially → All succeed

## Reference Links

- Resend API Docs: https://resend.com/docs
- SendGrid API Docs: https://docs.sendgrid.com
- Postmark API Docs: https://postmarkapp.com/developer
- Email Testing Tool: https://www.mail-tester.com

---

# Chunk 2: ⚙️ OTP Generation & Storage

Duration: 2-3 hours | Prerequisites: Chunk 1 completed (Email service can send emails)

## Quick Reference

**Builds:** Cryptographically secure OTP code generation, database storage with expiration tracking, and automatic OTP sending on user registration.

**Connects:** Registration → Generate 6-digit OTP → Store in otp_codes table → Send via email → Return success

**Pattern:** Cryptographic random generation with database transaction ensuring OTP stored before email sent

**Watch For:**

1. OTP codes predictable due to weak random number generation
2. Multiple OTP codes valid simultaneously for same user
3. OTP sent but database insert fails, user can't verify

## Context

### User Problem

Users need to receive unique, time-limited verification codes immediately after registration to prove email ownership.

### From Module Brief

- **OTP generation**: 6-digit numeric code (000000-999999)
- **Cryptographic security**: Use crypto.randomInt() not Math.random() for unpredictable codes
- **OTP storage**: Store in otp_codes table with userId, code, expiresAt, createdAt
- **15-minute expiration**: OTPs invalid after 15 minutes from creation
- **Automatic sending**: OTP sent immediately after registration without user action
- **Invalidate previous codes**: New OTP invalidates all previous codes for same user

## What's Changing

### New Additions

- **OTP generation utility**: Function using crypto.randomInt(0, 999999) to generate 6-digit code, pads with leading zeros
- **OTP storage function**: Inserts OTP record into otp_codes table with userId, code, expiresAt (now + 15 min), createdAt
- **OTP invalidation logic**: Deletes or marks invalid all existing OTPs for user before creating new one
- **Post-registration OTP flow**: After user created in registration Server Action, generate and send OTP
- **OTP expiration calculation**: Utility that returns timestamp 15 minutes from now
- **OTP email template data**: Populate template with username, OTP code, expiration time
- **Transaction coordination**: Wrap OTP creation and user update in database transaction
- **Registration response update**: Include emailVerificationRequired flag in response

### Modifications to Existing

- **Registration Server Action**: Add OTP generation and sending after user insert
- **otp_codes table**: Uses existing schema from Module 1, no migration needed
- **Users table**: emailVerified field already exists, no changes needed

### No Changes To

- **Email service**: Uses existing email sending utility from Chunk 1
- **Login flow**: Not modified in this chunk, still allows unverified users to login
- **Middleware**: No route protection changes yet

## Data Flow

### OTP Generation on Registration Flow

1. User completes registration form, submits
2. Registration Server Action creates user account (from Module 2)
3. User record inserted successfully with emailVerified=false
4. Generate 6-digit OTP using crypto.randomInt(0, 999999)
5. Pad OTP with leading zeros to ensure 6 digits (e.g., 1234 → 001234)
6. Calculate expiration timestamp (now + 15 minutes)
7. Delete any existing OTPs for this userId
8. Insert new OTP record: userId, code, expiresAt, createdAt
- If insert fails → Rollback transaction, return error
- If insert succeeds → Continue
1. Commit transaction
2. Send OTP email asynchronously using Chunk 1's email service
3. Return success to user with message "Check your email for verification code"
- If email fails → Log error but don't block registration (user can resend)
1. Final state: User registered, OTP sent, can verify email

### OTP Resend Flow

1. User clicks "Resend OTP" on verification page
2. Resend Server Action receives userId (from current session)
3. Check if user already verified (emailVerified=true)
- If verified → Return error "Email already verified"
- If not verified → Continue
1. Check last OTP creation time for this user
2. Rate limit: Require 60 seconds between resend requests
- If too soon → Return error "Please wait before requesting another code"
- If rate limit passed → Continue
1. Delete all existing OTPs for this user
2. Generate new 6-digit OTP
3. Calculate new expiration (now + 15 minutes)
4. Insert new OTP record
5. Send OTP email
6. Return success "New verification code sent"
7. Final state: Old OTP invalidated, new OTP active

### OTP Cleanup Flow (Background)

1. Expired OTPs accumulate in database
2. Scheduled job runs periodically (daily)
3. Delete OTP records where expiresAt < now()
4. Final state: Database cleaned of expired codes
- Not implemented in this chunk, plan for later

## Things to Watch For

**Math.random() used for OTP** → Predictable codes, security breach → Always use crypto.randomInt() from Node.js crypto module, never Math.random() which is not cryptographically secure

**OTP range incorrect** → Codes not 6 digits → crypto.randomInt(0, 999999) generates 0-999999, then pad with .toString().padStart(6, '0')

**Leading zeros not preserved** → OTP 000123 stored as 123 → Store OTP as TEXT/VARCHAR in database, not INTEGER, to preserve leading zeros

**OTP collision possible** → Two users get same code at same time → Acceptable for MVP, 1 million possible codes and 15-minute window make collision unlikely, add userId check if concerned

**Expiration calculation timezone issues** → OTP expires at wrong time → Use UTC timestamps consistently, [Date.now](http://Date.now)() + (15  *60*  1000) for milliseconds, or SQL NOW() + INTERVAL '15 minutes'

**Multiple OTPs valid simultaneously** → User confused by multiple codes → Delete all existing OTPs for userId before inserting new one, only latest code valid

**OTP deletion fails silently** → Old codes remain valid → Catch deletion errors, log them, but continue with new OTP creation

**OTP insert fails but email sent** → User receives code that's not in database → Insert OTP before sending email, if insert fails, don't send email

**Email sends but OTP not committed** → User can't verify with code in email → Use database transaction, commit before sending email, or accept eventual consistency

**Resend allows spam** → User requests 1000 OTPs in a minute → Rate limit resend to once per 60 seconds per user, track in database or memory

**Resend doesn't invalidate old code** → User has multiple valid codes → Delete old OTPs before generating new one in resend flow

**OTP sent to wrong email** → User registers with typo, can't verify → No fix in this chunk, user must register again with correct email

**Expired OTPs not cleaned up** → Database grows unbounded → Plan scheduled job to delete OTPs older than 24 hours, implement in production setup

**OTP visible in logs** → Security risk if logs leaked → Never log OTP codes, only log "OTP sent to user {userId}" events

**OTP sent in URL parameters** → Code leaked in browser history, server logs → Never include OTP in URLs, always require user to enter manually

**Transaction scope too large** → Lock contention, slow performance → Keep transaction minimal: delete old OTPs, insert new OTP, that's it, send email outside transaction

**User object not passed to email template** → Generic email, poor UX → Pass username to template, personalize email "Hi {username}, your verification code is..."

**Expiration time not communicated** → User doesn't know urgency → Include expiration in email "This code expires in 15 minutes"

**CreatedAt not set** → Can't debug when OTP was generated → Set createdAt explicitly or use database default NOW()

**UserId foreign key not enforced** → Orphaned OTPs for deleted users → Foreign key constraint should be ON DELETE CASCADE, OTPs deleted when user deleted

**OTP reuse after expiration** → User tries same code twice → Verification must check expiresAt timestamp, reject if now() > expiresAt

**Race condition on resend** → User clicks resend twice rapidly → Use transaction or unique constraint to prevent duplicate OTP inserts in same second

**No feedback on resend success** → User doesn't know if resend worked → Return clear success message "New code sent to {email}"

**Resend available before registration complete** → Edge case if registration async → Only allow resend if user exists in database with emailVerified=false

**Email service failure blocks registration** → User can't complete registration → Make email sending async and non-blocking, log failures, let user resend OTP manually

**OTP generation in tight loop** → Performance concern if bulk creating users → Single OTP generation is fast (~1ms), no optimization needed for MVP

**Internationalization not considered** → Email in wrong language → For MVP, English only is acceptable, plan i18n for email templates later

**Timezone displayed incorrectly** → User confused by expiration time → Display expiration as relative time ("15 minutes") not absolute timestamp

**OTP format ambiguous** → User confuses 0 and O, 1 and I → Use only digits 0-9, no letters, format as XXX-XXX or XXX XXX for readability

**Copy-paste doesn't work** → User frustrated typing code → Ensure code is selectable in email, consider auto-submit if user pastes code

**Email arrives after expiration** → Email delayed by 20 minutes, code already expired → Acceptable edge case, user can request new code, monitor email delivery times

**No user notification of verification status** → User doesn't know if already verified → Check emailVerified before generating OTP, skip if already verified

**OTP request without registration** → API endpoint exposed for spam → Require authenticated session to request OTP, verify user exists and is unverified

**Brute force OTP guessing** → Attacker tries all 1 million codes → Rate limit verification attempts (implemented in Chunk 3), 5 attempts per 15 minutes

## Testing Verification

### Existing Features Still Work

- [ ]  Registration creates user → emailVerified=false set correctly
- [ ]  Email service sends emails → Test email from Chunk 1 still works

### New Functionality Works

- [ ]  Register new user → OTP email received
- [ ]  Check otp_codes table → OTP record exists with correct userId
- [ ]  Check OTP code → Is 6 digits with leading zeros preserved
- [ ]  Check expiresAt → Timestamp is ~15 minutes from createdAt
- [ ]  Register another user → Different OTP code generated
- [ ]  Check email content → OTP code displayed prominently
- [ ]  Request resend OTP → Old OTP invalidated, new OTP sent
- [ ]  Try to resend immediately → Rate limit error shown
- [ ]  Wait 60 seconds, resend → New OTP sent successfully

### Edge Cases

- [ ]  Generate 10 OTPs in sequence → All are 6 digits, random distribution
- [ ]  Register user at 11:59:45 PM → Expiration crosses midnight correctly
- [ ]  OTP table has 100,000 records → Query for user's OTP is fast (indexed)
- [ ]  Email service fails → Registration completes, error logged
- [ ]  User deleted from database → OTPs cascade deleted
- [ ]  Request resend for non-existent user → Returns appropriate error

---

# Chunk 3: 🔐 OTP Verification Flow

Duration: 2-3 hours | Prerequisites: Chunk 2 completed (OTPs generated and stored in database)

## Quick Reference

**Builds:** Complete OTP verification system with code validation, expiration checking, rate limiting, and emailVerified flag update.

**Connects:** User enters OTP → Server Action validates → Check expiration → Check attempts → Update emailVerified → Delete OTP → Return success

**Pattern:** Server Action with multiple validation layers, rate limiting, and atomic database updates

**Watch For:**

1. Brute force attacks trying all 1 million possible codes
2. Race condition allowing multiple verification attempts after limit exceeded
3. OTP marked as used but emailVerified not updated, user stuck

## Context

### User Problem

Users need to enter received OTP code to verify email ownership and gain full access to app features.

### From Module Brief

- **Verification form**: User enters 6-digit code received via email
- **Validation checks**: Code exists, matches user, not expired, under attempt limit
- **Rate limiting**: 5 verification attempts per 15 minutes per user to prevent brute force
- **Success action**: Set emailVerified=true, delete used OTP, grant full access
- **Error states**: Invalid code, expired code, too many attempts, already verified
- **Post-verification redirect**: User redirected to feed after successful verification

## What's Changing

### New Additions

- **Verification Server Action**: Accepts userId (from session) and OTP code, orchestrates verification flow
- **OTP lookup query**: Finds OTP record matching userId and code
- **Expiration validation**: Checks if current time is before OTP's expiresAt timestamp
- **Rate limiting mechanism**: Tracks failed verification attempts per user in memory or database
- **Attempt tracking**: Increments attempt counter on failed verification, resets on success
- **Email verification update**: Sets users.emailVerified = true in transaction
- **OTP deletion**: Removes used OTP from database after successful verification
- **Verification response type**: TypeScript type for success, error with reason, attempts remaining
- **Already verified check**: Returns appropriate message if user already verified

### Modifications to Existing

- **Users table**: Updates emailVerified from false to true
- **otp_codes table**: Deletes OTP record after successful verification

### No Changes To

- **Registration flow**: Verification is separate step after registration
- **Email service**: No new emails sent during verification
- **Login flow**: Will be modified in Chunk 4 to enforce verification

## Data Flow

### Successful Verification Flow

1. User enters 6-digit OTP code in verification form
2. Form submission calls verification Server Action with code
3. Server Action extracts userId from authenticated session
4. Check if user already verified (emailVerified=true)
- If already verified → Return "Email already verified"
- If not verified → Continue
1. Query otp_codes table for matching userId AND code
- If no match → Increment failed attempts, return "Invalid code"
- If match found → Continue
1. Check OTP expiration: compare now() with otp.expiresAt
- If expired → Delete expired OTP, return "Code expired. Request a new code."
- If not expired → Continue
1. Begin database transaction
2. Update users SET emailVerified=true WHERE id=userId
3. Delete OTP record from otp_codes
4. Reset failed attempt counter for this user
5. Commit transaction
6. Return success {verified: true, redirect: '/feed'}
7. Final state: User email verified, can access full app features

### Failed Verification Flow

1. User enters incorrect OTP code
2. Verification Server Action queries for userId + code
3. No matching OTP found
4. Increment failed attempt counter for this user
5. Check attempt count
- If < 5 attempts → Return error with attempts remaining "Invalid code. {X} attempts remaining."
- If >= 5 attempts → Lock user temporarily, return "Too many attempts. Please wait 15 minutes."
1. Final state: User must try again or wait for lockout to expire

### Expired Code Flow

1. User enters OTP code that was valid but expired
2. Verification Server Action finds matching OTP
3. Expiration check: now() > otp.expiresAt
4. Delete expired OTP from database (cleanup)
5. Return error "Code expired. Please request a new code."
6. Final state: User must request new OTP via resend

### Rate Limit Lockout Flow

1. User has made 5 failed verification attempts
2. Rate limiter tracks attempts with timestamps
3. User tries to verify again
4. Server Action checks attempt count and timestamps
5. If most recent 5 attempts within 15-minute window → Return "Too many attempts. Try again in {X} minutes."
6. If 15 minutes passed since first attempt → Reset counter, allow new attempts
7. Final state: User locked out temporarily or counter reset

## Things to Watch For

**Brute force vulnerability** → Attacker tries all 1 million codes → Implement strict rate limiting: 5 attempts per 15 minutes per user, consider IP-based limiting for additional protection

**Rate limit per IP vs per user** → User on shared IP blocked by other users' attempts → Use per-user rate limiting primarily, consider IP limiting as secondary protection against distributed attacks

**Rate limit state in memory** → State lost on server restart → For MVP, in-memory rate limiting is acceptable, plan Redis or database storage for production

**Race condition on attempt counter** → Concurrent requests bypass rate limit → Use atomic increment in database or Redis, or accept minor race condition risk for MVP

**No rate limit reset** → User locked out forever after 5 attempts → Reset counter after 15 minutes or on successful verification

**Timing attack on code validation** → Comparison reveals correct digit positions → Use constant-time comparison for OTP codes, though impact is minimal with rate limiting

**OTP deleted before emailVerified updated** → User verified in otp_codes but not in users table → Use transaction wrapping both operations, commit atomically

**Transaction timeout** → Long-running transaction locks tables → Keep transaction minimal: update users, delete OTP, that's it

**emailVerified update fails silently** → User thinks verified but isn't → Check affected rows count, if 0 then user not found or already updated

**Multiple OTPs match** → Should be impossible but handle gracefully → Query should only return one OTP for userId + code combination, use LIMIT 1 if paranoid

**Used OTP not deleted** → User can verify multiple times with same code → Delete OTP immediately after successful verification in same transaction

**Expired OTP not deleted** → Database accumulates expired codes → Delete expired OTP when found during verification, also plan cleanup job

**Case sensitivity on code** → User enters code in mixed case → OTP codes are numeric only, no case sensitivity issue, but trim whitespace from input

**Whitespace in user input** → User enters "12 34 56" and fails → Trim and remove all whitespace from input before comparison

**User not authenticated** → Can't get userId from session → Verification requires authenticated session (user just registered), redirect to login if session missing

**User deleted during verification** → Foreign key error on update → Handle gracefully, return "User not found" error

**Verification response exposes too much** → Attacker learns system internals → Return generic errors, detailed logging server-side only

**Attempts counter never resets** → User with typo locked out permanently → Reset counter on successful verification or after 15-minute window

**Account takeover via OTP reuse** → Attacker intercepts code, uses before legitimate user → OTP is single-use, deleted after verification, rate limiting prevents brute force

**No notification of successful verification** → User doesn't know verification complete → Return clear success message and redirect to feed

**Redirect happens before state update** → Race condition, emailVerified not committed → Ensure database commit completes before redirect response

**Error message reveals if email exists** → Verification endpoint used to enumerate users → Only allow verification for currently authenticated user, no arbitrary userId input

**Lockout too aggressive** → Legitimate user makes typos, locked out → 5 attempts is reasonable balance, communicate clearly "Invalid code. 3 attempts remaining."

**Lockout too permissive** → Attacker has unlimited time to try 5 codes, wait, try 5 more → 5 per 15 minutes is reasonable for 6-digit codes (1 million possibilities)

**Clock skew affects expiration** → OTP expires immediately or never expires → Use server time consistently, don't trust client time

**Timezone confusion** → Expiration calculated in local time not UTC → Store all timestamps in UTC, calculate expiration in UTC

**Concurrent verification attempts** → Race condition on emailVerified update → Database handles with WHERE emailVerified=false, only first succeeds

**User verifies on multiple devices** → First device succeeds, second device shows "already verified" → This is correct behavior, communicate clearly "Email already verified"

**No audit log of verification** → Can't debug verification issues → Log successful verifications with userId and timestamp (no OTP code logged)

**Failed attempts not logged** → Can't detect brute force patterns → Log failed attempts with userId, attempts remaining, timestamp

**OTP code in error messages** → Security risk → Never echo back the user's entered code in error messages

**Integer comparison on string OTP** → Type coercion causes bugs → Ensure both stored OTP and input OTP are strings, use === for comparison

**Input validation missing** → Non-numeric input causes errors → Validate input is 6 digits only, reject immediately if not

**SQL injection via OTP input** → Database compromised → Drizzle uses parameterized queries, but validate input is numeric before query

**Verification bypassed via API manipulation** → Attacker sets emailVerified directly → Ensure only verification Server Action can update emailVerified, validate in middleware

**No cooldown after lockout** → User retries immediately after 15 minutes → After lockout expires, user gets fresh 5 attempts, this is acceptable

**Lockout affects all users** → Global rate limit hits everyone → Rate limit per user, not globally

**Admin can't bypass verification** → Admin account locked out → Consider allowing admins to bypass or have infinite attempts (security risk, avoid for MVP)

**Verification state not persisted** → Server restart resets attempts → In-memory tracking is acceptable for MVP, attempts reset on restart (user gets fresh tries)

**Email verification required for password reset** → User locked out of account → Password reset will send OTP to email, verify user receives it (implemented in Module 12)

## Testing Verification

### Existing Features Still Work

- [ ]  Registration generates OTP → User receives code via email
- [ ]  Resend OTP works → New code generated and sent

### New Functionality Works

- [ ]  Enter correct OTP → emailVerified set to true, redirected to feed
- [ ]  Check users table → emailVerified changed from false to true
- [ ]  Check otp_codes table → Used OTP deleted from database
- [ ]  Enter incorrect OTP → Error: "Invalid code" with attempts remaining
- [ ]  Enter OTP 5 times incorrectly → Locked out: "Too many attempts"
- [ ]  Wait 15 minutes, try again → Attempts reset, can verify again
- [ ]  Enter expired OTP → Error: "Code expired. Request a new code."
- [ ]  Verify already-verified user → Error: "Email already verified"
- [ ]  Enter OTP with spaces → Whitespace stripped, verification works
- [ ]  Enter valid OTP twice → First succeeds, second shows "already verified"

### Edge Cases

- [ ]  Enter OTP with leading zeros (001234) → Matches correctly
- [ ]  Attempt verification without session → Redirected to login
- [ ]  Verification during database downtime → Clear error message
- [ ]  Two users with same OTP (different userId) → Each can verify independently
- [ ]  Register, wait 16 minutes, try to verify → Expired error shown
- [ ]  Failed attempt counter at 4, wait 15 minutes → Counter resets, 5 attempts available
- [ ]  Verify on mobile while registration on desktop → Works (session shared)

---

# Chunk 4: 🎨 Verification UI & Enforcement

Duration: 2-3 hours | Prerequisites: Chunk 3 completed (Verification logic works, can verify OTPs)

## Quick Reference

**Builds:** User-facing verification form with OTP input, resend functionality, enforcement preventing unverified users from posting/liking/commenting, and read-only mode for feed.

**Connects:** Verification page → 6-digit input → Verification Server Action → Success (unlock features) or Error display | Protected actions → Check emailVerified → Block with notice

**Pattern:** Client Component for interactive form with Server Component enforcement wrapper checking verification status

**Watch For:**

1. Verification check bypassed by manipulating client state
2. Read-only mode not actually preventing actions
3. Poor mobile UX for entering 6-digit code

## Context

### User Problem

Users need intuitive interface to enter OTP code and understand verification status, with clear communication when actions are blocked due to unverified email.

### From Module Brief

- **Verification page**: Dedicated page for OTP entry after registration
- **OTP input**: 6-digit input field optimized for numeric entry
- **Resend button**: Allow requesting new code with rate limiting feedback
- **Error display**: Clear errors for invalid code, expired code, too many attempts
- **Success feedback**: Clear indication when verification succeeds
- **Read-only mode**: Unverified users can view feed and profiles but cannot interact
- **Action blocking**: Prevent post creation, likes, comments until verified
- **Verification prompts**: Show "Verify email to unlock this feature" messages

## What's Changing

### New Additions

- **Verification page**: Server Component at /verify route rendering verification form
- **OTP input component**: Client Component with 6-digit numeric input, auto-focuses, auto-submits on complete
- **Verification form handler**: Connects to verification Server Action from Chunk 3
- **Resend button component**: Calls resend Server Action, shows countdown during cooldown
- **Success state component**: Displays success message and redirects after verification
- **Verification banner**: Persistent banner on all pages for unverified users prompting verification
- **Email verification check utility**: Helper function to get current user's verification status
- **Action blocking middleware**: Checks emailVerified before allowing posts, likes, comments
- **Protected action wrapper**: Higher-order function that wraps actions requiring verification
- **Verification prompt modal**: Shows when unverified user tries restricted action
- **Read-only feed indicators**: Visual indicators showing user is in read-only mode

### Modifications to Existing

- **Registration flow**: Redirect to /verify after successful registration instead of /feed
- **Login flow**: Check emailVerified, redirect to /verify if false
- **Post creation**: Wrap in verification check, block if unverified
- **Like action**: Check verification, show prompt if unverified
- **Comment action**: Check verification, show prompt if unverified
- **Feed page**: Show verification banner for unverified users
- **Profile pages**: Allow viewing but block editing for unverified users

### No Changes To

- **Middleware**: Auth middleware already works, verification is additional check
- **Database schema**: No changes needed
- **Email service**: Uses existing email functionality

## Data Flow

### Verification Page Flow

1. User registers or logs in with unverified email
2. Redirected to /verify route
3. Server Component loads, checks if already verified
- If already verified → Redirect to /feed
- If not verified → Render verification form
1. Verification form (Client Component) displays 6-digit input
2. User enters each digit, form auto-advances cursor
3. After 6th digit entered, auto-submit triggers
4. Loading state shows (button disabled, spinner)
5. Call verification Server Action with code
6. Server Action returns response
- If success → Show success message, redirect to /feed after 2 seconds
- If error → Display error message, clear input, allow retry
- If locked out → Show lockout message with time remaining
1. Final state: User verified and redirected, or error shown with retry option

### Resend OTP Flow

1. User clicks "Didn't receive code? Resend" link
2. Resend button shows loading state
3. Call resend Server Action from Chunk 2
4. Server Action checks rate limit
- If too soon → Return error "Please wait {X} seconds"
- If allowed → Generate and send new OTP, return success
1. Update UI: show success message, disable resend for 60 seconds, show countdown
2. After 60 seconds, re-enable resend button
3. Final state: User receives new code, old code invalidated

### Read-Only Mode Enforcement Flow

1. Unverified user navigates to feed
2. Server Component renders feed with posts
3. Verification banner appears: "Verify your email to unlock all features"
4. User sees posts but like/comment buttons disabled or hidden
5. User clicks "Create Post" button
6. Protected action wrapper checks emailVerified
- If false → Show modal "Please verify your email to post"
- If true → Allow post creation
1. Modal provides link to /verify page
2. Final state: User understands limitation and path to unlock

### Action Blocking Flow

1. User attempts to like a post
2. Client-side check: is user verified?
- If verified → Execute like Server Action
- If not verified → Show verification prompt
1. Prompt displays: "Verify your email to interact with posts"
2. User clicks "Verify Now" in prompt
3. Navigate to /verify page
4. After verification, return to previous page, action enabled
5. Final state: User can now like, comment, post

## Things to Watch For

**Client-side check bypassed** → User disables JavaScript, bypasses verification → Always check emailVerified in Server Actions, never trust client-only checks

**Server Action doesn't check verification** → Unverified user can post by calling API directly → Every post/like/comment Server Action must check current user's emailVerified flag

**Verification status cached** → User verifies but cached status shows unverified → Revalidate cache after verification, use revalidatePath('/feed') after emailVerified update

**OTP input not numeric keyboard** → Mobile shows full keyboard not number pad → Use inputMode="numeric" on input to show numeric keyboard on mobile

**OTP input allows non-digits** → User enters letters, causes errors → Use pattern="[0-9]*" and validate input only accepts digits 0-9

**No auto-focus** → User must click input after page loads → Auto-focus first digit input on mount for better UX

**No auto-advance** → User must tab between inputs → Auto-advance to next input after digit entered, improves mobile UX

**Auto-submit too aggressive** → Triggers before user finishes → Only auto-submit after all 6 digits entered, provide explicit Submit button as alternative

**Input not clearable** → User makes typo, stuck → Provide Clear button or allow backspace to clear inputs

**Copy-paste doesn't work** → User can't paste code from email → Detect paste event, extract 6 digits, populate inputs automatically

**Loading state not shown** → User clicks submit multiple times → Disable inputs and button during verification, show spinner

**Error not cleared on retry** → Old error persists with new input → Clear error state when user starts typing new code

**Success message not clear** → User doesn't know verification succeeded → Show prominent success message "Email verified! Redirecting..." with checkmark icon

**Redirect too fast** → User doesn't see success message → Wait 2 seconds after showing success before redirecting

**Redirect too slow** → User waits unnecessarily → 2-second delay is good balance, test with real users

**Resend button always enabled** → User spams resend, hits rate limit → Disable resend for 60 seconds after each send, show countdown timer

**Resend cooldown not enforced** → Rate limit bypassed on client → Server-side rate limit in resend Server Action is authoritative, client countdown is UX enhancement

**No feedback on resend success** → User doesn't know if resend worked → Show toast "New code sent to {email}" after successful resend

**Verification banner too intrusive** → User annoyed, closes banner, forgets to verify → Make banner persistent (can't close), but not blocking (doesn't prevent viewing content)

**Banner shown to verified users** → Confusion or bug appearance → Only show banner if emailVerified = false, hide for verified users

**No link to verification from banner** → User sees banner but doesn't know how to verify → Include "Verify Now" button in banner that navigates to /verify

**Prompt modal blocks entire app** → User can't navigate away → Make modal dismissible, user can close and verify later, remember they chose to skip

**Action blocking inconsistent** → Some features blocked, others not → Audit all interactive features: post, like, comment, follow must all check verification

**Edit profile blocked** → User can't upload profile picture until verified → Per Master Spec, profile editing happens in Module 4, verify if should be blocked or allowed

**Following/unfollowing blocked** → Social features unavailable → Follow system in Module 9, decide if should require verification (likely yes)

**Viewing profiles blocked** → Too restrictive → Allow viewing profiles and feed without verification (read-only mode), block only mutations

**Search blocked** → User can't discover content → Allow search for unverified users, block only actions

**Admin actions blocked** → Admin can't moderate until verified → Consider allowing admin to skip verification or auto-verify admin accounts

**Verification status not reactive** → User verifies in another tab, current tab doesn't update → Acceptable for MVP, user can refresh, consider WebSocket updates later

**Deep link after verification broken** → User verifies from /verify, always redirects to /feed → Use returnUrl parameter to remember where user came from, redirect back after verification

**Verification required notification spam** → User sees prompt on every action → Show prompt once per session, remember user dismissed it (client-side state)

**No mobile optimization** → Form hard to use on small screens → Test on actual mobile devices, ensure touch targets are large enough

**Accessibility issues** → Screen readers don't announce state → Add ARIA labels, announce when code is invalid, when locked out, when verified

**Keyboard navigation broken** → Can't tab through inputs → Ensure proper tab order, Enter submits form, Escape clears

**Input styling unclear** → User doesn't know which digit to enter → Highlight active input, show clear focus state, use distinct boxes for each digit

**Error message not specific** → Generic "Invalid code" doesn't help user → Provide specific errors: "Code expired", "Incorrect code", "Too many attempts"

**Lockout time not communicated** → User doesn't know how long to wait → Show "Try again in {X} minutes" with countdown

**No way to change email** → User entered wrong email, can't verify → Allow changing email address (requires new OTP to new address), implement in profile settings

**Verification skippable** → User finds way to bypass → No skip option, verification is required per spec, only viewing is allowed without verification

**Social proof missing** → User doesn't trust email → Show "Check your spam folder" tip, show sender address, provide support link

**No back button** → User stuck on verification page → Allow navigating to feed (read-only mode), verification banner reminds to verify

## UX Specification

### User Flow

- **Registration → Verification**: Register → Redirected to /verify → Enter OTP → Verified → Redirect to /feed
- **Resend Code**: On /verify → Click "Resend" → New code sent → Enter new code → Verified
- **Action Blocked**: Try to like post → Prompt appears → Click "Verify Now" → Verify → Return to feed → Can like

### Empty States

- Verification page shows: "Check your email", "Enter the 6-digit code sent to {email}"
- If no code received: "Didn't receive code? Resend"

### Loading States

- OTP inputs disabled with spinner during verification
- Resend button shows countdown "Resend in {X}s" during cooldown
- Success state shows checkmark and "Verifying..." before redirect

### Error States

- Invalid code: Red error below inputs "Invalid code. {X} attempts remaining."
- Expired code: "Code expired. Please request a new code."
- Locked out: "Too many attempts. Try again in {X} minutes."
- Network error: "Connection error. Please try again."

### Responsive Behavior

- Mobile: Full-width form, large tap targets for digit inputs, numeric keyboard
- Tablet: Centered form, same as desktop
- Desktop: Centered card with clear instructions, standard keyboard input

## Testing Verification

### Existing Features Still Work

- [ ]  Registration creates user → Redirected to /verify
- [ ]  Verification Server Action works → Can verify OTP
- [ ]  Resend OTP works → New code generated

### New Functionality Works

- [ ]  Visit /verify page → Form loads with 6 digit inputs
- [ ]  Enter valid OTP → Success message shown, redirected to /feed
- [ ]  Verification banner shown → Appears on feed for unverified users
- [ ]  Banner has "Verify Now" button → Navigates to /verify
- [ ]  Try to create post while unverified → Blocked with prompt
- [ ]  Try to like post while unverified → Prompt shown "Verify to interact"
- [ ]  Try to comment while unverified → Blocked with verification message
- [ ]  Click "Resend Code" → New code sent, button disabled for 60 seconds
- [ ]  Resend cooldown countdown → Shows "Resend in {X}s"
- [ ]  After verification → Banner disappears, all features unlocked
- [ ]  Enter invalid code → Error shown with attempts remaining
- [ ]  5 invalid attempts → Locked out with time remaining shown

### Edge Cases

- [ ]  Paste 6-digit code → All inputs populated automatically
- [ ]  Backspace on empty input → Focus moves to previous input
- [ ]  Auto-submit after 6th digit → Verification triggered automatically
- [ ]  View feed while unverified → Can see posts, like/comment disabled
- [ ]  View profile while unverified → Can see content, actions disabled
- [ ]  Already verified user visits /verify → Redirected to /feed
- [ ]  Enter code with spaces "12 34 56" → Spaces stripped, verifies correctly
- [ ]  Use on mobile device → Numeric keyboard appears, inputs are tappable

---

## Feature Acceptance Tests

**From Module Brief QA Criteria:**

Run these after all chunks complete to verify the full feature works.

**Core Tests:**

- [ ]  Register new user → OTP email received within 30 seconds
- [ ]  Enter correct OTP → emailVerified set to true, user gains full access
- [ ]  Enter incorrect OTP → Error: "Invalid or expired code"
- [ ]  Wait 16 minutes → try old OTP → Error: "Invalid or expired code"
- [ ]  Click "Resend OTP" → New email received, old code no longer works
- [ ]  Unverified user tries to create post → Blocked with clear message

**Edge Cases:**

- [ ]  Request OTP 3 times in a row → Only the 3rd code works
- [ ]  Enter OTP with leading/trailing spaces → Still validates correctly
- [ ]  Try to verify with another user's OTP → Validation fails
- [ ]  User verifies, logs out, logs back in → Still verified (no re-verification needed)

**Integration Tests:**

- [ ]  Register → receive email → enter code → verification succeeds → can post
- [ ]  Register → close browser → reopen → still on /verify → enter code → works
- [ ]  Register → wait 20 minutes → code expired → request new → new code works
- [ ]  Unverified user browses feed → sees content but can't interact
- [ ]  User verifies → banner disappears → all actions unlocked immediately