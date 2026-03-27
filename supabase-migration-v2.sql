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
    id              BIGSERIAL PRIMARY KEY,
    recipient_email TEXT,
    recipient_name  TEXT,
    given_by        TEXT,
    given_by_email  TEXT,
    category        TEXT,
    message         TEXT,
    bonus_amount    NUMERIC,
    date            TEXT
);
