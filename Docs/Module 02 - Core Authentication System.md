# Feature: Core Authentication System

**Core Problem:** Enable users to create accounts and securely log in/out, establishing user identity for all subsequent features (without email verification initially for faster testability).

**Total Chunks:** 5

**Total Estimated Duration:** 14-18 hours

**Feature Tracker Type:** New Feature

---

## Chunk Sequence Overview

| Chunk | Name | Category | Duration | Prerequisites |
| --- | --- | --- | --- | --- |
| 1 | Auth Utilities & JWT Infrastructure | 🔐 | 2-3 hrs | Module 1 (Database schema with users table exists) |
| 2 | User Registration Flow | 🔐 | 3-4 hrs | Chunk 1 (JWT utilities and bcrypt configured) |
| 3 | Login & Logout Flow | 🔐 | 2-3 hrs | Chunk 2 (Registration working, users can be created) |
| 4 | Auth Middleware & Route Protection | 🔐 | 3-4 hrs | Chunk 3 (Login sets JWT cookie successfully) |
| 5 | Registration & Login UI | 🎨 | 4-5 hrs | Chunks 2, 3, 4 (All auth logic functional) |

---

# Chunk 1: 🔐 Auth Utilities & JWT Infrastructure

Duration: 2-3 hours | Prerequisites: Module 1 completed (Database schema with users table exists in Neon)

## Quick Reference

**Builds:** Core authentication utilities including bcrypt password hashing, JWT token generation/verification with jose library, and secure cookie management functions.

**Connects:** Password input → bcrypt hashing → Secure storage | User credentials → JWT generation → HTTP-only cookie → Token verification on requests

**Pattern:** Utility-first auth pattern with jose for JWT, bcrypt for hashing, and Next.js cookies API for secure storage

**Watch For:**

1. JWT secret not cryptographically secure (must be 256-bit minimum for HS256)
2. Cookie attributes missing secure flags (httpOnly, secure, sameSite)
3. Token expiration not enforced consistently between generation and verification

## Context

### User Problem

Authentication requires secure password storage, tamper-proof identity tokens, and protection against common web vulnerabilities (XSS, CSRF) before any user-facing auth flows can be built.

### From Module Brief

- **Password hashing**: bcrypt with cost factor 12 for secure password storage
- **JWT generation**: jose library for standards-compliant JWT creation with user ID and role
- **Cookie security**: HTTP-only, secure, SameSite flags to prevent XSS and CSRF attacks
- **Session duration**: 30-day token expiration configurable via environment variable
- **Type safety**: Full TypeScript types for JWT payload and auth functions

## What's Changing

### New Additions

- **Password hashing utility**: Function that takes plain text password and returns bcrypt hash with cost factor 12, ensures consistent hashing across registration and password reset flows
- **Password verification utility**: Function that compares plain text password with stored hash using bcrypt's timing-safe comparison, prevents timing attacks
- **JWT generation utility**: Function that creates signed JWT containing userId and isAdmin flag with 30-day expiration, uses jose library for spec-compliant tokens
- **JWT verification utility**: Function that validates token signature and expiration, returns typed payload with userId and isAdmin, throws on invalid/expired tokens
- **Cookie setting utility**: Function that stores JWT in HTTP-only cookie with secure, sameSite=strict attributes, handles cookie options consistently
- **Cookie reading utility**: Function that extracts and returns JWT from request cookies, handles missing cookies gracefully
- **Cookie deletion utility**: Function that clears auth cookie for logout, sets max-age to 0 and empty value
- **Environment variable for JWT secret**: JWT_SECRET in .env.local with secure random 64-character string, used as signing key
- **TypeScript JWT payload type**: Interface defining structure of decoded token (userId: string, isAdmin: boolean, exp: number)
- **Auth error types**: Custom error classes for expired tokens, invalid signatures, missing tokens for clear error handling

### Modifications to Existing

- **Environment variables**: Add JWT_SECRET to .env.local and .env.example with generation instructions
- **.env.example**: Document that JWT_SECRET must be cryptographically random, provide generation command

### No Changes To

- **Database schema**: Auth utilities don't modify database structure
- **UI components**: No user-facing changes in this chunk
- **Next.js configuration**: Auth utilities are pure functions

## Data Flow

### Password Hashing Flow

1. User provides plain text password during registration
2. Hashing utility receives password string
3. bcrypt generates salt and hashes password with cost factor 12
4. Hashing completes after ~100-200ms (intentionally slow for security)
- If successful → Returns 60-character bcrypt hash string
- If error → Throws with bcrypt error message
1. Final state: Hash ready to store in users.passwordHash column

### Password Verification Flow

1. User provides plain text password during login
2. Application retrieves stored hash from database
3. Verification utility receives plain text and hash
4. bcrypt performs timing-safe comparison
- If match → Returns true
- If no match → Returns false (do not reveal why)
- If error → Throws with bcrypt error message
1. Final state: Boolean indicating valid credentials

### JWT Generation Flow

1. User successfully authenticates (registration or login)
2. Application has userId and isAdmin flag from database
3. Generation utility creates payload object with userId, isAdmin, exp (30 days from now)
4. jose signs payload with JWT_SECRET using HS256 algorithm
5. Compact JWT string generated (header.payload.signature format)
- If successful → Returns signed JWT string (~200-300 characters)
- If error → Throws with signing error
1. Final state: JWT ready to store in cookie

### JWT Verification Flow

1. Request arrives with cookie containing JWT
2. Cookie reading utility extracts token string
3. Verification utility receives JWT string
4. jose validates signature against JWT_SECRET
5. jose checks expiration timestamp against current time
- If valid and not expired → Returns decoded payload with userId and isAdmin
- If invalid signature → Throws InvalidTokenError
- If expired → Throws TokenExpiredError
- If malformed → Throws with parsing error
1. Final state: Typed payload with user identity

### Cookie Management Flow

1. JWT generated after successful authentication
2. Cookie setting utility receives JWT string
3. Utility constructs cookie with httpOnly=true, secure=true (production), sameSite=strict, maxAge=30 days, path=/
4. Next.js cookies API sets cookie in response headers
- If successful → Cookie sent to browser, stored by browser
- If error → Cookie not set, user not authenticated
1. For logout: Cookie deletion utility sets same cookie name with empty value and maxAge=0
2. Final state: Browser stores (or clears) authentication cookie

## Things to Watch For

**JWT secret too weak** → Tokens can be forged, complete auth bypass → Generate JWT_SECRET with cryptographically secure random generator (openssl rand -hex 32), minimum 64 characters, never use dictionary words or predictable patterns

**Bcrypt cost factor too low** → Passwords cracked quickly if database leaked → Use cost factor 12 as specified, lower values (10) are too fast, higher values (14+) cause noticeable delays on low-powered servers

**Bcrypt cost factor too high** → Registration and login become unacceptably slow → Cost 12 takes ~100-200ms which is acceptable, cost 14 takes ~400-800ms which may frustrate users, test on target hardware

