# Environment Variables

## Required

| Variable | Purpose | How to Get |
| --- | --- | --- |
| DATABASE_URL | Neon Postgres connection string | Create project at [neon.tech](http://neon.tech), copy connection string from dashboard |
| R2_ACCOUNT_ID | Cloudflare account ID for R2 | Cloudflare dashboard > R2 > Overview, copy Account ID |
| R2_ACCESS_KEY_ID | R2 access key for authentication | Cloudflare dashboard > R2 > Manage API tokens > Create API token |
| R2_SECRET_ACCESS_KEY | R2 secret key for authentication | Same as above, generated with access key |
| R2_BUCKET_NAME | Name of R2 bucket for image storage | Create bucket in R2 dashboard, copy name |
| R2_PUBLIC_URL | Public URL for accessing uploaded images | Cloudflare dashboard > R2 > [Bucket] > Settings > Public URL (or custom domain) |
| RESEND_API_KEY | API key for Resend email service | Sign up at [resend.com](http://resend.com), create API key in dashboard |
| RESEND_FROM_EMAIL | Verified from address for emails | Add and verify domain in Resend, use address like [noreply@yourdomain.com](mailto:noreply@yourdomain.com) |
| JWT_SECRET | Secret key for JWT token signing | Generate with: `openssl rand -base64 32` (32+ byte random string) |
| NEXT_PUBLIC_APP_URL | Base URL of your app | Local: http://localhost:3000, Production: https://yourdomain.com |

---

## Optional

| Variable | Purpose | Default |
| --- | --- | --- |
| NODE_ENV | Environment mode | development |
| PORT | Server port for local dev | 3000 |
| JWT_EXPIRES_IN | JWT token expiration | 30d (30 days) |
| OTP_EXPIRY_MINUTES | OTP code expiration time | 15 |
| MAX_FILE_SIZE | Max upload file size in bytes | 52428800 (50MB) |

---

## .env.example

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Cloudflare R2
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id  
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=instagram-clone-images
R2_PUBLIC_URL=https://images.yourdomain.com

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key
[RESEND_FROM_EMAIL=noreply@yourdomain.com](mailto:RESEND_FROM_EMAIL=noreply@yourdomain.com)

# Authentication
JWT_SECRET=generate_with_openssl_rand_base64_32
JWT_EXPIRES_IN=30d

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional
PORT=3000
OTP_EXPIRY_MINUTES=15
MAX_FILE_SIZE=52428800
```

---

## Setup Instructions

### 1. Neon Database

1. Go to [neon.tech](http://neon.tech) and create account
2. Click "Create Project"
3. Choose region (closest to your users)
4. Copy connection string from dashboard
5. Add to `.env.local` as `DATABASE_URL`

**Connection String Format:**

```
postgresql://[username]:[password]@[hostname]/[database]?sslmode=require
```

**Note:** Neon provides different connection strings for different connection types (pooled vs direct). Use **pooled connection string** for serverless environments.

### 2. Cloudflare R2

1. Go to Cloudflare dashboard > R2
2. Click "Create bucket"
3. Name your bucket (e.g., `instagram-clone-images`)
4. Configure **Public Access**: Enable public read
5. Note your **Account ID** from R2 overview page
6. Go to R2 > Manage API Tokens > Create API Token
7. Select permissions: Object Read & Write on your bucket
8. Copy **Access Key ID** and **Secret Access Key**
9. Get **Public URL**:
    - Option A: Use [R2.dev](http://R2.dev) subdomain (e.g., [`https://pub-abc123.r2.dev`](https://pub-abc123.r2.dev))
    - Option B: Add custom domain (recommended): R2 > [Bucket] > Settings > Custom Domain
10. Add all values to `.env.local`

**Custom Domain Setup (Optional but Recommended):**

- Cloudflare dashboard > R2 > [Bucket] > Settings > Custom Domains
- Click "Connect Domain"
- Enter subdomain (e.g., [`images.yourdomain.com`](http://images.yourdomain.com))
- Cloudflare auto-configures DNS
- Use as `R2_PUBLIC_URL`

### 3. Resend Email

1. Go to [resend.com](http://resend.com) and create account
2. Click "API Keys" in sidebar
3. Click "Create API Key"
4. Give it a name (e.g., "Instagram Clone Production")
5. Copy API key (starts with `re_`)
6. Add to `.env.local` as `RESEND_API_KEY`
7. Go to "Domains" in sidebar
8. Click "Add Domain"
9. Enter your domain (e.g., [`yourdomain.com`](http://yourdomain.com))
10. Add DNS records shown (SPF, DKIM, DMARC) to your DNS provider
11. Click "Verify" once DNS propagated (may take up to 48 hours)
12. Once verified, use any email at that domain as `RESEND_FROM_EMAIL`

**DNS Records Example:**

```
Type  Name                    Value
TXT   @                       v=spf1 include:_[spf.resend.com](http://spf.resend.com) ~all
TXT   resend._domainkey       [DKIM value from Resend]
TXT   _dmarc                  v=DMARC1; p=none
```

**Testing Email (Development):**

Resend allows sending to your own email without domain verification for testing.

### 4. JWT Secret

Generate a cryptographically secure random string:

**Using OpenSSL (Mac/Linux):**

```bash
openssl rand -base64 32
```

**Using Node.js:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Using Online Generator:**

Go to [generate-random.org/api-token-generator](http://generate-random.org/api-token-generator) and generate 256-bit token.

Copy output and add to `.env.local` as `JWT_SECRET`.

**Important:** Use different secrets for development and production. Never commit secrets to git.

### 5. App URL

**Local Development:**

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production (Vercel):**

```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Or with custom domain:

```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Used for:

- Password reset email links
- OTP email links
- Absolute URLs in emails

### 6. Verify Setup

Create `.env.local` file in project root (never commit this file):

```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Edit .env.local with your actual values
# (use your code editor)
```

Test connection:

```bash
pnpm dev
```

App should start without errors. Check:

- Database connection (no Drizzle errors)
- Environment variables loaded (check Next.js output)

---

## Environment-Specific Settings

### Development (.env.local)

```bash
DATABASE_URL=postgresql://dev_user:dev_pass@dev-host/dev_db
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel Dashboard)

Set in Vercel project settings > Environment Variables:

```bash
DATABASE_URL=postgresql://prod_user:prod_pass@prod-host/prod_db  
R2_ACCOUNT_ID=prod_account_id
R2_ACCESS_KEY_ID=prod_access_key
R2_SECRET_ACCESS_KEY=prod_secret_key
R2_BUCKET_NAME=prod-instagram-clone-images
R2_PUBLIC_URL=https://images.yourdomain.com
RESEND_API_KEY=re_prod_api_key
[RESEND_FROM_EMAIL=noreply@yourdomain.com](mailto:RESEND_FROM_EMAIL=noreply@yourdomain.com)
JWT_SECRET=prod_jwt_secret_different_from_dev
NEXT_PUBLIC_APP_URL=https://yourdomain.com  
NODE_ENV=production
```

**Important:** Use separate databases and R2 buckets for dev and prod. Never test with production data.

---

## Troubleshooting

### "Database connection failed"

- Check `DATABASE_URL` format and credentials
- Verify Neon project is running (not paused)
- Check IP allowlist if configured (Neon allows all by default)
- Test connection with: `psql [DATABASE_URL]`

### "R2 upload failed: AccessDenied"

- Verify `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` are correct
- Check API token has "Object Read & Write" permissions
- Verify `R2_BUCKET_NAME` matches actual bucket name
- Check bucket exists and is not suspended

### "Email send failed: unauthorized"

- Verify `RESEND_API_KEY` is correct (starts with `re_`)
- Check API key is not expired or revoked
- Verify domain is verified in Resend dashboard
- Check `RESEND_FROM_EMAIL` uses verified domain

### "JWT verification failed"

- Verify `JWT_SECRET` is set and matches across deployments
- Check secret is at least 32 bytes
- Ensure no trailing whitespace in secret
- Clear cookies and login again

### "Environment variables not loading"

- Verify `.env.local` is in project root (same level as package.json)
- Check file name is exactly `.env.local` (not `.env.local.txt`)
- Restart Next.js dev server after changing .env files
- For `NEXT_PUBLIC_*` vars: Rebuild app to pick up changes

---

## Security Checklist

- [ ]  `.env.local` added to `.gitignore`
- [ ]  `.env.example` committed (without real values)
- [ ]  Different secrets for dev and production
- [ ]  JWT secret is cryptographically random (32+ bytes)
- [ ]  R2 credentials not exposed to client
- [ ]  Resend API key not exposed to client
- [ ]  Production env vars set in Vercel dashboard, not in code
- [ ]  Database uses separate user for app (not superuser)
- [ ]  All secrets rotated quarterly (set reminder)