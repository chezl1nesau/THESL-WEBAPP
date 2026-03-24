# thesl-hr-portal

HR portal application with a Vite/React frontend and an Express/SQLite backend.

## Getting Started

1. Install dependencies:
   - `npm install`
2. Create your environment file:
   - `cp .env.example .env`
3. Start the development server:
   - `npm run dev`

## Required Environment Variables

These values are required for the backend to start:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_RESET_SECRET`
- `CORS_ORIGINS`

Optional:

- `NODE_ENV` (defaults to `development`)
- `PORT` (defaults to `3000`)
- `FRONTEND_URL` (defaults to first origin in `CORS_ORIGINS`)
- SMTP config for password reset delivery:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`
  - In non-production, if SMTP is not configured, the app uses an Ethereal test inbox and logs only a preview URL.

## Security Notes

- JWT secrets are required and must be unique per token type.
- CORS is allowlist-based via `CORS_ORIGINS` (comma-separated).
- Uploads are restricted by type and size (10MB max).
- Password reset uses short-lived hashed token verification.
- Reset links are delivered via SMTP and not logged in plaintext.
