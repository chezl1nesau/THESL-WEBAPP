-- =======================
-- Create Users Table
-- =======================
CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    password TEXT,
    role TEXT DEFAULT 'employee',
    name TEXT,
    annual_balance INTEGER DEFAULT 12,
    sick_balance INTEGER DEFAULT 8,
    annual_used INTEGER DEFAULT 0,
    sick_used INTEGER DEFAULT 0,
    avatar TEXT,
    phone TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT
);

-- =======================
-- Create Announcements Table
-- =======================
CREATE TABLE IF NOT EXISTS announcements (
    id BIGSERIAL PRIMARY KEY,
    type TEXT,
    title TEXT,
    content TEXT,
    date TEXT,
    author TEXT,
    pinned INTEGER
);

-- =======================
-- Create Requests Table
-- =======================
CREATE TABLE IF NOT EXISTS requests (
    id BIGSERIAL PRIMARY KEY,
    title TEXT,
    type TEXT,
    status TEXT,
    date TEXT
);

-- =======================
-- Create Annual Leave Table
-- =======================
CREATE TABLE IF NOT EXISTS annual_leave (
    id BIGSERIAL PRIMARY KEY,
    user_email TEXT,
    startDate TEXT,
    endDate TEXT,
    duration INTEGER,
    reason TEXT,
    status TEXT,
    submitDate TEXT
);

-- =======================
-- Create Sick Leave Table
-- =======================
CREATE TABLE IF NOT EXISTS sick_leave (
    id BIGSERIAL PRIMARY KEY,
    user_email TEXT,
    type TEXT,
    duration INTEGER,
    fileName TEXT,
    status TEXT,
    date TEXT
);

-- =======================
-- Create Lateness Table
-- =======================
CREATE TABLE IF NOT EXISTS lateness (
    id BIGSERIAL PRIMARY KEY,
    time TEXT,
    date TEXT,
    lateness INTEGER,
    status TEXT
);

-- =======================
-- Create Pending Approvals Table
-- =======================
CREATE TABLE IF NOT EXISTS pending_approvals (
    id BIGSERIAL PRIMARY KEY,
    reference_id INTEGER,
    user_email TEXT,
    name TEXT,
    type TEXT,
    duration INTEGER,
    details TEXT,
    date TEXT
);

-- =======================
-- Create Audit Logs Table
-- =======================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    email TEXT,
    action TEXT,
    details TEXT
);

-- =======================
-- Create Performance Reviews Table
-- =======================
CREATE TABLE IF NOT EXISTS performance_reviews (
    id BIGSERIAL PRIMARY KEY,
    user_email TEXT,
    manager_email TEXT,
    period TEXT,
    self_assessment TEXT,
    manager_feedback TEXT,
    rating INTEGER,
    status TEXT,
    date TEXT
);

-- =======================
-- Create Documents Table
-- =======================
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    title TEXT,
    filename TEXT,
    size INTEGER,
    uploadDate TEXT
);

-- =======================
-- Create Calendar Events Table
-- =======================
CREATE TABLE IF NOT EXISTS calendar_events (
    id BIGSERIAL PRIMARY KEY,
    title TEXT,
    type TEXT,
    "start" TIMESTAMP,
    "end" TIMESTAMP
);

-- =======================
-- Create Two Factor Secrets Table
-- =======================
CREATE TABLE IF NOT EXISTS two_factor_secrets (
    email TEXT PRIMARY KEY,
    secret TEXT
);

-- =======================
-- Seed Sample Data
-- =======================
INSERT INTO users (email, password, role, name, annual_balance, sick_balance) 
VALUES 
    ('admin@thesl.co.za', '$2b$10$f.YdyPGh1d1cFgKFDCF//..G0Sgdqs93qlJHlvZME7h03o..yXUc.', 'admin', 'Admin User', 15, 10),
    ('chezlin@thesl.co.za', '$2b$10$f.YdyPGh1d1cFgKFDCF//..G0Sgdqs93qlJHlvZME7h03o..yXUc.', 'admin', 'Chezlin', 15, 10),
    ('employee@thesl.co.za', '$2b$10$f.YdyPGh1d1cFgKFDCF//..G0Sgdqs93qlJHlvZME7h03o..yXUc.', 'employee', 'Sample Employee', 12, 8)
ON CONFLICT DO NOTHING;
