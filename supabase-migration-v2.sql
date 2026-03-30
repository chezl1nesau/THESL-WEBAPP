-- ============================================================
-- Migration v2: Documents enhancements + Compliments table
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add new columns to existing documents table
ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS category      TEXT DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS uploaded_by   TEXT,
    ADD COLUMN IF NOT EXISTS original_name TEXT;

-- Create compliments table
CREATE TABLE IF NOT EXISTS compliments (
    id                 BIGSERIAL PRIMARY KEY,
    recipient_email    TEXT,
    recipient_name     TEXT,
    given_by           TEXT,
    given_by_email     TEXT,
    category           TEXT,
    message            TEXT,
    bonus_amount       NUMERIC,
    date               TEXT,
    status             TEXT DEFAULT 'pending',
    period             TEXT,
    recipient_comment  TEXT
);

-- Ensure all columns exist (if table was already created)
ALTER TABLE compliments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE compliments ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE compliments ADD COLUMN IF NOT EXISTS recipient_comment TEXT;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id                 BIGSERIAL PRIMARY KEY,
    user_email         TEXT NOT NULL,
    title              TEXT NOT NULL,
    message            TEXT NOT NULL,
    type               TEXT DEFAULT 'info',
    is_read            BOOLEAN DEFAULT FALSE,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    related_id         BIGINT
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_email, is_read);
