import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function setupDb() {
    const db = await open({
        filename: path.join(process.cwd(), 'server', 'database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            password TEXT,
            role TEXT,
            name TEXT,
            annual_balance INTEGER DEFAULT 12,
            sick_balance INTEGER DEFAULT 8,
            annual_used INTEGER DEFAULT 0,
            sick_used INTEGER DEFAULT 0,
            avatar TEXT,
            phone TEXT
        );
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            title TEXT,
            content TEXT,
            date TEXT,
            author TEXT,
            pinned INTEGER
        );
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            type TEXT,
            status TEXT,
            date TEXT
        );
        CREATE TABLE IF NOT EXISTS annual_leave (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            startDate TEXT,
            endDate TEXT,
            duration INTEGER,
            reason TEXT,
            status TEXT,
            submitDate TEXT
        );
        CREATE TABLE IF NOT EXISTS sick_leave (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            type TEXT,
            duration INTEGER,
            fileName TEXT,
            status TEXT,
            date TEXT
        );
        CREATE TABLE IF NOT EXISTS lateness (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time TEXT,
            date TEXT,
            lateness INTEGER,
            status TEXT
        );
        CREATE TABLE IF NOT EXISTS pending_approvals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reference_id INTEGER,
            user_email TEXT,
            name TEXT,
            type TEXT,
            duration INTEGER,
            details TEXT,
            date TEXT
        );
        CREATE TABLE IF NOT EXISTS performance_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            manager_email TEXT,
            period TEXT,
            self_assessment TEXT,
            manager_feedback TEXT,
            rating INTEGER,
            status TEXT,
            date TEXT
        );
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            filename TEXT,
            size INTEGER,
            date TEXT
        );
    `);

    try {
        await db.exec('ALTER TABLE users ADD COLUMN avatar TEXT;');
    } catch (e) {}
    
    try {
        await db.exec('ALTER TABLE users ADD COLUMN phone TEXT;');
    } catch (e) {}

    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
        // Admin users
        await db.run('INSERT INTO users (email, password, role, name, annual_balance, sick_balance, annual_used, sick_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', ['admin@thesl.co.za', 'admin123', 'admin', 'Admin User', 15, 10, 0, 0]);
        await db.run('INSERT INTO users (email, password, role, name, annual_balance, sick_balance, annual_used, sick_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', ['chezlin@thesl.co.za', 'way', 'admin', 'Chezlin', 15, 10, 0, 0]);

        const employees = [
            ['aakifah.sims@thesl.co.za', 'Aakifah Sims'],
            ['ali+user@thesl.co.za', 'Ali Rhoda'],
            ['angelique@thesl.co.za', 'Angelique Pelser'],
            ['aqeel@thesl.co.za', 'Aqeel Bomester'],
            ['bevan@thesl.co.za', 'Bevan Marthinus'],
            ['cameron@thesl.co.za', 'Cameron Cicero'],
            ['chante@thesl.co.za', 'Chante Davidse'],
            ['darryn@thesl.co.za', 'Darryn Roman'],
            ['keisha@thesl.co.za', 'Keisha October'],
            ['lauren@thesl.co.za', 'Lauren Williams'],
            ['leeroy@thesl.co.za', 'Lee-Roy van Wyk'],
            ['lyal@thesl.co.za', 'Lyal Siebritz'],
            ['mikayla@thesl.co.za', 'Mikayla Titus'],
            ['nadine@claimscard.co.za', 'Nadine Morris'],
            ['nikitadw@thesl.co.za', 'Nikita De Wee'],
            ['rasool@thesl.co.za', 'Rasool Thomas'],
            ['roeshen@thesl.co.za', 'Roeshen Petersen'],
            ['ryan@thesl.co.za', 'Ryan Williams'],
            ['waidon@thesl.co.za', 'Waidon Cloete'],
            ['west@thesl.co.za', 'West Ebrahiem'],
            ['yazied@thesl.co.za', 'Yazied Boltman'],
            ['zak@thesl.co.za', 'Zak Chotia']
        ];

        for (const emp of employees) {
            await db.run(
                'INSERT INTO users (email, password, role, name, annual_balance, sick_balance, annual_used, sick_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
                [emp[0], 'password123', 'employee', emp[1], 12, 8, 0, 0]
            );
        }
        
        await db.run('INSERT INTO announcements (type, title, content, date, author, pinned) VALUES (?, ?, ?, ?, ?, ?)', ['event', 'Company Year-End Function', 'Join us for our annual year-end celebration on December 15th at 6 PM.', '2026-03-18', 'HR Team', 1]);
        await db.run('INSERT INTO announcements (type, title, content, date, author, pinned) VALUES (?, ?, ?, ?, ?, ?)', ['policy', 'Updated Remote Work Policy', 'We have updated our remote work policy.', '2026-03-15', 'HR Team', 0]);
        
        await db.run('INSERT INTO requests (title, type, status, date) VALUES (?, ?, ?, ?)', ['Monitor Replacement', 'IT Support', 'Open', 'Mar 18, 2026']);
        await db.run('INSERT INTO requests (title, type, status, date) VALUES (?, ?, ?, ?)', ['Network Access', 'IT Support', 'In Progress', 'Mar 16, 2026']);
        
        // Let's seed an actual leave record so we can link it
        const res = await db.run('INSERT INTO annual_leave (user_email, startDate, endDate, duration, reason, status, submitDate) VALUES (?, ?, ?, ?, ?, ?, ?)', ['employee@thesl.co.za', '2026-04-01', '2026-04-05', 5, 'Vacation', 'Pending', 'Mar 15, 2026']);
        await db.run('INSERT INTO pending_approvals (reference_id, user_email, name, type, duration, details, date) VALUES (?, ?, ?, ?, ?, ?, ?)', [res.lastID, 'employee@thesl.co.za', 'Sarah Johnson', 'Annual', 5, 'Annual Leave - 5 days', 'Mar 15, 2026']);
    }

    return db;
}
