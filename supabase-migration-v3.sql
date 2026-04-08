-- ============================================================
-- Migration v3: User-scoped requests + document ownership
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add user tracking to requests table
ALTER TABLE requests
    ADD COLUMN IF NOT EXISTS user_email  TEXT,
    ADD COLUMN IF NOT EXISTS user_name   TEXT;

CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_email);

-- Add ownership + visibility columns to documents table
ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS user_email      TEXT,
    ADD COLUMN IF NOT EXISTS is_company_doc  BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_documents_user        ON documents(user_email);
CREATE INDEX IF NOT EXISTS idx_documents_company_doc ON documents(is_company_doc);

-- Existing documents (uploaded before this migration) = company docs
UPDATE documents SET is_company_doc = TRUE WHERE is_company_doc IS NULL;

-- Ensure pending_approvals has all needed columns
ALTER TABLE pending_approvals
    ADD COLUMN IF NOT EXISTS reference_id  BIGINT,
    ADD COLUMN IF NOT EXISTS name          TEXT,
    ADD COLUMN IF NOT EXISTS duration      INTEGER DEFAULT 0;
