import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { setupDb } from './db.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const uploadDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

let db;

setupDb().then(database => {
    db = database;
    app.listen(port, () => {
        console.log(`HR Portal API listening at http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Failed to start database', err);
});

// 1. Auth Endpoint
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Profile Update
app.put('/api/user/profile', async (req, res) => {
    const { email, name, phone, password, avatar } = req.body;
    let query = 'UPDATE users SET name = ?, phone = ?, avatar = ?';
    let params = [name, phone, avatar];
    
    if (password) {
        query += ', password = ?';
        params.push(password);
    }
    
    query += ' WHERE email = ?';
    params.push(email);
    
    try {
        await db.run(query, params);
        const updatedUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 2. Balances
app.get('/api/user/balances', async (req, res) => {
    const email = req.query.email;
    const user = await db.get('SELECT annual_balance, sick_balance, annual_used, sick_used FROM users WHERE email = ?', [email]);
    res.json(user || { annual_balance: 0, sick_balance: 0, annual_used: 0, sick_used: 0 });
});

// 3. Announcements
app.get('/api/announcements', async (req, res) => {
    const rows = await db.all('SELECT * FROM announcements ORDER BY date DESC');
    res.json(rows);
});

app.post('/api/announcements', async (req, res) => {
    const { type, title, content, date, author, pinned } = req.body;
    try {
        const result = await db.run(
            'INSERT INTO announcements (type, title, content, date, author, pinned) VALUES (?, ?, ?, ?, ?, ?)',
            [type, title, content || '', date, author || 'Admin', pinned ? 1 : 0]
        );
        res.json({ id: result.lastID, type, title, content, date, author, pinned });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// 4. Requests
app.get('/api/requests', async (req, res) => {
    const rows = await db.all('SELECT * FROM requests ORDER BY id DESC');
    res.json(rows);
});

app.post('/api/requests', async (req, res) => {
    const { title, type, status, date } = req.body;
    const result = await db.run(
        'INSERT INTO requests (title, type, status, date) VALUES (?, ?, ?, ?)',
        [title, type, status, date]
    );
    res.json({ id: result.lastID, title, type, status, date });
});

// 5. Annual Leave
app.get('/api/leave/annual', async (req, res) => {
    const rows = await db.all('SELECT * FROM annual_leave ORDER BY id DESC');
    res.json(rows);
});

app.post('/api/leave/annual', async (req, res) => {
    const { user_email, name, startDate, endDate, duration, reason, status, submitDate } = req.body;
    const result = await db.run(
        'INSERT INTO annual_leave (user_email, startDate, endDate, duration, reason, status, submitDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_email, startDate, endDate, duration, reason, status, submitDate]
    );
    
    await db.run(
        'INSERT INTO pending_approvals (reference_id, user_email, name, type, duration, details, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [result.lastID, user_email, name, 'Annual', duration, `Annual Leave: ${startDate} to ${endDate}`, submitDate]
    );

    res.json({ id: result.lastID, user_email, startDate, endDate, duration, reason, status, submitDate });
});

// 6. Sick Leave
app.get('/api/leave/sick', async (req, res) => {
    const rows = await db.all('SELECT * FROM sick_leave ORDER BY id DESC');
    res.json(rows);
});

app.post('/api/leave/sick', async (req, res) => {
    const { user_email, name, type, duration, fileName, status, date } = req.body;
    const result = await db.run(
        'INSERT INTO sick_leave (user_email, type, duration, fileName, status, date) VALUES (?, ?, ?, ?, ?, ?)',
        [user_email, type, duration, fileName, status, date]
    );
    
    await db.run(
        'INSERT INTO pending_approvals (reference_id, user_email, name, type, duration, details, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [result.lastID, user_email, name, 'Sick', duration, type, date]
    );

    res.json({ id: result.lastID, user_email, type, duration, fileName, status, date });
});

// 7. Lateness Tracker
app.get('/api/lateness', async (req, res) => {
    const rows = await db.all('SELECT * FROM lateness ORDER BY id DESC');
    res.json(rows);
});

app.post('/api/lateness', async (req, res) => {
    const { time, date, lateness, status } = req.body;
    const result = await db.run(
        'INSERT INTO lateness (time, date, lateness, status) VALUES (?, ?, ?, ?)',
        [time, date, lateness, status]
    );
    res.json({ id: result.lastID, time, date, lateness, status });
});

// 8. Admin Dashboard Approvals
app.get('/api/admin/pending', async (req, res) => {
    const rows = await db.all('SELECT * FROM pending_approvals');
    res.json(rows);
});

app.post('/api/admin/action', async (req, res) => {
    const { id, action } = req.body;
    
    if (action === 'Approve') {
        const pending = await db.get('SELECT * FROM pending_approvals WHERE id = ?', [id]);
        if (pending) {
            if (pending.type === 'Annual') {
                await db.run('UPDATE annual_leave SET status = ? WHERE id = ?', ['Approved', pending.reference_id]);
                await db.run('UPDATE users SET annual_balance = annual_balance - ?, annual_used = annual_used + ? WHERE email = ?', [pending.duration, pending.duration, pending.user_email]);
            } else if (pending.type === 'Sick') {
                await db.run('UPDATE sick_leave SET status = ? WHERE id = ?', ['Approved', pending.reference_id]);
                await db.run('UPDATE users SET sick_balance = sick_balance - ?, sick_used = sick_used + ? WHERE email = ?', [pending.duration, pending.duration, pending.user_email]);
            }
        }
    } else if (action === 'Reject') {
        const pending = await db.get('SELECT * FROM pending_approvals WHERE id = ?', [id]);
        if (pending) {
            if (pending.type === 'Annual') {
                await db.run('UPDATE annual_leave SET status = ? WHERE id = ?', ['Rejected', pending.reference_id]);
            } else if (pending.type === 'Sick') {
                await db.run('UPDATE sick_leave SET status = ? WHERE id = ?', ['Rejected', pending.reference_id]);
            }
        }
    }
    
    await db.run('DELETE FROM pending_approvals WHERE id = ?', [id]);
    const remaining = await db.all('SELECT * FROM pending_approvals');
    res.json({ success: true, pendingApprovals: remaining });
});

// 9. Performance Reviews
app.get('/api/users', async (req, res) => {
    // For admin dropdowns
    const rows = await db.all('SELECT email, name FROM users WHERE role = ?', ['employee']);
    res.json(rows);
});

app.get('/api/performance', async (req, res) => {
    const { email, role } = req.query;
    let rows = [];
    if (role === 'admin') {
        rows = await db.all('SELECT p.*, u.name as user_name FROM performance_reviews p LEFT JOIN users u ON p.user_email = u.email ORDER BY p.id DESC');
    } else {
        rows = await db.all('SELECT p.*, u.name as user_name FROM performance_reviews p LEFT JOIN users u ON p.user_email = u.email WHERE p.user_email = ? ORDER BY p.id DESC', [email]);
    }
    res.json(rows);
});

app.post('/api/performance/init', async (req, res) => {
    const { user_email, manager_email, period, date } = req.body;
    const result = await db.run(
        'INSERT INTO performance_reviews (user_email, manager_email, period, status, date) VALUES (?, ?, ?, ?, ?)',
        [user_email, manager_email, period, 'Awaiting Employee', date]
    );

    await db.run(
        'INSERT INTO pending_approvals (user_email, name, type, details, date) VALUES (?, ?, ?, ?, ?)',
        [user_email, user_email, 'Performance', `Complete Self Assessment for ${period}`, date]
    );

    res.json({ id: result.lastID, success: true });
});

app.put('/api/performance/employee', async (req, res) => {
    const { id, self_assessment } = req.body;
    await db.run(
        'UPDATE performance_reviews SET self_assessment = ?, status = ? WHERE id = ?',
        [self_assessment, 'Awaiting Manager', id]
    );
    
    // Alert Admin
    const review = await db.get('SELECT * FROM performance_reviews WHERE id = ?', [id]);
    await db.run(
        'INSERT INTO pending_approvals (reference_id, user_email, name, type, details, date) VALUES (?, ?, ?, ?, ?, ?)',
        [id, review.user_email, 'Administrator', 'Performance', `Action Required: Finalize ${review.period} for ${review.user_email}`, new Date().toLocaleDateString('en-US')]
    );
    res.json({ success: true });
});

app.put('/api/performance/manager', async (req, res) => {
    const { id, manager_feedback, rating } = req.body;
    await db.run(
        'UPDATE performance_reviews SET manager_feedback = ?, rating = ?, status = ? WHERE id = ?',
        [manager_feedback, rating, 'Completed', id]
    );
    // Clear the pending approval
    await db.run('DELETE FROM pending_approvals WHERE reference_id = ? AND type = ?', [id, 'Performance']);
    res.json({ success: true });
});

// 10. Documents
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
    const { title } = req.body;
    const { filename, size } = req.file;
    const date = new Date().toLocaleDateString('en-US');
    await db.run('INSERT INTO documents (title, filename, size, date) VALUES (?, ?, ?, ?)', [title, filename, size, date]);
    res.json({ success: true });
});

app.get('/api/documents', async (req, res) => {
    const rows = await db.all('SELECT * FROM documents ORDER BY id DESC');
    res.json(rows);
});

app.get('/api/documents/download/:filename', (req, res) => {
    const filepath = path.join(uploadDir, req.params.filename);
    res.download(filepath);
});

// 11. Calendar
app.get('/api/calendar', async (req, res) => {
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
});

// Serve frontend static files in production
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use((req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        } else {
            res.status(404).json({ error: 'API route not found' });
        }
    });
}
