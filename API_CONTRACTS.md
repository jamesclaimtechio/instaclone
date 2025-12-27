# API Contracts

## Neon Postgres

### Overview

**Purpose:** Primary database for all application data

**Type:** Serverless PostgreSQL database

**Docs:** https://neon.tech/docs

**Pricing:** Free tier includes 512 MB storage, 1 compute unit. Paid plans start at $19/month.

### Authentication

Connection via standard PostgreSQL connection string:

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

Connection string provided in Neon dashboard. Store in `DATABASE_URL` environment variable.

### Features Used

- **Serverless Postgres:** Auto-scaling compute, pay only for what you use
- **Instant Provisioning:** Database ready in seconds
- **Branching:** Create database branches for dev/staging (similar to Git branches)
- **Connection Pooling:** Built-in pooling, no manual management needed

### Integration

- Use Drizzle ORM for all database access
- Connection established via `postgres` package
- No direct SQL queries outside of migrations

### Rate Limits

Free tier limits:

- Max 1 concurrent connection per compute
- 512 MB storage
- 100 hours compute per month

Exceeding limits automatically scales to paid tier or throttles connections.

### Error Handling

**Connection Errors:**

- Cause: Invalid connection string, network issues, Neon service down
- Response: Log error, show generic "Database unavailable" to user
- Retry: Automatic retry with exponential backoff (built into postgres client)

**Query Errors:**

- Cause: Constraint violations, syntax errors, data type mismatches
- Response: Log full error server-side, show generic "Something went wrong" to user
- Never expose: Database schema details, table names, column names in user-facing errors

---

## Cloudflare R2

### Overview

**Purpose:** Object storage for all user-uploaded images

**Type:** S3-compatible object storage

**Docs:** https://developers.cloudflare.com/r2/

**Pricing:** Free tier includes 10 GB storage, 10 million Class A operations, 100 million Class B operations per month. Zero egress fees.

### Authentication

S3-compatible API requires:

- **Access Key ID:** Public identifier
- **Secret Access Key:** Secret credential
- **Account ID:** Cloudflare account identifier
- **Bucket Name:** Target bucket

All credentials stored in environment variables (never in code).

### Endpoints Used

### Upload Object (PutObject)

**Method:** PUT

**SDK:** `@aws-sdk/client-s3` `PutObjectCommand`

**Request:**

```tsx
{
  Bucket: 'your-bucket-name',
  Key: 'path/to/file.jpg',
  Body: Buffer,
  ContentType: 'image/jpeg',
  ACL: 'public-read' // Makes object publicly accessible
}
```

**Success Response:**

```tsx
{
  $metadata: { httpStatusCode: 200 },
  ETag: '"abc123..."'
}
```

**Error Response:**

```tsx
{
  name: 'NoSuchBucket' | 'AccessDenied' | 'InvalidRequest',
  message: string
}
```

**File Paths:**

- Thumbnails: `thumbnails/{postId}-thumb.jpg`
- Full-size: `full/{postId}-full.jpg`
- Profile pictures: `profiles/{userId}.jpg`

### Get Object URL

**For Public Read:**

Direct URL: `https://{bucket-name}.[r2.cloudflarestorage.com/{key}](http://r2.cloudflarestorage.com/{key})`

Or with custom domain (recommended):

