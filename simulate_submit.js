import 'dotenv/config';
import { setupDb } from './server/db.js';

async function simulateSubmit() {
    const db = await setupDb();
    
    const user_email = 'employee@thesl.co.za';
    const name = 'Sample Employee';
    const startDate = '2026-06-01';
    const endDate = '2026-06-05';
    const duration = 5;
    const reason = 'Test simulation';
    const status = 'Pending';
    const submitDate = '2026-04-09';
    
    console.log('Inserting into annual_leave...');
    try {
        const result = await db.run(
            'INSERT INTO annual_leave (user_email, startdate, enddate, duration, reason, status, submitdate) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_email, startDate, endDate, duration, reason, status || 'Pending', submitDate]
        );
        console.log('Result from annual_leave insert:', result);
        
        console.log('Inserting into pending_approvals...');
        const pendingResult = await db.run(
            'INSERT INTO pending_approvals (reference_id, user_email, name, type, duration, details, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [result.lastID, user_email, name, 'Annual', duration, `Annual Leave: ${startDate} to ${endDate}`, submitDate]
        );
        console.log('Result from pending_approvals insert:', pendingResult);
        
        const pending = await db.all('SELECT * FROM pending_approvals');
        console.log('Current pending approvals:', pending);
        
    } catch (err) {
        console.error('Simulation Failed:', err);
    }
}

simulateSubmit();