**Password comparison not timing-safe** → Timing attacks reveal password length → Always use [bcrypt.compare](http://bcrypt.compare)(), never implement custom comparison or use === on hashes

**JWT algorithm confusion** → Attacker changes algorithm to 'none' or asymmetric variant → Explicitly specify algorithms=['HS256'] in jose verification options, reject tokens with other algorithms

**Token expiration not validated** → Expired tokens still accepted → jose validates exp claim automatically, but verify error handling catches expired tokens and returns clear error

**Token expiration timezone issues** → Tokens expire at wrong time → Always use Unix timestamps (seconds since epoch) for exp claim, jose handles this correctly with Math.floor([Date.now](http://Date.now)() / 1000)

**Cookie httpOnly not set** → XSS attacks can steal token → Must set httpOnly: true so JavaScript cannot access document.cookie, prevents XSS token theft

**Cookie secure not set in production** → Man-in-middle attacks intercept token → Set secure: true in production (process.env.NODE_ENV === 'production') so cookie only sent over HTTPS

**Cookie sameSite not set** → CSRF attacks possible → Set sameSite: 'strict' to prevent cookie being sent on cross-origin requests, blocks CSRF attacks

**Cookie path too restrictive** → Token not available on all routes → Set path: '/' so cookie is sent with requests to all paths in application

**Cookie domain set incorrectly** → Cookie not sent or sent to wrong domain → Don't set domain attribute, let browser default to current domain for maximum compatibility

**Multiple cookies with same name** → Unpredictable which cookie is read → Always clear old cookie before setting new one, use consistent naming (e.g., 'auth_token')

**JWT payload includes sensitive data** → Token visible to client if ever logged → Never include passwords, emails, personal data in JWT, only userId and role flags

**JWT payload too large** → Cookie size exceeds 4KB limit → Keep payload minimal (userId, isAdmin, exp only), browser may reject oversized cookies

**Token refresh not planned** → Users logged out after 30 days with no warning → 30-day expiration is per spec, consider implementing token refresh later if sessions need extension

**Environment variable not validated at startup** → App runs without JWT_SECRET → Add startup check that JWT_SECRET exists, is string, and is at least 64 characters

**JWT_SECRET exposed to client** → Tokens can be forged → Never use NEXT_PUBLIC_ prefix on JWT_SECRET, only accessible in server code

**Bcrypt synchronous functions used** → Blocks event loop during hashing → Use bcrypt.hash() and [bcrypt.compare](http://bcrypt.compare)() (async), not bcrypt.hashSync() or bcrypt.compareSync()

**Error messages reveal too much** → Failed login reveals whether email exists → Always return generic 'Invalid credentials' message, never 'Email not found' or 'Incorrect password'

**Password hashing not awaited** → Registration succeeds with undefined hash → bcrypt.hash() returns Promise, must await or .then() before using result

**Token verification errors not caught** → Unhandled promise rejections crash app → Wrap jose.jwtVerify() in try-catch, handle ExpiredSignatureError, JWSSignatureVerificationFailed, etc.

**Clock skew not handled** → Tokens rejected immediately after creation → jose allows small clock skew by default, but verify exp timestamp has reasonable buffer (use Math.floor([Date.now](http://Date.now)() / 1000) + 30  *24*  60 * 60)

**Token issued-at not set** → Can't determine token age → Include iat claim in payload for debugging and audit logs, jose adds automatically if generateKey is used

**Subject claim not used** → Token doesn't identify subject properly → Set sub claim to userId for JWT best practices, more explicit than custom userId field

**Audience claim not validated** → Token intended for different service accepted → Consider adding aud claim if app will have multiple services, validate in verification

**Issuer claim not set** → Token origin unclear → Set iss claim to application identifier for multi-app environments, validate in verification

**Token signing key rotation not planned** → Compromised key can't be changed without logging everyone out → Acceptable for MVP, plan key rotation strategy for production (e.g., accept tokens signed with previous key for grace period)

**bcrypt rounds stored in hash** → Hash format determines rounds → bcrypt includes salt and rounds in hash string automatically, don't store separately

**Password length not validated** → Very long passwords cause DOS via bcrypt → Limit password length to 72 bytes (bcrypt max), reject longer passwords before hashing

**Empty password accepted** → Users can register with no password → Validate password is non-empty string before hashing, though bcrypt will hash empty strings

**Timing attack on username** → Attacker determines valid usernames → Hash a dummy password on failed username lookup to keep timing consistent with valid user path

**Token verification caches incorrectly** → Stale tokens accepted after logout → Don't cache verification results, always verify token freshness on each request

**Cookie deletion incomplete** → Logout doesn't fully clear token → Set cookie with empty value, maxAge: 0, and expires: new Date(0) to ensure deletion across browsers

**Development vs production cookie differences** → Auth works in dev but fails in production → Test with secure: true in production-like environment, verify HTTPS is available

**Next.js cookies API version changes** → Breaking changes in Next.js updates → Use cookies() from next/headers for app router, import from correct location

**Server Actions don't have access to cookies** → Can't read auth token → Use cookies() from next/headers in Server Actions, works differently than Pages Router

**TypeScript types not strict enough** → Runtime errors from wrong types → Define strict types for JWT payload, use branded types if needed to prevent userId being used as regular string

**Error handling inconsistent** → Some errors caught, others propagate → Establish error handling pattern: auth errors return null/false, throw only on unexpected errors

**Logging includes sensitive data** → Passwords or tokens in logs → Never log passwords, tokens, or hashes, only log user IDs and action types

**Rate limiting not implemented** → Brute force attacks succeed → Not in this chunk, plan to add rate limiting middleware later

**Account lockout not implemented** → Unlimited login attempts possible → Not in this chunk, acceptable for MVP, plan lockout after N failed attempts

## Testing Verification

### Existing Features Still Work

- [ ]  Next.js app runs → No errors from new auth utilities
- [ ]  Database queries work → No conflicts with auth code

### New Functionality Works

- [ ]  Test password hashing → Hash password 'test123', verify hash is 60 characters starting with $2b$12$
- [ ]  Test password verification → Hash matches correct password, rejects incorrect password
- [ ]  Test password verification timing → Verify correct and incorrect passwords take similar time (~100-200ms)
- [ ]  Test JWT generation → Create token with test userId, verify token string is ~200-300 characters
- [ ]  Test JWT verification → Verify generated token returns correct userId and isAdmin
- [ ]  Test expired token → Create token with exp in past, verify throws TokenExpiredError
- [ ]  Test invalid signature → Modify token string, verify throws signature error
- [ ]  Test cookie setting → Set JWT in cookie, verify httpOnly, secure (prod), sameSite attributes
- [ ]  Test cookie reading → Set cookie, read back JWT string
- [ ]  Test cookie deletion → Delete cookie, verify no longer present
- [ ]  Test JWT_SECRET validation → Remove JWT_SECRET from env, verify clear error on startup

### Edge Cases

- [ ]  Hash very long password (1000 chars) → Completes without error or apply length limit
- [ ]  Hash empty string → Returns valid bcrypt hash
- [ ]  Verify password with wrong hash format → Throws clear error
- [ ]  Generate token without userId → TypeScript error or runtime validation error
- [ ]  Verify token with missing JWT_SECRET → Clear error message
- [ ]  Set cookie in Server Action → Cookie appears in browser devtools
- [ ]  Read cookie that doesn't exist → Returns undefined, doesn't throw
- [ ]  Generate token with isAdmin=undefined → Defaults to false

---

# Chunk 2: 🔐 User Registration Flow

Duration: 3-4 hours | Prerequisites: Chunk 1 completed (JWT utilities and bcrypt configured, can hash passwords and generate tokens)

## Quick Reference

**Builds:** Complete user registration system with email/username uniqueness validation, password hashing, user record creation, automatic login via JWT cookie, and comprehensive error handling.

**Connects:** Registration form data → Validation → Database uniqueness check → bcrypt hashing → User insert → JWT generation → Cookie setting → Redirect to feed

**Pattern:** Server Action pattern with optimistic database checks, atomic user creation, and automatic post-registration authentication

**Watch For:**

1. Race condition allowing duplicate emails/usernames between check and insert
2. User record created but JWT/cookie fails, leaving user in limbo state
3. SQL injection via username/email not prevented by Drizzle

## Context

### User Problem

New users need to create accounts by providing email, password, and username, with immediate feedback on validation errors and seamless login after successful registration.

### From Module Brief

- **Registration fields**: Email (validated format), Password (no restrictions per spec), Username (alphanumeric + underscore, unique)
- **Real-time validation**: Username uniqueness checked as user types
- **Email verification**: Set emailVerified=false initially, full verification in Module 3
- **Automatic login**: User receives JWT cookie and redirects to feed immediately after registration
- **Error states**: Clear messages for duplicate email, duplicate username, invalid email format

## What's Changing

### New Additions

- **Registration Server Action**: Async function that orchestrates entire registration flow, receives FormData with email, password, username
- **Email format validation**: Regex check for valid email pattern before database operations
- **Username format validation**: Regex check for alphanumeric + underscore only, no special characters or spaces
- **Uniqueness check queries**: Database queries to check if email or username already exists before attempting insert
- **User creation transaction**: Drizzle insert into users table with hashed password, emailVerified=false, isAdmin=false defaults
- **Post-registration authentication**: JWT generation and cookie setting immediately after user created
- **Registration response type**: TypeScript type for success (with redirect) or error (with field-specific messages)
- **Field-level error handling**: Distinguishes between email errors, username errors, and system errors for clear user feedback
- **Database error parsing**: Catches unique constraint violations and translates to user-friendly messages

### Modifications to Existing

- **Users table**: No schema changes, uses existing structure with email, username, passwordHash columns

### No Changes To

- **Auth utilities**: Registration uses utilities from Chunk 1, doesn't modify them
- **Database schema**: No migrations needed
- **UI**: Chunk 5 will build registration form UI

## Data Flow

### Registration Flow

1. User submits registration form with email, password, username
2. Server Action receives FormData, extracts fields
3. Email format validation with regex (RFC 5322 simplified)
- If invalid → Return error {field: 'email', message: 'Invalid email format'}
- If valid → Continue
1. Username format validation with regex (alphanumeric + underscore)
- If invalid → Return error {field: 'username', message: 'Username must contain only letters, numbers, and underscores'}
- If valid → Continue
1. Check email uniqueness: query users table WHERE email = ? (case-insensitive)
- If exists → Return error {field: 'email', message: 'Email already registered'}
- If not exists → Continue
1. Check username uniqueness: query users table WHERE username = ? (case-sensitive)
- If exists → Return error {field: 'username', message: 'Username taken'}
- If not exists → Continue
1. Hash password using bcrypt utility from Chunk 1
2. Begin database transaction
3. Insert user record: email, username, passwordHash, emailVerified=false, isAdmin=false, createdAt=now()
- If constraint violation (race condition) → Return error for duplicate field
- If success → User created with UUID generated
1. Commit transaction, get inserted user with ID
2. Generate JWT with userId and isAdmin=false
3. Set JWT in HTTP-only cookie
4. Return success {redirect: '/feed'}
- If any step fails → Rollback transaction, return appropriate error
1. Final state: User registered, authenticated, ready to use app

## Things to Watch For

**Race condition on uniqueness** → Two users register same email/username simultaneously, both checks pass, one insert fails → Catch database unique constraint violation error, parse error to determine which field (email or username), return appropriate user-friendly message

**Email case sensitivity** → User registers [john@email.com](mailto:john@email.com), can't login with [John@email.com](mailto:John@email.com) → Normalize email to lowercase before storing AND checking, use LOWER() in query or lowercase in application

**Username case sensitivity** → Users want 'JohnDoe' and 'johndoe' to be same user → Decision: keep usernames case-sensitive per Master Spec (username is permanent), document this behavior

**Email validation regex too strict** → Valid international emails rejected → Use simplified RFC 5322 regex that allows most valid formats, avoid overly complex regex that rejects edge cases

**Email validation regex too permissive** → Invalid emails like 'user@' accepted → Require @ symbol with characters on both sides and dot in domain part

**Username validation allows leading/trailing spaces** → Username ' john ' with spaces created → Trim username before validation and storage, reject if different after trim

**Password stored as plain text** → Catastrophic security failure → Always hash password with bcrypt before ANY database operation, never log or store plain text

**Password validation rules enforced** → Contradicts Master Spec (accept any password) → Don't enforce minimum length, special characters, etc., accept any non-empty password per spec

**Empty password accepted** → Users register with no password → Validate password field is non-empty string before hashing

**Very long password causes DOS** → bcrypt hangs on megabyte-sized password → Limit password to 72 bytes (bcrypt max) or reasonable limit like 1000 characters

**User ID not returned after insert** → Can't generate JWT → Drizzle insert().returning() returns inserted row with generated UUID, capture this in variable

**Transaction not used** → User inserted but JWT generation fails, orphaned user → Wrap insert in transaction if generating JWT in same operation, or accept that user exists but isn't logged in (can login normally)

**Transaction rolled back incorrectly** → User thinks registration failed but account was created → On JWT generation failure, don't rollback user insert, return error asking user to login

**emailVerified defaulted to true** → Users skip verification step → Explicitly set emailVerified: false in insert statement

**isAdmin accidentally set to true** → New user becomes admin → Explicitly set isAdmin: false in insert statement, never read from user input

**createdAt not set** → Timestamp null or wrong time → Use defaultNow() in schema or explicitly set createdAt: new Date() in insert

**Server Action doesn't revalidate** → UI doesn't update after registration → Call revalidatePath('/feed') if needed, though redirect clears cache

**Redirect uses client-side navigation** → User sees intermediate state → Use redirect() from next/navigation in Server Action for instant server-side redirect

**Error response doesn't include field** → UI can't show error next to correct field → Always include field: 'email' | 'username' | 'password' | 'general' in error response

**Multiple errors possible** → User sees only first error → Validate all fields upfront, return array of errors if multiple issues found

**Drizzle query returns undefined** → Uniqueness check fails silently → Check if query result is null/undefined vs empty array, handle both cases

**Database connection fails** → Registration appears to hang → Set reasonable timeout on database queries, catch connection errors and return system error

**Special characters in username** → Database error or XSS later → Validate username contains only alphanumeric + underscore + hyphen, block all other characters

**SQL injection via username** → Database compromised → Drizzle uses parameterized queries automatically, but verify no string concatenation in queries

**Error message reveals system details** → Information disclosure to attackers → Return generic 'Registration failed. Please try again.' for unexpected errors, log details server-side

**Success response includes password** → Password leaked to client → Never include password or passwordHash in response, only userId and redirect URL

**Token generation fails silently** → User registered but can't access app → If JWT generation fails after user insert, catch error and return message asking user to login manually

**Cookie setting fails** → User registered and has token but browser doesn't store it → Verify cookie size under 4KB, check cookie attributes don't conflict with browser settings

**Redirect fails** → User stuck on registration page after success → Wrap redirect() in try-catch, on failure return success with redirectUrl for client-side navigation

**Rate limiting not implemented** → Attacker creates thousands of accounts → Not in this chunk, plan to add rate limiting middleware later

**Email confirmation not sent** → Not implemented yet, coming in Module 3 → Document that emailVerified=false and verification happens in next module

**CAPTCHA not implemented** → Bot registrations possible → Acceptable for MVP, plan to add CAPTCHA if bot registrations become issue

**Username uniqueness not case-insensitive** → 'john' and 'John' both allowed, confusing → Per spec username is case-sensitive and permanent, document this

**Profile fields not collected** → Bio and profile picture missing → Per Module Brief these are added in Module 4 (User Profiles), registration only collects email, password, username

**Concurrent registrations cause deadlock** → Database locks conflict → Use appropriate transaction isolation level, test with concurrent requests

**Error handling inconsistent with Chunk 1** → Different error response formats → Use same error type/format as will be used for login in Chunk 3

**TypeScript types too loose** → Runtime errors from wrong field types → Define strict FormData types, validate at runtime if accepting user input

**No logging of registration events** → Can't debug registration issues → Log successful registrations (userId only) and failed attempts (no sensitive data) for monitoring

## Testing Verification

### Existing Features Still Work

- [ ]  Auth utilities from Chunk 1 work → Can hash passwords and generate JWTs
- [ ]  Database connection works → Can query and insert users

### New Functionality Works

- [ ]  Register with valid email, password, username → User created in database
- [ ]  Verify user record → Contains correct email, username, hashed password
- [ ]  Verify emailVerified = false → User requires verification later
- [ ]  Verify isAdmin = false → User is not admin
- [ ]  Verify createdAt set → Timestamp is recent
- [ ]  Verify JWT cookie set → Browser receives auth cookie with httpOnly flag
- [ ]  Verify automatic login → Can access protected routes immediately after registration
- [ ]  Register with duplicate email → Error: 'Email already registered'
- [ ]  Register with duplicate username → Error: 'Username taken'
- [ ]  Register with invalid email format → Error: 'Invalid email format'
- [ ]  Register with username containing spaces → Error about invalid characters
- [ ]  Register with empty password → Error about required field

### Edge Cases

- [ ]  Register with email in different case ([JOHN@EMAIL.COM](mailto:JOHN@EMAIL.COM) vs [john@email.com](mailto:john@email.com)) → Treated as duplicate
- [ ]  Register with username in different case (John vs john) → Both allowed (case-sensitive per spec)
- [ ]  Register with very long password (1000 chars) → Succeeds or rejects with clear error
- [ ]  Register with special characters in username (@#$) → Rejected with error
- [ ]  Two users register same email simultaneously → One succeeds, one gets duplicate error
- [ ]  Database connection lost during registration → Clear error message
- [ ]  JWT generation fails after user created → Error asks user to login

---

# Chunk 3: 🔐 Login & Logout Flow

Duration: 2-3 hours | Prerequisites: Chunk 2 completed (Registration working, users can be created in database)

## Quick Reference

**Builds:** Complete login and logout system with credential verification, JWT cookie management, and appropriate error handling for invalid credentials.

**Connects:** Login form → Email lookup → Password verification → JWT generation → Cookie setting → Redirect | Logout button → Cookie deletion → Redirect to login

**Pattern:** Server Action pattern for both login and logout with database query, bcrypt verification, and cookie manipulation

**Watch For:**

1. Login error messages reveal whether email exists in system
2. Timing differences between 'user not found' and 'wrong password' enable enumeration
3. Logout doesn't fully clear cookie in all browsers

## Context

### User Problem

Returning users need to log in with their email and password to access authenticated features, and need a way to log out when finished.

### From Module Brief

- **Login fields**: Email and password only (username not used for login)
- **Persistent login**: Session stays active until explicit logout (30-day token)
- **Error handling**: Generic 'Invalid credentials' message that doesn't reveal whether email exists
- **Logout**: Clears session cookie and redirects to login page
- **emailVerified check**: Not enforced in login yet (Module 3 will add verification flow)

## What's Changing

### New Additions

- **Login Server Action**: Async function that orchestrates login flow, receives FormData with email and password
- **User lookup query**: Database query to find user by email (case-insensitive)
- **Password verification**: Uses [bcrypt.compare](http://bcrypt.compare)() from Chunk 1 to verify password against stored hash
- **Timing-safe failure handling**: Hash dummy password on user-not-found to keep timing consistent with wrong-password case
- **Post-login authentication**: JWT generation and cookie setting on successful login
- **Login response type**: Success with redirect or error with generic message
- **Logout Server Action**: Clears auth cookie and redirects to login page
- **Login rate limiting setup**: Preparation for rate limiting (implemented later)

### Modifications to Existing

- **Users table**: No schema changes

### No Changes To

- **Registration flow**: Login is separate flow
- **Auth utilities**: Uses existing utilities from Chunk 1
- **UI**: Chunk 5 will build login form

## Data Flow

### Login Flow

1. User submits login form with email and password
2. Server Action receives FormData, extracts email and password
3. Normalize email to lowercase for lookup
4. Query database for user WHERE email = ? (case-insensitive)
- If user not found → Hash dummy password to maintain timing consistency, return error 'Invalid credentials'
- If user found → Continue
1. Verify password using [bcrypt.compare](http://bcrypt.compare)(providedPassword, user.passwordHash)
- If password incorrect → Return error 'Invalid credentials'
- If password correct → Continue
1. Generate JWT with [user.id](http://user.id) and user.isAdmin
2. Set JWT in HTTP-only cookie
3. Return success {redirect: '/feed'}
- If any server error → Return error 'Something went wrong. Please try again.'
1. Final state: User authenticated with JWT cookie, can access protected routes

### Logout Flow

1. User clicks logout button
2. Server Action called (no parameters needed)
3. Delete auth cookie by setting empty value with maxAge: 0
4. Return redirect to '/login'
5. Final state: User unauthenticated, cookie cleared from browser

### Timing-Safe User-Not-Found Flow

1. Email lookup returns no user
2. Generate and hash dummy password (e.g., 'dummy_password_12345')
3. Await hash completion (~100-200ms, same as real password verification)
4. Return 'Invalid credentials' error
5. Final state: Attacker can't determine if email exists based on response timing

## Things to Watch For

**User enumeration via error messages** → Attacker determines valid emails → Always return 'Invalid credentials' for both 'user not found' and 'wrong password', never 'Email not found' or 'Incorrect password'

**Timing attack reveals user existence** → Fast response for non-existent email, slow for wrong password → Hash dummy password when user not found to keep timing consistent with password verification path

**Dummy password not consistent** → Different random password each time changes timing → Use fixed dummy password string for all user-not-found cases

**Timing attack via database query time** → Query for non-existent email faster than existing email → Acceptable minor timing difference, database index ensures both queries are fast

**Email lookup case-sensitive** → User can't login with different case than registration → Normalize email to lowercase before querying (same as registration)

**Password comparison not timing-safe** → Timing reveals password similarity → Always use [bcrypt.compare](http://bcrypt.compare)(), never === or custom comparison

**Bcrypt compare returns undefined** → Login succeeds when it shouldn't → [bcrypt.compare](http://bcrypt.compare)() returns boolean, explicitly check === true

**Bcrypt compare not awaited** → Login flow continues before verification complete → [bcrypt.compare](http://bcrypt.compare)() returns Promise, must await

**JWT generation fails after password verified** → User can't login despite correct credentials → Catch JWT generation error, return 'Something went wrong' not 'Invalid credentials'

**Cookie setting fails** → JWT generated but browser doesn't receive it → Verify cookie size, attributes, check browser doesn't block third-party cookies in dev

**Redirect happens before cookie set** → Race condition, cookie not saved → Ensure cookie is set synchronously before redirect(), Next.js handles this correctly

**Logout cookie deletion incomplete** → User still authenticated after logout → Set cookie with empty value '', maxAge: 0, expires: new Date(0), same name and path as login cookie

**Logout doesn't invalidate token** → Old JWT still valid if extracted from cookie → Acceptable for MVP, token will expire in 30 days, implement token blacklist later if needed

**Logout in one tab doesn't affect others** → User logged out but other tabs stay authenticated → Expected behavior with stateless JWT, consider implementing token versioning or WebSocket for cross-tab logout

**Multiple login attempts tracked** → Need for rate limiting → Not implemented in this chunk, plan to add rate limiting middleware (5 attempts per 15 minutes per IP)

**Login works with unverified email** → Users can login before verifying email → Intentional per spec, Module 3 will add verification requirement

**Deleted user can still login** → User record deleted but token still valid → Query will fail to find user, login rejected appropriately

**Disabled user can login** → No user status field exists → Acceptable for MVP, consider adding 'status' enum field later for suspended/banned users

**Password never expires** → User keeps same password forever → Acceptable for MVP, consider password age tracking later

**No failed login tracking** → Can't detect brute force attacks → Log failed login attempts server-side for monitoring, implement lockout later

**Concurrent logins not limited** → User can login from unlimited devices → Acceptable with stateless JWT, implement device tracking later if needed

**Remember me option not implemented** → All sessions are 30 days → Acceptable per spec, consider adding optional shorter session later

**Login form doesn't prevent double submission** → Multiple Server Action calls on rapid clicks → Not handled in this chunk, UI chunk will disable button during submission

**Error response format different from registration** → Inconsistent error handling → Use same error type structure as Chunk 2 for consistency

**Redirect after login not configurable** → Always goes to /feed → Acceptable for MVP, consider adding 'returnTo' parameter later for deep linking

**Logout redirect not configurable** → Always goes to /login → Acceptable for spec

**Server Action doesn't revalidate** → Stale data in cache after login/logout → Call revalidatePath() or redirect() which clears cache

**No login event logging** → Can't audit successful logins → Log successful login events with userId and timestamp (no password) for security monitoring

**Database connection failure** → Login appears to hang → Set query timeout, catch connection errors, return generic error message

**Null password in database** → [bcrypt.compare](http://bcrypt.compare)() fails unexpectedly → Should not happen due to NOT NULL constraint, but handle gracefully

**User has isAdmin = null** → JWT payload has undefined isAdmin → Default to false in JWT generation if isAdmin is null/undefined

**TypeScript types not enforced** → Runtime errors from wrong types → Validate FormData fields are strings before using

**CORS issues in production** → Login works in dev but fails in prod → Ensure API routes and auth cookies work cross-domain if using different domains

**Login state not persisted across deployments** → JWT secret changes, all users logged out → Document that JWT_SECRET must remain constant, rotate carefully

**No CAPTCHA on login** → Brute force attacks possible → Acceptable for MVP, add CAPTCHA after N failed attempts later

## Testing Verification

### Existing Features Still Work

- [ ]  Registration still works → Can create new users
- [ ]  Auth utilities work → Can hash and verify passwords

### New Functionality Works

- [ ]  Login with correct email and password → JWT cookie set, redirected to feed
- [ ]  Verify JWT payload → Contains correct userId and isAdmin flag
- [ ]  Access protected route after login → Not redirected to login page
- [ ]  Login with wrong password → Error: 'Invalid credentials'
- [ ]  Login with non-existent email → Error: 'Invalid credentials'
- [ ]  Login with email in different case → Works (case-insensitive)
- [ ]  Verify timing consistency → Login with wrong email and wrong password take similar time
- [ ]  Logout after login → Cookie cleared, redirected to login page
- [ ]  Try to access protected route after logout → Redirected to login page
- [ ]  Login again after logout → Works normally

### Edge Cases

- [ ]  Login with empty email → Appropriate error
- [ ]  Login with empty password → Appropriate error
- [ ]  Login with very long password → Handles gracefully
- [ ]  Logout when not logged in → Doesn't error, redirects to login
- [ ]  Multiple logout calls → Idempotent, no errors
- [ ]  Login with spaces in email → Trimmed and works
- [ ]  Logout from multiple tabs → All tabs become unauthenticated on next request

---

# Chunk 4: 🔐 Auth Middleware & Route Protection

Duration: 3-4 hours | Prerequisites: Chunk 3 completed (Login sets JWT cookie successfully, can authenticate users)

## Quick Reference

**Builds:** Next.js middleware that validates JWT on every request, protects authenticated routes, redirects unauthenticated users to login, and exposes user identity to protected pages.

**Connects:** Every request → Middleware intercepts → Reads cookie → Verifies JWT → Allows (with user context) or Redirects to login

**Pattern:** Next.js middleware with JWT verification, path matching for public vs protected routes, and request header injection for user context

**Watch For:**

1. Middleware runs on every request including static assets (performance issue)
2. Middleware matcher doesn't cover all protected routes
3. User context not properly passed to Server Components and Server Actions

## Context

### User Problem

Authenticated routes must verify user identity on every request and redirect unauthenticated users to login before they can access protected content.

### From Module Brief

- **Route protection**: Authenticated user visits any page → middleware validates JWT → allows access to protected routes
- **Unauthenticated redirect**: Unauthenticated user visits protected route → middleware redirects to login
- **Public routes**: Login and registration pages accessible without authentication
- **User context**: User ID and role available in all protected Server Components and Server Actions

## What's Changing

### New Additions

- **Middleware file**: middleware.ts at project root (not in app/) that runs before all requests
- **JWT verification in middleware**: Extracts token from cookie, verifies signature and expiration using utilities from Chunk 1
- **Route matching configuration**: Defines which paths require authentication vs which are public
- **Redirect logic**: Unauthenticated users visiting protected routes redirected to /login with returnUrl parameter
- **Authenticated user redirect**: Authenticated users visiting /login or /register redirected to /feed
- **Request header injection**: Adds user ID and isAdmin flag to request headers for downstream consumption
- **User context utility**: Helper function to extract user from request headers in Server Components and Server Actions
- **Protected route helper**: Utility that wraps Server Components to enforce authentication and provide user context
- **Middleware config export**: matcher config to exclude static assets and API routes from middleware

### Modifications to Existing

- **Project structure**: Add middleware.ts at root level
- **Environment variables**: No new variables needed

### No Changes To

- **Auth utilities**: Middleware uses existing JWT verification from Chunk 1
- **Database**: No schema changes
- **Login/logout flows**: Middleware is passive verification layer

## Data Flow

### Protected Route Access Flow (Authenticated)

1. User makes request to protected route (e.g., /feed)
2. Middleware intercepts request before reaching route handler
3. Middleware reads auth cookie from request
4. Middleware verifies JWT using utility from Chunk 1
5. JWT valid and not expired → Extract userId and isAdmin from payload
6. Middleware adds user info to request headers (x-user-id, x-user-is-admin)
7. Middleware allows request to continue to route handler
8. Server Component or Server Action reads user context from headers
- If successful → Page renders with user context
- If JWT invalid → Treated as unauthenticated, redirected to login
1. Final state: Protected page accessible with user identity available

### Protected Route Access Flow (Unauthenticated)

1. Unauthenticated user makes request to protected route (e.g., /feed)
2. Middleware intercepts request
3. Middleware reads auth cookie from request
4. Cookie missing or JWT verification fails
5. Middleware creates redirect response to /login?returnUrl=/feed
6. User browser redirected to login page
- After login → User returned to original page via returnUrl parameter
1. Final state: User at login page, cannot access protected content

### Public Route Access Flow

1. User makes request to public route (/login, /register)
2. Middleware intercepts request
3. Middleware checks if user is already authenticated
- If authenticated → Redirect to /feed (already logged in)
- If not authenticated → Allow request to continue
1. Final state: Public page accessible to unauthenticated users

### Static Asset Bypass Flow

1. Browser requests static asset (/_next/*, /favicon.ico, /images/*)
2. Middleware matcher excludes these paths
3. Request bypasses middleware entirely
4. Static asset served directly
5. Final state: Fast static asset delivery without auth overhead

## Things to Watch For

**Middleware runs on static assets** → Performance degraded, unnecessary JWT verification on every image/CSS file → Use matcher config to exclude /_next/static, /_next/image, /favicon.ico, /public assets

**Middleware runs on API routes** → API routes need separate auth → Exclude /api/ from matcher if API routes handle auth separately, or include if using same JWT auth

**Matcher regex too permissive** → Private routes accidentally public → Test matcher with all route patterns, verify protected routes are covered

**Matcher too restrictive** → Public routes require auth → Ensure /login, /register, /reset-password explicitly excluded from auth check

**Infinite redirect loop** → Middleware redirects to login, login redirects back → Check that /login path is excluded from auth requirement, skip auth check for login/register routes

**User context not available in Server Components** → Components can't access current user → Inject userId and isAdmin into request headers, provide utility function to read headers in Server Components

**Request headers not passed to Server Actions** → Server Actions can't identify user → Next.js passes headers to Server Actions, test that x-user-id header is accessible

**Header names conflict** → Another middleware uses same header name → Use unique prefixed header names like x-auth-user-id, x-auth-is-admin

**TypeScript types for headers** → No type safety for user context → Create typed helper function that parses headers and returns typed user object

**Multiple middleware files** → Next.js only supports one middleware.ts at root → Combine all middleware logic in single file, use conditional logic for different routes

**Middleware doesn't handle errors** → Unhandled JWT verification error crashes → Wrap JWT verification in try-catch, treat verification errors as unauthenticated

**Expired token causes error** → User sees error page instead of login redirect → Catch TokenExpiredError specifically, redirect to login same as missing token

**Invalid token format** → Malformed JWT causes middleware crash → Catch all JWT verification errors, log server-side, redirect to login

**Cookie reading fails** → Middleware can't access cookies → Use request.cookies.get() from Next.js, handle undefined return value

**Redirect preserves method** → POST request redirected as GET → Next.js redirect() uses 307 (temporary) preserving method, or 302 (found) converting to GET, choose appropriate status

**Return URL not validated** → Open redirect vulnerability → Validate returnUrl is relative path starting with /, reject external URLs

**Return URL not preserved** → User lands at /feed after login instead of intended page → Capture original URL in redirect query param, read and redirect after login

**Middleware runs too early** → Can't access database or other services → Middleware should only verify JWT, don't make database calls in middleware (too slow)

**User data stale in headers** → isAdmin flag outdated after role change → Acceptable with stateless JWT, changes take effect after token refresh (30 days), implement token refresh for instant role changes

**Race condition on parallel requests** → Multiple requests with same expired token → Each request independently redirects to login, user may see multiple login prompts

**Admin routes not separately protected** → Regular users can access admin pages → Middleware checks authentication, admin-specific pages must separately check isAdmin flag

**Public API endpoints exposed** → API routes accessible without auth → If using API routes, apply same auth logic or separate API key authentication

**Middleware response headers** → Need to set CORS or security headers → Middleware can modify response headers, add security headers if needed

**Middleware performance** → JWT verification adds latency to every request → JWT verification is fast (~1-5ms), acceptable overhead, cache not needed for single request

**Development vs production behavior** → Middleware acts differently in local dev → Test with next build && next start locally to verify production behavior

**Middleware edge runtime** → Some Node APIs unavailable → Verify jose library works in Edge runtime (it does), bcrypt not needed in middleware

**TypeScript middleware exports** → Wrong export causes middleware not to run → Export default async function middleware(request: NextRequest) and export const config with matcher

**Middleware rewrite instead of redirect** → User URL doesn't change → Use redirect() for login, not rewrite(), user should see /login in address bar

**Next.js version compatibility** → Middleware API changes between versions → Middleware documented is for Next.js 13+, verify current Next.js version

**Middleware runs in wrong order** → Other middleware overrides auth → Next.js only supports one middleware, must combine all logic

**Server Component reads headers incorrectly** → User context undefined → Use headers() from next/headers, not from request object (different APIs)

**Client Components try to access user context** → Headers not available in client → User context only available in Server Components and Server Actions, pass as props to Client Components

**Page Component not marked async** → Can't await headers() → Server Components can be async, must await headers() call

**Middleware matcher uses wrong syntax** → Routes not matched → Use glob patterns: /dashboard/:path* matches /dashboard and all sub-paths

**Admin dashboard not protected** → /admin accessible to non-admins → Middleware checks authentication, admin pages must additionally check isAdmin flag and redirect if false

## Testing Verification

### Existing Features Still Work

- [ ]  Registration works → Can create new users
- [ ]  Login works → Can authenticate and get JWT cookie
- [ ]  Logout works → Cookie cleared

### New Functionality Works

- [ ]  Visit /feed when authenticated → Page loads, no redirect
- [ ]  Visit /feed when not authenticated → Redirected to /login
- [ ]  Login from redirect → Returned to /feed (returnUrl preserved)
- [ ]  Visit /login when authenticated → Redirected to /feed
- [ ]  Visit /register when authenticated → Redirected to /feed
- [ ]  Visit /login when not authenticated → Page loads normally
- [ ]  Static assets load → No auth check, fast delivery
- [ ]  Server Component accesses user context → userId and isAdmin available
- [ ]  Server Action accesses user context → Can read current user
- [ ]  JWT expires → Next request redirects to login
- [ ]  Invalid JWT in cookie → Treated as unauthenticated, redirected to login
- [ ]  Tampered JWT → Signature verification fails, redirected to login

### Edge Cases

- [ ]  Visit protected route with expired token → Redirected to login, no error page
- [ ]  Visit protected route with malformed token → Redirected to login gracefully
- [ ]  Visit protected route with no cookie → Redirected to login
- [ ]  Multiple tabs, logout in one → All tabs redirect on next request
- [ ]  Try to access /admin as regular user → Page checks isAdmin, shows access denied
- [ ]  Deep link to protected page → Redirected to login, returned to deep link after login
- [ ]  Public route with query params → Query params preserved

---

# Chunk 5: 🎨 Registration & Login UI

Duration: 4-5 hours | Prerequisites: Chunks 2, 3, 4 completed (All auth logic functional - registration, login, logout, middleware all working)

## Quick Reference

**Builds:** Complete user-facing registration and login forms with real-time validation, loading states, error displays, and responsive design using shadcn/ui components.

**Connects:** User input → Form validation → Server Action call → Loading state → Success (redirect) or Error display

**Pattern:** React Server Components for page structure with Client Components for interactive forms, Server Actions for submission, optimistic UI updates

**Watch For:**

1. Form re-renders clearing user input on validation errors
2. Loading state not showing on slow connections
3. Error messages not accessible to screen readers

## Context

### User Problem

Users need intuitive, responsive forms to register and login with clear feedback on validation errors and submission progress.

### From Module Brief

- **Registration form**: Email, password, username fields with real-time uniqueness validation for username
- **Login form**: Email and password fields only
- **Error display**: Field-specific errors shown inline next to inputs
- **Loading states**: Button disabled and loading spinner during submission
- **Responsive design**: Forms work on mobile, tablet, and desktop
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation

## What's Changing

### New Additions

- **Registration page**: Server Component at /register route rendering registration form
- **Registration form component**: Client Component with controlled inputs for email, password, username
- **Real-time username validation**: Debounced check as user types to verify username availability
- **Login page**: Server Component at /login route rendering login form
- **Login form component**: Client Component with controlled inputs for email and password
- **Form validation utilities**: Client-side validation for email format, required fields before submission
- **Error display component**: Shows field-specific error messages with appropriate styling
- **Loading button component**: Button with disabled state and spinner during submission
- **Auth layout component**: Shared layout for login and registration pages with centered form design
- **Password visibility toggle**: Eye icon to show/hide password input
- **Form submission handlers**: Connect forms to Server Actions from Chunks 2 and 3
- **Success redirect handling**: Process Server Action response and redirect on success

### Modifications to Existing

- **App routing**: Add /register and /login routes to app directory
- **shadcn components**: Install Input, Button, Label, Card components if not already installed

### No Changes To

- **Server Actions**: UI calls existing registration and login Server Actions
- **Middleware**: Already excludes /register and /login from auth
- **Database**: No schema changes

## Data Flow

### Registration Form Flow

1. User navigates to /register page
2. Server Component renders registration form (Client Component)
3. User enters username → Input onChange event fires
4. Debounced validation checks username format (alphanumeric + underscore)
5. After debounce delay (500ms), optionally check username uniqueness via Server Action
- If available → Show green checkmark
- If taken → Show inline error 'Username taken'
- If invalid format → Show inline error 'Invalid characters'
1. User enters email → Basic format validation on blur
2. User enters password → Length shown as character count
3. User clicks 'Register' button
4. Client-side validation runs (all fields required, email format)
- If validation fails → Show inline errors, prevent submission
- If validation passes → Continue
1. Set loading state (disable button, show spinner)
2. Call registration Server Action from Chunk 2 with form data
3. Server Action returns response
- If success → Redirect to /feed
- If error → Display error message inline next to appropriate field, clear loading state
1. Final state: User registered and redirected, or error displayed

### Login Form Flow

1. User navigates to /login page
2. Server Component renders login form (Client Component)
3. User enters email and password
4. User clicks 'Login' button
5. Client-side validation (both fields required)
- If validation fails → Show inline errors
- If validation passes → Continue
1. Set loading state (disable button, show spinner)
2. Call login Server Action from Chunk 3 with form data
3. Server Action returns response
- If success → Redirect to /feed (or returnUrl if present)
- If error → Display 'Invalid credentials' message, clear loading state
1. Final state: User logged in and redirected, or error displayed

### Real-time Username Validation Flow

1. User types in username field
2. Input onChange updates local state
3. Debounce timer resets on each keystroke
4. After 500ms of no typing, validation triggered
5. Check format locally (regex for alphanumeric + underscore)
- If invalid → Show format error immediately
- If valid → Continue
1. Optionally call Server Action to check database uniqueness
2. Display result next to username field
- Available: Green checkmark icon
- Taken: Red error message
- Checking: Loading spinner
1. Final state: User knows if username is available before submitting form

## Things to Watch For

**Form state lost on error** → User input cleared when error displayed → Use controlled components with useState, preserve input values when showing errors

**Password visible by default** → Security concern → Default input type='password', provide toggle to show/hide

**Email not trimmed** → User registers with leading/trailing spaces → Trim email value before validation and submission

**Username not trimmed** → Spaces in username cause issues → Trim username before validation and submission

**Real-time validation too aggressive** → API called on every keystroke → Debounce username validation by 500ms, only check after user stops typing

**Real-time validation too slow** → User waits forever for validation → Set reasonable timeout (3 seconds) for validation check, show error if timeout exceeded

**Validation check on empty username** → Unnecessary API call → Only check uniqueness if username is non-empty and passes format validation

**Multiple validation requests in flight** → Race condition, wrong result shown → Cancel previous validation request when new one starts, use AbortController

**Loading state not cleared on error** → Button stays disabled after error → Always clear loading state in finally block or after error handling

**Button not disabled during submission** → User clicks multiple times, duplicate submissions → Disable button when loading=true, prevent multiple Server Action calls

**Form submission on Enter key** → Unexpected submission while typing → Handle onSubmit event, trigger validation and Server Action call

**Error messages not cleared** → Old error shown with new input → Clear error state when user modifies field that had error

**Field-level errors not specific** → Generic error shown for all fields → Parse Server Action error response, show error next to specific field (email, username, password)

**Network error not handled** → Form appears broken on connection loss → Catch Server Action errors, show generic 'Connection error. Please try again.' message

**Server Action doesn't return error** → Form stuck in loading state → Ensure Server Actions always return response (success or error), never throw uncaught exceptions

**Success redirect doesn't work** → User stuck on form after successful registration/login → Use useRouter from next/navigation, call router.push() on success response

**Return URL not used** → User not returned to intended page after login → Check query params for returnUrl, redirect to it instead of /feed if present

**Return URL not validated** → Open redirect vulnerability → Validate returnUrl is internal path (starts with /), reject external URLs

**Password requirements not communicated** → User doesn't know what's valid → Per spec, any password accepted, communicate 'No restrictions' to user

**Email validation regex too strict** → Valid emails rejected → Use permissive regex that accepts most valid email formats

**Email validation too permissive** → Invalid emails accepted → Require @ and dot in domain, basic structure validation

**Form not accessible** → Screen readers can't use form → Add proper labels, ARIA attributes, error announcements for screen readers

**Labels not associated with inputs** → Clicking label doesn't focus input → Use htmlFor on labels matching input id

**Required fields not marked** → Users don't know what's required → Add asterisk or '(required)' to labels, or use required attribute

**Errors not announced to screen readers** → Users don't hear error messages → Add role='alert' and aria-live='polite' to error message elements

**Keyboard navigation broken** → Can't tab through form → Verify tab order is logical, Enter submits form, Escape clears errors

**Focus not managed** → Form submitted but focus stays on button → Move focus to first error field if validation fails

**Password toggle not accessible** → Screen readers don't announce state → Add aria-label describing toggle function, announce when password shown/hidden

**Loading state not announced** → Screen readers don't know form is submitting → Add aria-live region announcing 'Submitting...'

**Mobile keyboard not optimized** → Wrong keyboard shown → Use inputMode='email' for email field, type='text' with inputMode for username

**Form too wide on mobile** → Horizontal scrolling required → Use responsive container with max-width, padding on sides

**Tap targets too small** → Mobile users struggle to tap inputs/buttons → Ensure minimum 44px tap target size per iOS guidelines

**Auto-capitalize on username** → Mobile capitalizes first letter → Set autoCapitalize='none' on username field

**Autocomplete not configured** → Browser doesn't suggest saved credentials → Add autoComplete='email', autoComplete='new-password' (registration), autoComplete='current-password' (login)

**Password managers not compatible** → Can't save credentials → Use semantic HTML inputs with proper name and autoComplete attributes

**Form not in semantic form element** → Accessibility issues → Wrap inputs in <form> element with onSubmit handler

**Submit button outside form** → Click doesn't trigger submission → Place button inside form with type='submit'

**Multiple forms on page** → Wrong form submitted → Ensure each form has unique id, buttons target correct form

**CSRF token not included** → Form submission vulnerable → Next.js Server Actions have built-in CSRF protection, verify it's enabled

**Client-side validation can be bypassed** → Malicious users skip validation → Always validate server-side in Server Actions, client validation is UX enhancement only

**Error messages reveal system info** → Information disclosure → Show generic user-friendly errors, don't expose stack traces or system details

**Success message before redirect** → User sees flash of success → Skip success message, redirect immediately on successful auth

**Links to other forms missing** → User can't navigate between login/register → Include 'Already have an account? Login' link on registration, 'Don't have an account? Register' on login

**Forgot password link missing** → Users with forgotten passwords stuck → Add 'Forgot password?' link on login form (implement in Module 12)

**Form styling inconsistent** → Different look than rest of app → Use shadcn/ui components consistently, match design system colors and spacing

**Dark mode not supported** → Form looks wrong in dark mode → Not required for MVP, but ensure shadcn components work in both modes if dark mode exists

## UX Specification

### User Flow

- **Registration**: Visit /register → Fill email, username, password → See real-time username validation → Click Register → Loading state → Success redirect to /feed
- **Login**: Visit /login → Fill email, password → Click Login → Loading state → Success redirect to /feed
- **Error Recovery**: Submit with error → See error message → Correct input → Submit again → Success

### Empty States

- Form initially empty with placeholder text in inputs
- No errors shown until user interacts or attempts submission

### Loading States

- Button shows spinner and 'Submitting...' text while Server Action processes
- All form inputs disabled during submission
- Username validation shows small spinner during real-time check

### Error States

- Field-specific errors shown in red text below input
- Input border turns red when error present
- Error icon (exclamation) next to error message
- Generic server errors shown at top of form

### Responsive Behavior

- Mobile (< 640px): Full-width form, stacked labels above inputs
- Tablet (640px - 1024px): Centered card with max-width 500px
- Desktop (> 1024px): Same as tablet, more padding around form

## Testing Verification

### Existing Features Still Work

- [ ]  Registration Server Action works → UI calls it successfully
- [ ]  Login Server Action works → UI calls it successfully
- [ ]  Middleware redirects work → Authenticated users redirected from login/register

### New Functionality Works

- [ ]  Visit /register → Form loads with email, username, password fields
- [ ]  Fill all fields and submit → Registration works, redirected to /feed
- [ ]  Submit registration with duplicate email → Error 'Email already registered' shown
- [ ]  Submit registration with duplicate username → Error 'Username taken' shown
- [ ]  Submit registration with invalid email → Error 'Invalid email format' shown
- [ ]  Type username → See real-time validation after 500ms
- [ ]  Visit /login → Form loads with email and password fields
- [ ]  Fill fields and submit → Login works, redirected to /feed
- [ ]  Submit login with wrong credentials → Error 'Invalid credentials' shown
- [ ]  Click 'Show password' toggle → Password becomes visible
- [ ]  Click 'Already have account?' → Navigated to login page
- [ ]  Click 'Don't have account?' → Navigated to registration page

### Edge Cases

- [ ]  Submit empty form → All required field errors shown
- [ ]  Submit with only some fields → Specific field errors shown
- [ ]  Network error during submission → Generic error shown, button re-enabled
- [ ]  Click submit button multiple times rapidly → Only one submission occurs
- [ ]  Use Tab key to navigate form → Focus order is logical
- [ ]  Press Enter in last field → Form submits
- [ ]  View on mobile device → Form is full-width and usable
- [ ]  View on desktop → Form is centered with appropriate width
- [ ]  Use screen reader → Form is navigable and errors announced
- [ ]  Type username with special characters → Format error shown immediately
- [ ]  Clear username field after validation → Validation result clears

---

## Feature Acceptance Tests

**From Module Brief QA Criteria:**

Run these after all chunks complete to verify the full feature works.

**Core Tests:**

- [ ]  Register new user with valid email/password/username → User created, redirected to feed
- [ ]  Log in with correct credentials → JWT cookie set, access to protected routes granted
- [ ]  Log out → Cookie cleared, redirected to login page
- [ ]  Try to access protected route without login → Redirected to login page
- [ ]  Register with duplicate email → Error: 'Email already registered'
- [ ]  Register with duplicate username → Error: 'Username taken'

**Edge Cases:**

- [ ]  Register with invalid email format → Error: 'Invalid email format'
- [ ]  Log in with wrong password → Error: 'Invalid credentials'
- [ ]  Log in with non-existent email → Error: 'Invalid credentials'
- [ ]  Tamper with JWT cookie → Access denied, logged out
- [ ]  Password with special characters → Accepted and works
- [ ]  Very long username (50+ chars) → Accepted or clear limit enforced

**Integration Tests:**

- [ ]  Register → immediately log out → log back in with same credentials → Success
- [ ]  Multiple users can register with different usernames → No conflicts
- [ ]  Register → access protected page → see user-specific content
- [ ]  Login → logout → try to access protected page → redirected to login