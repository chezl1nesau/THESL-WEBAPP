import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import process from 'node:process';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import cookieParser from 'cookie-parser';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import nodemailer from 'nodemailer';
import { setupDb } from './db.js';

const app = express();
const port = process.env.PORT || 3000;
const requireEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

const ACCESS_TOKEN_SECRET = requireEnv('JWT_ACCESS_SECRET');
const REFRESH_TOKEN_SECRET = requireEnv('JWT_REFRESH_SECRET');
const RESET_TOKEN_SECRET = requireEnv('JWT_RESET_SECRET');
const corsOrigins = requireEnv('CORS_ORIGINS')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
const frontendBaseUrl = process.env.FRONTEND_URL || corsOrigins[0] || 'http://localhost:5173';

// Security Middleware with custom CSP for Vite/React
app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}));

// Security Middleware with custom CSP for Vite/React
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for some Vite/plugin-react features
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Move rate limiters back
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later'
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many reset attempts, try again later'
});

app.use(cookieParser());
app.use(bodyParser.json({ limit: '10mb' }));

// Serve frontend static files
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

const uploadDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const safeExts = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.xlsx', '.xls', '.csv'];
        const safeExt = safeExts.includes(ext) ? ext : '';
        cb(null, `${Date.now()}-${crypto.randomUUID()}${safeExt}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = new Set([
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/png',
            'image/jpeg',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
            'application/csv'
        ]);
        const ext = path.extname(file.originalname || '').toLowerCase();
        const allowedExtensions = new Set(['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.xlsx', '.xls', '.csv']);
        if (!allowedExtensions.has(ext)) {
            return cb(new Error('Invalid file type. Allowed: PDF, Word, Excel, CSV, images'));
        }
        return cb(null, true);
    }
});

let db;
const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
let mailTransporterPromise = null;

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err.message, 'Token received:', token ? token.substring(0, 15) + '...' : 'none');
            return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
};

// RBAC Middleware
const isManager = (req, res, next) => {
    if (req.user && (req.user.role === 'manager' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Forbidden: Manager access required' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }
};

const logAudit = (email, action, details) => {
    if (!db) return;
    db.run('INSERT INTO audit_logs (email, action, details) VALUES (?, ?, ?)', [email, action, details], (err) => {
        if (err) console.error('Audit log failed', err);
    });
};

const getMailTransporter = async () => {
    if (mailTransporterPromise) return mailTransporterPromise;
    if (smtpConfigured) {
        mailTransporterPromise = Promise.resolve(nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        }));
        return mailTransporterPromise;
    }
    if (process.env.NODE_ENV === 'production') {
        throw new Error('SMTP is not configured');
    }
    mailTransporterPromise = nodemailer.createTestAccount().then(testAccount => nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    }));
    return mailTransporterPromise;
};

const sendResetEmail = async (toEmail, signedReset, expires) => {
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(signedReset)}`;
    try {
        const transporter = await getMailTransporter();
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || 'dev-no-reply@example.local',
            to: toEmail,
            subject: 'Password reset request',
            text: `A password reset was requested for your account.\n\nReset your password: ${resetUrl}\n\nThis link expires at ${expires.toISOString()}.\nIf you did not request this, ignore this email.`
        });
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`Password reset email preview URL for ${toEmail}: ${previewUrl}`);
        }
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`Password reset email fallback active: ${err.message}`);
            console.log(`[DEV ONLY] Password reset link for ${toEmail}: ${resetUrl}`);
            return;
        }
        throw err;
    }
};

