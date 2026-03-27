# THESL-WEBAPP (HR Portal)

Modern HR management portal with a React frontend and an Express backend using Supabase for persistence.

## Features
- RBAC (Admin, Manager, Employee)
- Leave Management (Annual & Sick)
- Performance Reviews
- MFA (TOTP) & Secure Authentication
- Audit Logging & Lateness Tracker

## Getting Started

1. Install dependencies:
   - `npm install`
2. Configure environment:
   - `cp .env.example .env`
   - Fill in `SUPABASE_URL` and `SUPABASE_KEY`
3. Run schema setup:
   - Execute `supabase-setup.sql` in your Supabase SQL editor.
4. Start the development server:
   - `npm run dev` (Frontend)
   - `npm start` (Backend)

## Required Environment Variables

These values are required for the backend to start:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/public key (or service role if preferred)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_RESET_SECRET`
- `CORS_ORIGINS`: Comma-separated list (e.g., `http://localhost:5173`)

Optional SMTP config:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## Deployment
Compatible with Vercel and traditional VPS environments using PM2.