[`https://images.yourdomain.com/{key}`](https://images.yourdomain.com/{key})

**No Pre-Signed URLs Needed:** Bucket configured for public read access. All uploaded images immediately accessible via URL.

### Configuration

**Bucket Settings:**

- Public read access: Enabled (required for image URLs to work)
- CORS: Allow all origins for GET requests
- Object lock: Disabled
- Versioning: Disabled

**Custom Domain (Optional but Recommended):**

- Add custom domain in Cloudflare dashboard
- Point DNS to R2 bucket
- Enables: [`https://images.yourdomain.com/`](https://images.yourdomain.com/) instead of generic R2 URL

### Rate Limits

Free tier:

- 10 million Class A operations (write) per month
- 100 million Class B operations (read) per month
- No egress charges (unlimited downloads)

Class A operations: PUT, POST, COPY

Class B operations: GET, HEAD, LIST

Exceeding limits: Automatic charge for additional operations.

### Error Handling

**Upload Failures:**

- `NoSuchBucket`: Bucket doesn't exist or name wrong → Check bucket name in env vars
- `AccessDenied`: Credentials invalid or insufficient permissions → Verify access keys
- `EntityTooLarge`: File exceeds max size (5GB limit) → Validate file size before upload
- Network timeout: Retry upload up to 3 times with exponential backoff

**Download Failures:**

- `NoSuchKey`: File doesn't exist → Show placeholder image
- `AccessDenied`: Public read not configured → Fix bucket permissions
- CDN errors: Cloudflare handles automatically with retry

**Best Practices:**

- Always validate file before upload (type, size)
- Use unique keys (postId, userId) to avoid collisions
- Log failed uploads for manual investigation
- Show generic error to user: "Upload failed. Please try again."

---

## Resend

### Overview

**Purpose:** Transactional email delivery (OTP codes, password reset)

**Type:** Email API service

**Docs:** https://resend.com/docs

**Pricing:** Free tier includes 3,000 emails per month, 1 custom domain. Paid plans start at $20/month.

### Authentication

**API Key:** Single secret key for all requests

Header format:

```
Authorization: Bearer re_your_api_key_here
```

API key stored in `RESEND_API_KEY` environment variable.

### Endpoints Used

### Send Email

**Method:** POST

**URL:** [`https://api.resend.com/emails`](https://api.resend.com/emails)

**Request:**

```json
{
  "from": "[noreply@yourdomain.com](mailto:noreply@yourdomain.com)",
  "to": ["[user@example.com](mailto:user@example.com)"],
  "subject": "Verify your email",
  "html": "<p>Your verification code is: <strong>123456</strong></p>",
  "text": "Your verification code is: 123456"
}
```

**Success Response:**

```json
{
  "id": "abc123-456def",
  "from": "[noreply@yourdomain.com](mailto:noreply@yourdomain.com)",
  "to": ["[user@example.com](mailto:user@example.com)"],
  "created_at": "2025-01-01T12:00:00.000Z"
}
```

**Error Response:**

```json
{
  "statusCode": 400,
  "name": "validation_error",
  "message": "Invalid recipient email address"
}
```

### Email Templates

### OTP Verification Email

**Subject:** "Verify your email address"

**Content:**

- Greeting: "Welcome to Instagram Clone!"
- Body: "Your verification code is: **{code}**"
- Expiration notice: "This code expires in 15 minutes."
- Footer: "If you didn't request this, please ignore this email."

### Password Reset Email

**Subject:** "Reset your password"

**Content:**

- Greeting: "We received a request to reset your password."
- CTA: "Reset Password" button with link
- Link: [`https://yourdomain.com/reset-password?token={token}`](https://yourdomain.com/reset-password?token={token})
- Expiration: "This link expires in 1 hour."
- Footer: "If you didn't request this, please ignore this email."

### Domain Setup

**Required:** Verify custom domain in Resend dashboard

Steps:

1. Add domain in Resend dashboard
2. Add DNS records (SPF, DKIM, DMARC) to your domain
3. Verify domain (Resend checks DNS records)
4. Use `from` address with verified domain

**From Address:** [`noreply@yourdomain.com`](mailto:noreply@yourdomain.com) (or any address at verified domain)

### Rate Limits

Free tier:

- 3,000 emails per month
- 1 custom domain
- No daily send limit

Exceeding limits: Requests fail with 429 error. Upgrade to paid plan.

### Error Handling

**Common Errors:**

**`validation_error` (400):**

- Invalid email format
- Missing required fields (from, to, subject)
- Invalid from address (not verified domain)

**`not_found` (404):**

- Invalid API endpoint
- Check URL spelling

**`rate_limit_exceeded` (429):**

- Monthly quota exceeded
- Response: Log error, show generic success to user (don't reveal quota issues)

**`unauthorized` (401):**

- Invalid API key
- API key not set or expired
- Check `RESEND_API_KEY` environment variable

**Network Errors:**

- Timeout or connection failure
- Retry: Attempt up to 3 times with exponential backoff
- Final failure: Log error, show success to user (prevents email enumeration)

**Best Practices:**

- Always include both HTML and plain text versions
- Never expose email send failures to users (security)
- Log all email sends for debugging
- Use verified domain for better deliverability
- Include unsubscribe link (future requirement for marketing emails)

---

## Webhooks (None in MVP)

No webhook integrations in current scope. Future consideration:

- R2 bucket event notifications
- Resend delivery status webhooks

---

## Service Health Monitoring

### Neon

**Status Page:** https://neonstatus.com

**Check:** Database connection test on app startup

**Fallback:** Show maintenance page if database unreachable

### Cloudflare R2

**Status Page:** https://www.cloudflarestatus.com

**Check:** Upload test image on deployment

**Fallback:** Disable post creation if R2 unavailable, show error to users

### Resend

**Status Page:** https://resend.com/status

**Check:** None (email is non-critical path)

**Fallback:** Queue emails for retry, show success to users regardless

---

## Security Notes

**Secrets Management:**

- All API keys in environment variables
- Never log API keys or access tokens
- Rotate keys quarterly (best practice)

**R2 Bucket Security:**

- Public read for images (required)
- Private write (credentials server-only)
- No CORS for PUT requests (prevents client-side uploads)

**Email Security:**

- Never send passwords via email
- OTP codes expire after 15 minutes
- Password reset tokens expire after 1 hour
- Generic error messages prevent email enumeration