setupDb().then(database => {
    db = database;
    app.listen(port, () => {
        console.log(`HR Portal API listening at http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Failed to start database', err);
});

// Validation error handler middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// 1. Auth Endpoint (Public)
app.post('/api/auth/login', [
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validate
], async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                { email: user.email, role: user.role, name: user.name },
                ACCESS_TOKEN_SECRET,
                { expiresIn: '24h' }
            );

            const refreshToken = jwt.sign(
                { email: user.email },
                REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            );

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            if (user.two_factor_enabled) {
                return res.json({
                    success: true,
                    mfaRequired: true,
                    email: user.email
                });
            }

            logAudit(user.email, 'LOGIN_SUCCESS', `User logged in from ${req.ip}`);

            res.json({
                success: true,
                user: { email: user.email, name: user.name, role: user.role, avatar: user.avatar },
                token
            });
        } else {
            logAudit(email, 'LOGIN_FAILURE', `Invalid credentials from ${req.ip}`);
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        logAudit(req.body.email || 'unknown', 'LOGIN_FAILURE', `Error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 1.1 MFA Verification Login
app.post('/api/auth/2fa/login', [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }),
    validate
], async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user || !user.two_factor_secret) {
            return res.status(401).json({ success: false, message: 'MFA not setup' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: code
        });

        if (verified) {
            const token = jwt.sign(
                { email: user.email, role: user.role, name: user.name },
                ACCESS_TOKEN_SECRET,
                { expiresIn: '24h' }
            );

            logAudit(user.email, 'LOGIN_SUCCESS_MFA', `User logged in with MFA from ${req.ip}`);

            res.json({
                success: true,
                user: { email: user.email, name: user.name, role: user.role, avatar: user.avatar },
                token
            });
        } else {
            logAudit(user.email, 'LOGIN_FAILURE_MFA', `Invalid MFA code from ${req.ip}`);
            res.status(401).json({ success: false, message: 'Invalid MFA code' });
        }
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 1.2 MFA Setup & Verification
app.post('/api/auth/2fa/setup', authenticateToken, async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `THESL-HR:${req.user.email}`
        });

        const qrCodeData = await qrcode.toDataURL(secret.otpauth_url);

        res.json({
            success: true,
            secret: secret.base32,
            qrCode: qrCodeData
        });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/2fa/verify-setup', authenticateToken, [
    body('secret').notEmpty(),
    body('code').isLength({ min: 6, max: 6 }),
    validate
], async (req, res) => {
    const { secret, code } = req.body;
    try {
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: code
        });

        if (verified) {
            await db.run(
                'UPDATE users SET two_factor_secret = ?, two_factor_enabled = 1 WHERE email = ?',
                [secret, req.user.email]
            );
            logAudit(req.user.email, '2FA_ENABLED', `User ${req.user.email} enabled 2FA`);
            res.json({ success: true, message: '2FA enabled successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid code' });
        }
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/2fa/disable', authenticateToken, async (req, res) => {
    try {
        await db.run('UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE email = ?', [req.user.email]);
        logAudit(req.user.email, '2FA_DISABLED', `User ${req.user.email} disabled 2FA`);
        res.json({ success: true, message: '2FA disabled successfully' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 1.3 Password Recovery
app.post('/api/auth/forgot-password', authLimiter, [
    body('email').isEmail().normalizeEmail(),
    validate
], async (req, res) => {
    const { email } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.json({ success: true, message: 'If this email is registered, a reset link will be sent.' });
        }

        const resetTokenHash = crypto.createHash('sha256')
            .update(crypto.randomBytes(32).toString('hex'))
            .digest('hex');
        const signedReset = jwt.sign({ email: user.email, tokenHash: resetTokenHash }, RESET_TOKEN_SECRET, { expiresIn: '30m' });
        const expires = new Date(Date.now() + 30 * 60 * 1000);

        await db.run(
            'UPDATE users SET reset_token = NULL, reset_token_hash = ?, reset_token_expires = ? WHERE email = ?',
            [resetTokenHash, expires.toISOString(), email]
        );

        try {
            await sendResetEmail(email, signedReset, expires);
        } catch (mailErr) {
            logAudit(email, 'PW_RESET_EMAIL_FAILURE', `Password reset email send failed: ${mailErr.message}`);
            return res.status(500).json({ success: false, message: 'Unable to process reset request right now' });
        }

        logAudit(email, 'PW_RESET_REQUESTED', `Password reset requested from ${req.ip}`);

        res.json({ success: true, message: 'Reset link sent to your email.' });
    } catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/reset-password', authLimiter, [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }),
    validate
], async (req, res) => {
    const { token, password } = req.body;
    try {
        const decoded = jwt.verify(token, RESET_TOKEN_SECRET);
        if (!decoded?.email || !decoded?.tokenHash) {
            return res.status(400).json({ success: false, message: 'Invalid token' });
        }
        const user = await db.get('SELECT * FROM users WHERE email = ? AND reset_token_hash = ?', [decoded.email, decoded.tokenHash]);

        if (!user || new Date(user.reset_token_expires) < new Date()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_hash = NULL, reset_token_expires = NULL WHERE email = ?',
            [hashedPassword, decoded.email]
        );

        logAudit(decoded.email, 'PW_RESET_SUCCESS', `Password reset successfully from ${req.ip}`);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch {
        res.status(400).json({ success: false, message: 'Invalid token' });
    }
});

app.post('/api/auth/refresh', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
        if (err) {
            logAudit(decoded?.email || 'unknown', 'REFRESH_TOKEN_FAILURE', `Invalid or expired refresh token from ${req.ip}`);
            return res.status(403).json({ success: false, message: 'Invalid refresh token' });
        }

        try {
            const user = await db.get('SELECT * FROM users WHERE email = ?', [decoded.email]);
            if (!user) {
                logAudit(decoded.email, 'REFRESH_TOKEN_FAILURE', `User not found for refresh token from ${req.ip}`);
                return res.status(403).json({ success: false, message: 'User not found' });
            }

            const newToken = jwt.sign(
                { email: user.email, role: user.role, name: user.name },
                ACCESS_TOKEN_SECRET,
                { expiresIn: '24h' }
            );
            logAudit(user.email, 'REFRESH_TOKEN_SUCCESS', `Access token refreshed from ${req.ip}`);
            res.json({ success: true, token: newToken });
        } catch (dbErr) {
            logAudit(decoded.email, 'REFRESH_TOKEN_FAILURE', `DB Error: ${dbErr.message}`);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });
});

app.post('/api/auth/logout', (req, res) => {
    const userEmail = req.user?.email || 'unknown'; // Attempt to get user email if authenticated
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    logAudit(userEmail, 'LOGOUT', `User logged out from ${req.ip}`);
    res.json({ success: true, message: 'Logged out' });
});

// Protected API Routes
app.use('/api', authenticateToken);

// Profile Update
app.put('/api/user/profile', authenticateToken, [
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('name').notEmpty().withMessage('Name is required').trim().escape(),
    body('phone').optional().trim().escape(),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validate
], async (req, res) => {
    const { email, name, phone, password, avatar } = req.body;
    
    // IDOR Protection: Ensure user is only updating their own profile
    if (email !== req.user.email) {
        logAudit(req.user.email, 'PROFILE_UPDATE_ATTEMPT', `Forbidden attempt to update profile for ${email}`);
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot update another user\'s profile' });
    }
    
    let query = 'UPDATE users SET name = ?, phone = ?, avatar = ?';
    let params = [name, phone, avatar];
    
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += ', password = ?';
        params.push(hashedPassword);
    }
    
    query += ' WHERE email = ?';
    params.push(email);
    
    try {
        await db.run(query, params);
        const updatedUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        const { password: _, ...userWithoutPassword } = updatedUser; // Don't send password back
        logAudit(req.user.email, 'PROFILE_UPDATE', `Updated own profile`);
        res.json({ success: true, user: userWithoutPassword });
    } catch (err) {
        logAudit(req.user.email, 'PROFILE_UPDATE_FAILURE', `Error updating profile: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 1.2 User Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    const email = req.query.email || req.user.email;
    // Security: Ensure users can only see their own profile if not admin
    const targetEmail = req.user.role === 'admin' ? email : req.user.email;

    try {
        const user = await db.get('SELECT email, name, role, annual_balance, sick_balance, annual_used, sick_used, phone, avatar, two_factor_enabled FROM users WHERE email = ?', [targetEmail]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (err) {
        logAudit(req.user.email, 'PROFILE_VIEW_FAILURE', `Error viewing profile for ${targetEmail}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 2. Balances
app.get('/api/user/balances', authenticateToken, async (req, res) => {
    const email = req.query.email;
    // IDOR Protection: Users can only view their own balances unless admin
    if (req.user.role !== 'admin' && email !== req.user.email) {
        logAudit(req.user.email, 'BALANCE_VIEW_ATTEMPT', `Forbidden attempt to view balances for ${email}`);
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot view another user\'s balances' });
    }
    const targetEmail = req.user.role === 'admin' ? email : req.user.email;

    try {
        const user = await db.get('SELECT annual_balance, sick_balance, annual_used, sick_used FROM users WHERE email = ?', [targetEmail]);
        res.json(user || { annual_balance: 0, sick_balance: 0, annual_used: 0, sick_used: 0 });
    } catch (err) {
        logAudit(req.user.email, 'BALANCE_VIEW_FAILURE', `Error viewing balances for ${targetEmail}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 3. Announcements
app.get('/api/announcements', authenticateToken, async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM announcements ORDER BY date DESC');
        res.json(rows);
    } catch (err) {
        logAudit(req.user?.email || 'public', 'ANNOUNCEMENT_VIEW_FAILURE', `Error viewing announcements: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/announcements', authenticateToken, isAdmin, [
    body('type').isIn(['event', 'news', 'policy']).withMessage('Invalid announcement type'),
    body('title').notEmpty().withMessage('Title is required').trim().escape(),
    body('content').optional().trim().escape(),
    body('date').notEmpty().withMessage('Date is required').trim().escape(),
    validate
], async (req, res) => {
    const { type, title, content, date, author, pinned } = req.body;
    try {
        const result = await db.run(
            'INSERT INTO announcements (type, title, content, date, author, pinned) VALUES (?, ?, ?, ?, ?, ?)',
            [type, title, content || '', date, author || 'Admin', pinned ? 1 : 0]
        );
        
        // Notify everyone (this might be heavy, but let's assume it's okay for now)
        const allUsers = await db.all('SELECT email FROM users');
        for (const u of allUsers) {
            await createNotification(u.email, 'New Announcement 📢', title, 'info', result.lastID);
        }
        logAudit(req.user.email, 'ANNOUNCEMENT_CREATE', `Created announcement: ${title}`);
        res.json({ id: result.lastID, type, title, content, date, author, pinned });
    } catch (err) {
        logAudit(req.user.email, 'ANNOUNCEMENT_CREATE_FAILURE', `Error creating announcement: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 4. Requests
app.get('/api/requests', authenticateToken, async (req, res) => {
    try {
        let rows;
        if (req.user.role === 'admin' || req.user.role === 'manager') {
            // Admins and managers see all requests
            rows = await db.all('SELECT * FROM requests ORDER BY id DESC');
        } else {
            // Employees only see their own requests
            rows = await db.all('SELECT * FROM requests WHERE user_email = ? ORDER BY id DESC', [req.user.email]);
        }
        res.json(rows);
    } catch (err) {
        logAudit(req.user?.email || 'public', 'REQUEST_VIEW_FAILURE', `Error viewing requests: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/requests', authenticateToken, [
    body('title').notEmpty().withMessage('Title is required').trim().escape(),
    body('type').notEmpty().withMessage('Request type is required').trim().escape(),
    body('status').notEmpty().withMessage('Status is required').trim().escape(),
    validate
], async (req, res) => {
    const { title, type, status, date } = req.body;
    const user_email = req.user.email; // IDOR Protection: always use authenticated user
    const user_name = req.user.name;
    try {
        const result = await db.run(
            'INSERT INTO requests (title, type, status, date, user_email, user_name) VALUES (?, ?, ?, ?, ?, ?)',
            [title, type, status, date, user_email, user_name]
        );
        logAudit(req.user.email, 'REQUEST_CREATE', `Created request: ${title}`);
        res.json({ id: result.lastID, title, type, status, date, user_email, user_name });
    } catch (err) {
        logAudit(req.user.email, 'REQUEST_CREATE_FAILURE', `Error creating request: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 5. Annual Leave
app.get('/api/leave/annual', authenticateToken, async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM annual_leave ORDER BY id DESC');
        // Map from lowercase DB columns to camelCase expected by the UI
        const mappedRows = rows.map(r => ({
            ...r,
            startDate: r.startdate,
            endDate: r.enddate,
            submitDate: r.submitdate
        }));
        res.json(mappedRows);
    } catch (err) {
        logAudit(req.user?.email || 'public', 'ANNUAL_LEAVE_VIEW_FAILURE', `Error viewing annual leave: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/leave/annual', authenticateToken, [
    body('user_email').isEmail().normalizeEmail(),
    body('startDate').isISO8601().withMessage('Invalid start date'),
    body('endDate').isISO8601().withMessage('Invalid end date'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
    body('reason').optional().trim().escape(),
    validate
], async (req, res) => {
    const { startDate, endDate, duration, reason, status, submitDate } = req.body;
    const user_email = req.user.email; // IDOR Protection: Use authenticated email
    const name = req.user.name;       // Use authenticated name
    
    try {
        const result = await db.run(
            'INSERT INTO annual_leave (user_email, startdate, enddate, duration, reason, status, submitdate) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_email, startDate, endDate, duration, reason, status || 'Pending', submitDate]
        );
        
        await db.run(
            'INSERT INTO pending_approvals (reference_id, user_email, name, type, duration, details, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [result.lastID, user_email, name, 'Annual', duration, `Annual Leave: ${startDate} to ${endDate}`, submitDate]
        );
        
        const admins = await db.all('SELECT email FROM users WHERE role IN (?, ?)', ['admin', 'manager']);
        for (const admin of admins) {
            await createNotification(admin.email, 'New Leave Request! 📅', `${req.user.name} submitted an Annual Leave request.`, 'info', result.lastID);
        }
        logAudit(req.user.email, 'ANNUAL_LEAVE_REQUEST', `Requested annual leave from ${startDate} to ${endDate}`);
        res.json({ id: result.lastID, user_email, startDate, endDate, duration, reason, status, submitDate });
    } catch (err) {
        logAudit(req.user.email, 'ANNUAL_LEAVE_REQUEST_FAILURE', `Error requesting annual leave: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 6. Sick Leave
app.get('/api/leave/sick', authenticateToken, async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM sick_leave ORDER BY id DESC');
        const mappedRows = rows.map(r => ({
            ...r,
            fileName: r.filename
        }));
        res.json(mappedRows);
    } catch (err) {
        logAudit(req.user?.email || 'public', 'SICK_LEAVE_VIEW_FAILURE', `Error viewing sick leave: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/leave/sick', authenticateToken, [
    body('user_email').isEmail().normalizeEmail(),
    body('type').notEmpty().withMessage('Sick leave type is required').trim().escape(),
    body('duration').isInt({ min: 0 }).withMessage('Duration must be a non-negative integer'),
    body('date').notEmpty().withMessage('Date is required').trim().escape(),
    validate
], async (req, res) => {
    const { type, duration, fileName, status, date } = req.body;
    const user_email = req.user.email; // IDOR Protection
    const name = req.user.name;
    
    try {
        const result = await db.run(
            'INSERT INTO sick_leave (user_email, type, duration, filename, status, date) VALUES (?, ?, ?, ?, ?, ?)',
            [user_email, type, duration, fileName, status || 'Pending', date]
        );
        
        await db.run(
            'INSERT INTO pending_approvals (reference_id, user_email, name, type, duration, details, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [result.lastID, user_email, name, 'Sick', duration, `Sick Leave: ${type} on ${date}`, date]
        );
        
        const admins = await db.all('SELECT email FROM users WHERE role IN (?, ?)', ['admin', 'manager']);
        for (const admin of admins) {
            await createNotification(admin.email, 'New Sick Leave! 🤒', `${req.user.name} recorded a Sick Leave instance.`, 'error', result.lastID);
        }
        logAudit(req.user.email, 'SICK_LEAVE_REQUEST', `Requested sick leave for ${duration} days on ${date}`);
        res.json({ id: result.lastID, user_email, type, duration, fileName, status, date });
    } catch (err) {
        logAudit(req.user.email, 'SICK_LEAVE_REQUEST_FAILURE', `Error requesting sick leave: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 7. Lateness Tracker
app.get('/api/lateness', authenticateToken, async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM lateness ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        logAudit(req.user?.email || 'public', 'LATENESS_VIEW_FAILURE', `Error viewing lateness records: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/lateness', authenticateToken, [
    body('time').notEmpty().withMessage('Time is required').trim().escape(),
    body('date').notEmpty().withMessage('Date is required').trim().escape(),
    body('lateness').isInt({ min: 0 }).withMessage('Lateness must be a non-negative integer'),
    body('status').notEmpty().withMessage('Status is required').trim().escape(),
    validate
], async (req, res) => {
    const { time, date, lateness, status } = req.body;
    try {
        const result = await db.run(
            'INSERT INTO lateness (time, date, lateness, status) VALUES (?, ?, ?, ?)',
            [time, date, lateness, status]
        );
        logAudit(req.user.email, 'LATENESS_RECORD_CREATE', `Recorded lateness for ${date} at ${time}`);
        res.json({ id: result.lastID, time, date, lateness, status });
    } catch (err) {
        logAudit(req.user.email, 'LATENESS_RECORD_CREATE_FAILURE', `Error creating lateness record: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 8. Admin/Manager Dashboard Approvals
app.get('/api/admin/audit-logs', authenticateToken, isAdmin, async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 500');
        res.json(rows);
    } catch (err) {
        logAudit(req.user.email, 'AUDIT_LOG_VIEW_FAILURE', `Error viewing audit logs: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.get('/api/admin/pending', authenticateToken, isManager, async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM pending_approvals');
        res.json(rows);
    } catch (err) {
        logAudit(req.user.email, 'PENDING_APPROVALS_VIEW_FAILURE', `Error viewing pending approvals: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/admin/action', authenticateToken, isManager, [
    body('id').isInt().withMessage('Invalid request ID'),
    body('action').isIn(['Approve', 'Reject']).withMessage('Invalid action'),
    validate
], async (req, res) => {
    const { id, action } = req.body;
    
    try {
        const pending = await db.get('SELECT * FROM pending_approvals WHERE id = ?', [id]);
        if (!pending) {
            return res.status(404).json({ success: false, message: 'Pending approval not found' });
        }

        if (action === 'Approve') {
            if (pending.type === 'Annual') {
                await db.run('UPDATE annual_leave SET status = ? WHERE id = ?', ['Approved', pending.reference_id]);
                const user = await db.get('SELECT annual_balance, annual_used FROM users WHERE email = ?', [pending.user_email]);
                if (user) {
                    await db.run('UPDATE users SET annual_balance = ?, annual_used = ? WHERE email = ?', 
                        [user.annual_balance - pending.duration, user.annual_used + pending.duration, pending.user_email]);
                }
            } else if (pending.type === 'Sick') {
                await db.run('UPDATE sick_leave SET status = ? WHERE id = ?', ['Approved', pending.reference_id]);
                const user = await db.get('SELECT sick_balance, sick_used FROM users WHERE email = ?', [pending.user_email]);
                if (user) {
                    await db.run('UPDATE users SET sick_balance = ?, sick_used = ? WHERE email = ?', 
                        [user.sick_balance - pending.duration, user.sick_used + pending.duration, pending.user_email]);
                }
            }
            await createNotification(pending.user_email, 'Leave Approved ✅', `Your ${pending.type} leave has been approved.`, 'success');
            logAudit(req.user.email, 'APPROVAL_ACTION', `Approved ${pending.type} request for ${pending.user_email} (ID: ${pending.reference_id})`);
        } else if (action === 'Reject') {
            if (pending.type === 'Annual') {
                await db.run('UPDATE annual_leave SET status = ? WHERE id = ?', ['Rejected', pending.reference_id]);
            } else if (pending.type === 'Sick') {
                await db.run('UPDATE sick_leave SET status = ? WHERE id = ?', ['Rejected', pending.reference_id]);
            }
            await createNotification(pending.user_email, 'Leave Rejected ❌', `Your ${pending.type} leave has been rejected.`, 'error');
            logAudit(req.user.email, 'APPROVAL_ACTION', `Rejected ${pending.type} request for ${pending.user_email} (ID: ${pending.reference_id})`);
        }
        
        await db.run('DELETE FROM pending_approvals WHERE id = ?', [id]);
        const remaining = await db.all('SELECT * FROM pending_approvals');
        res.json({ success: true, pendingApprovals: remaining });
    } catch (err) {
        logAudit(req.user.email, 'APPROVAL_ACTION_FAILURE', `Error processing approval action for ID ${id}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 9. Performance Reviews
app.get('/api/users', authenticateToken, isManager, async (req, res) => {
    // For admin dropdowns
    try {
        const rows = await db.all('SELECT email, name FROM users WHERE role = ?', ['employee']);
        res.json(rows);
    } catch (err) {
        logAudit(req.user.email, 'USER_LIST_VIEW_FAILURE', `Error viewing user list: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.get('/api/performance', authenticateToken, async (req, res) => {
    const { email } = req.query;
    
    // Security: Ensure users can only see their own performance if not admin
    const targetEmail = req.user.role === 'admin' ? (email || req.user.email) : req.user.email;
    
    let rows = [];
    try {
        let rawRows = [];
        if (req.user.role === 'admin') {
            rawRows = await db.all('SELECT * FROM performance_reviews ORDER BY id DESC');
        } else if (req.user.role === 'manager') {
            rawRows = await db.all('SELECT * FROM performance_reviews WHERE user_email = ? OR manager_email = ? ORDER BY id DESC', [targetEmail, req.user.email]);
        } else {
            rawRows = await db.all('SELECT * FROM performance_reviews WHERE user_email = ? ORDER BY id DESC', [targetEmail]);
        }

        // Fetch user data manually to bypass Supabase schema JOIN limitations
        const allUsers = await db.all('SELECT email, name FROM users');
        const userMap = {};
        allUsers.forEach(u => userMap[u.email] = u.name);

        rows = rawRows.map(row => ({
            ...row,
            user_name: userMap[row.user_email] || 'Unknown User'
        }));
        
        res.json(rows);
    } catch (err) {
        logAudit(req.user.email, 'PERFORMANCE_REVIEW_VIEW_FAILURE', `Error viewing performance reviews for ${targetEmail}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/performance/init', authenticateToken, isManager, [
    body('user_email').isEmail().normalizeEmail(),
    body('manager_email').isEmail().normalizeEmail(),
    body('period').notEmpty().withMessage('Period is required').trim().escape(),
    validate
], async (req, res) => {
    const { user_email, manager_email, period, date } = req.body;
    try {
        const result = await db.run(
            'INSERT INTO performance_reviews (user_email, manager_email, period, status, date) VALUES (?, ?, ?, ?, ?)',
            [user_email, manager_email, period, 'Awaiting Employee', date]
        );

        await db.run(
            'INSERT INTO pending_approvals (user_email, name, type, details, date) VALUES (?, ?, ?, ?, ?)',
            [user_email, user_email, 'Performance', `Complete Self Assessment for ${period}`, date]
        );
        logAudit(req.user.email, 'PERFORMANCE_REVIEW_INIT', `Initiated performance review for ${user_email} for period ${period}`);
        res.json({ id: result.lastID, success: true });
    } catch (err) {
        logAudit(req.user.email, 'PERFORMANCE_REVIEW_INIT_FAILURE', `Error initiating performance review for ${user_email}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.put('/api/performance/employee', authenticateToken, [
    body('id').isInt().withMessage('Invalid review ID'),
    body('self_assessment').notEmpty().withMessage('Self assessment is required').trim().escape(),
    validate
], async (req, res) => {
    const { id, self_assessment } = req.body;
    
    try {
        // Ownership check
        const review = await db.get('SELECT * FROM performance_reviews WHERE id = ?', [id]);
        if (!review || review.user_email !== req.user.email) {
            logAudit(req.user.email, 'PERFORMANCE_SELF_ASSESS_ATTEMPT', `Forbidden attempt to update review ID ${id}`);
            return res.status(403).json({ success: false, message: 'Forbidden: Cannot update another user\'s performance review' });
        }

        await db.run(
            'UPDATE performance_reviews SET self_assessment = ?, status = ? WHERE id = ?',
            [self_assessment, 'Awaiting Manager', id]
        );
        
        // Alert Admin
        await db.run(
            'INSERT INTO pending_approvals (reference_id, user_email, name, type, details, date) VALUES (?, ?, ?, ?, ?, ?)',
            [id, review.user_email, 'Administrator', 'Performance', `Action Required: Finalize ${review.period} for ${review.user_email}`, new Date().toLocaleDateString('en-US')]
        );
        logAudit(req.user.email, 'PERFORMANCE_SELF_ASSESS', `Completed self-assessment for review ID ${id}`);
        res.json({ success: true });
    } catch (err) {
        logAudit(req.user.email, 'PERFORMANCE_SELF_ASSESS_FAILURE', `Error completing self-assessment for review ID ${id}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.put('/api/performance/manager', authenticateToken, isManager, [
    body('id').isInt().withMessage('Invalid review ID'),
    body('manager_feedback').notEmpty().withMessage('Manager feedback is required').trim().escape(),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    validate
], async (req, res) => {
    const { id, manager_feedback, rating } = req.body;
    try {
        await db.run(
            'UPDATE performance_reviews SET manager_feedback = ?, rating = ?, status = ? WHERE id = ?',
            [manager_feedback, rating, 'Completed', id]
        );
        // Clear the pending approval
        await db.run('DELETE FROM pending_approvals WHERE reference_id = ? AND type = ?', [id, 'Performance']);
        logAudit(req.user.email, 'PERFORMANCE_MANAGER_FEEDBACK', `Provided manager feedback for review ID ${id}`);
        res.json({ success: true });
    } catch (err) {
        logAudit(req.user.email, 'PERFORMANCE_MANAGER_FEEDBACK_FAILURE', `Error providing manager feedback for review ID ${id}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 10. Documents — all authenticated users can upload
app.post('/api/documents/upload', authenticateToken, (req, res) => {
    upload.single('file')(req, res, async (uploadErr) => {
        if (uploadErr instanceof multer.MulterError && uploadErr.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File exceeds 20MB size limit' });
        }
        if (uploadErr) {
            return res.status(400).json({ success: false, message: uploadErr.message || 'Invalid file upload' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'A valid file is required' });
        }
        const title = typeof req.body.title === 'string' ? req.body.title.trim().slice(0, 120) : '';
        if (!title) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }
        const category = typeof req.body.category === 'string' ? req.body.category.trim().slice(0, 60) : 'General';
        const { filename, size, originalname } = req.file;
        const date = new Date().toLocaleDateString('en-US');
        const uploaded_by = req.user.name || req.user.email;
        const user_email = req.user.email;
        // Admin/Manager uploads = company docs (visible to all); Employee = personal doc
        const is_company_doc = (req.user.role === 'admin' || req.user.role === 'manager') ? 1 : 0;
        try {
            await db.run(
                'INSERT INTO documents (title, filename, size, date, category, uploaded_by, original_name, user_email, is_company_doc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [title, filename, size, date, category, uploaded_by, originalname, user_email, is_company_doc]
            );
            logAudit(req.user.email, 'DOCUMENT_UPLOAD', `Uploaded document: ${title} (${filename}) [company=${is_company_doc}]`);
            res.json({ success: true });
        } catch (err) {
            logAudit(req.user.email, 'DOCUMENT_UPLOAD_FAILURE', `Error uploading document ${filename}: ${err.message}`);
            res.status(500).json({ success: false, message: 'Database error' });
        }
    });
});

app.get('/api/documents', authenticateToken, async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM documents ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        logAudit(req.user?.email || 'public', 'DOCUMENT_VIEW_FAILURE', `Error viewing documents: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.get('/api/documents/download/:filename', authenticateToken, (req, res) => {
    const safeFilename = path.basename(req.params.filename);
    const filepath = path.join(uploadDir, safeFilename);
    if (fs.existsSync(filepath)) {
        logAudit(req.user.email, 'DOCUMENT_DOWNLOAD', `Downloaded document: ${safeFilename}`);
        res.download(filepath);
    } else {
        logAudit(req.user.email, 'DOCUMENT_DOWNLOAD_FAILURE', `Attempted to download non-existent document: ${safeFilename}`);
        res.status(404).json({ success: false, message: 'File not found' });
    }
});

// Admins can delete any doc; employees can only delete their own personal docs
app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const doc = await db.get('SELECT * FROM documents WHERE id = ?', [id]);
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

        // Authorisation: admin deletes anything; owner deletes their own
        const isOwner = doc.user_email && doc.user_email === req.user.email;
        if (req.user.role !== 'admin' && !isOwner) {
            logAudit(req.user.email, 'DOCUMENT_DELETE_FORBIDDEN', `Attempted to delete doc ID ${id} owned by ${doc.user_email}`);
            return res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own documents' });
        }

        const filepath = path.join(uploadDir, doc.filename);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        await db.run('DELETE FROM documents WHERE id = ?', [id]);
        logAudit(req.user.email, 'DOCUMENT_DELETE', `Deleted document: ${doc.title} (${doc.filename})`);
        res.json({ success: true });
    } catch (err) {
        logAudit(req.user.email, 'DOCUMENT_DELETE_FAILURE', `Error deleting document ID ${id}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 13. Compliments (Performance-based Commission)
app.get('/api/compliments', authenticateToken, async (req, res) => {
    try {
        let rows;
        if (req.user.role === 'admin' || req.user.role === 'manager') {
            rows = await db.all('SELECT * FROM compliments ORDER BY id DESC');
        } else {
            rows = await db.all('SELECT * FROM compliments WHERE status IN (?, ?) ORDER BY id DESC', ['approved', req.user.email]);
            // Re-fetch because SQL queries with IN clauses can be tricky with different logic needs:
            // For regular employees, we return all approved OR pending ones that they either gave or received
            rows = await db.all('SELECT * FROM compliments WHERE status = ? OR recipient_email = ? OR given_by_email = ? ORDER BY id DESC', 
                ['approved', req.user.email, req.user.email]);
        }
        res.json(rows);
    } catch (err) {
        logAudit(req.user?.email || 'public', 'COMPLIMENT_VIEW_FAILURE', `Error viewing compliments: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/compliments', authenticateToken, [
    body('recipient_email').isEmail().normalizeEmail(),
    body('recipient_name').notEmpty().trim().escape(),
    body('category').isIn(['Sales Achievement', 'Client Satisfaction', 'Team Leadership', 'Innovation', 'Above & Beyond', 'Perfect Attendance', 'Top Performer']).withMessage('Invalid category'),
    body('message').notEmpty().trim().escape(),
    body('bonus_amount').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Bonus must be a positive number'),
    body('period').notEmpty().withMessage('Monthly period is required'),
    validate
], async (req, res) => {
    const { recipient_email, recipient_name, category, message, bonus_amount, period } = req.body;
    const given_by = req.user.name || req.user.email;
    const given_by_email = req.user.email;
    const date = new Date().toLocaleDateString('en-US');
    
    // Auto-approve if manager/admin
    const status = (req.user.role === 'admin' || req.user.role === 'manager') ? 'approved' : 'pending';

    try {
        const result = await db.run(
            'INSERT INTO compliments (recipient_email, recipient_name, given_by, given_by_email, category, message, bonus_amount, date, status, period) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [recipient_email, recipient_name, given_by, given_by_email, category, message, bonus_amount || null, date, status, period]
        );
        
        const isApproved = status === 'approved';
        if (isApproved) {
            await createNotification(
                recipient_email, 
                'New Recognition! 🏆', 
                `You received a recognition from ${req.user.name} for ${category}.`,
                'success',
                result.lastID
            );
        }

        logAudit(req.user.email, 'COMPLIMENT_CREATE', `Gave compliment to ${recipient_email}: ${category} (Status: ${status})`);
        res.json({ success: true, id: result.lastID, status });
    } catch (err) {
        logAudit(req.user.email, 'COMPLIMENT_CREATE_FAILURE', `Error creating compliment: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Admin Approve Compliment
app.put('/api/compliments/:id/approve', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('UPDATE compliments SET status = ? WHERE id = ?', ['approved', id]);
        
        const comp = await db.get('SELECT * FROM compliments WHERE id = ?', [id]);
        if (comp) {
            await createNotification(
                comp.recipient_email,
                'Recognition Approved! ✨',
                `Your recognition for ${comp.category} has been approved.`,
                'success',
                id
            );
        }
        
        logAudit(req.user.email, 'COMPLIMENT_APPROVE', `Approved compliment ID ${id}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.delete('/api/compliments/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('DELETE FROM compliments WHERE id = ?', [id]);
        logAudit(req.user.email, 'COMPLIMENT_DELETE', `Deleted compliment ID ${id}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Recipient adds/updates their own comment on a compliment
app.put('/api/compliments/:id/comment', authenticateToken, [
    body('recipient_comment').notEmpty().trim().escape(),
    validate
], async (req, res) => {
    const { id } = req.params;
    const { recipient_comment } = req.body;
    try {
        // Verify this user is the recipient
        const comp = await db.get('SELECT * FROM compliments WHERE id = ?', [id]);
        if (!comp) return res.status(404).json({ success: false, message: 'Not found' });
        if (comp.recipient_email !== req.user.email) {
            return res.status(403).json({ success: false, message: 'You can only comment on your own compliments' });
        }
        await db.run('UPDATE compliments SET recipient_comment = ? WHERE id = ?', [recipient_comment, id]);
        logAudit(req.user.email, 'COMPLIMENT_COMMENT', `Added response to compliment ID ${id}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 11. User Management (Admin Only)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const rows = await db.all('SELECT email, name, role, team, annual_balance, sick_balance, annual_used, sick_used, phone FROM users');
        res.json(rows);
    } catch (err) {
        logAudit(req.user.email, 'ADMIN_USER_LIST_VIEW_FAILURE', `Error viewing admin user list: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/admin/users', authenticateToken, isAdmin, [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
    body('role').isIn(['employee', 'manager', 'admin']),
    validate
], async (req, res) => {
    const { email, password, name, role, team } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await db.run(
            'INSERT INTO users (email, password, role, name, team, annual_balance, sick_balance) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, role, name, team || '', 15, 10]
        );
        logAudit(req.user.email, 'ADMIN_USER_CREATE', `Created user: ${email} with role ${role}`);
        res.json({ success: true });
    } catch (err) {
        logAudit(req.user.email, 'ADMIN_USER_CREATE_FAILURE', `Error creating user ${email}: ${err.message}`);
        res.status(500).json({ success: false, message: 'User already exists or DB error' });
    }
});

app.post('/api/admin/accrue-leave', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await db.all('SELECT email, annual_balance, sick_balance FROM users');
        for (const user of users) {
            // Adds +15 Annual Leave and +10 Sick Leave (averaging 30 per 36 months)
            const newAnnual = (user.annual_balance || 0) + 15;
            const newSick = (user.sick_balance || 0) + 10;
            await db.run('UPDATE users SET annual_balance = ?, sick_balance = ? WHERE email = ?', [newAnnual, newSick, user.email]);
        }
        logAudit(req.user.email, 'LEAVE_ACCRUED_GLOBALLY', 'Triggered annual leave allocation (15 Annual, 10 Sick)');
        res.json({ success: true, message: 'Company-wide leave accrued (+15 Annual, +10 Sick days)' });
    } catch (err) {
        console.error('Accrual Error:', err);
        res.status(500).json({ success: false, message: 'Database error while allocating leave.' });
    }
});

app.put('/api/admin/users/:email', authenticateToken, isAdmin, [
    body('name').notEmpty(),
    body('role').isIn(['employee', 'manager', 'admin']),
    validate
], async (req, res) => {
    const { email } = req.params;
    const { name, role, phone, annual_balance, sick_balance, team } = req.body;
    try {
        const oldUser = await db.get('SELECT role FROM users WHERE email = ?', [email]);
        await db.run(
            'UPDATE users SET name = ?, role = ?, phone = ?, annual_balance = ?, sick_balance = ?, team = ? WHERE email = ?',
            [name, role, phone, annual_balance, sick_balance, team || '', email]
        );
        
        if (oldUser && oldUser.role !== role) {
            logAudit(req.user.email, 'ADMIN_ROLE_CHANGE', `Admin ${req.user.email} changed ${email} role from ${oldUser.role} to ${role}`);
        } else {
            logAudit(req.user.email, 'ADMIN_USER_UPDATE', `Admin ${req.user.email} updated user ${email}`);
        }

        res.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
        logAudit(req.user.email, 'ADMIN_USER_UPDATE_FAILURE', `Error updating user ${email}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.delete('/api/admin/users/:email', authenticateToken, isAdmin, async (req, res) => {
    const { email } = req.params;
    if (email === req.user.email) {
        logAudit(req.user.email, 'ADMIN_USER_DELETE_ATTEMPT', `Attempted to delete own account: ${email}`);
        return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    try {
        await db.run('DELETE FROM users WHERE email = ?', [email]);
        logAudit(req.user.email, 'ADMIN_USER_DELETE', `Deleted user ${email}`);
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        logAudit(req.user.email, 'ADMIN_USER_DELETE_FAILURE', `Error deleting user ${email}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 12. Calendar
app.get('/api/calendar', authenticateToken, async (req, res) => {
    try {
        const announcements = await db.all('SELECT title, date FROM announcements');
        const annualLeaves = await db.all('SELECT * FROM annual_leave WHERE status = "Approved"');
        const sickLeaves = await db.all('SELECT * FROM sick_leave WHERE status = "Approved"');
        
        const events = [];
        announcements.forEach(a => {
            events.push({
                title: '[Event] ' + a.title,
                start: new Date(a.date),
                end: new Date(a.date),
                allDay: true,
                type: 'event'
            });
        });
        annualLeaves.forEach(l => {
            events.push({
                title: `[Leave] ${l.user_email.split('@')[0]}`,
                start: new Date(l.startDate),
                end: new Date(l.endDate),
                allDay: true,
                type: 'leave'
            });
        });
        sickLeaves.forEach(s => {
            events.push({
                title: `[Sick] ${s.user_email.split('@')[0]}`,
                start: new Date(s.date),
                end: new Date(s.date),
                allDay: true,
                type: 'sick'
            });
        });
        res.json(events);
    } catch (err) {
        logAudit(req.user?.email || 'public', 'CALENDAR_VIEW_FAILURE', `Error viewing calendar: ${err.message}`);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 14. Notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM notifications WHERE user_email = ? ORDER BY created_at DESC LIMIT 50', [req.user.email]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        await db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_email = ?', [req.params.id, req.user.email]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        await db.run('UPDATE notifications SET is_read = 1 WHERE user_email = ?', [req.user.email]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

async function createNotification(email, title, message, type = 'info', relatedId = null) {
    if (!db) return;
    try {
        await db.run(
            'INSERT INTO notifications (user_email, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)',
            [email, title, message, type, relatedId]
        );
    } catch (err) {
        console.error('Notification creation failed', err);
    }
}

// Catch-all handler for any request that doesn't match an API route
if (fs.existsSync(distPath)) {
    app.use((req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        } else {
            res.status(404).json({ error: 'API route not found' });
        }
    });
}
