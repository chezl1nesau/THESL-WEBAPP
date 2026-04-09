import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const dbModule = await import('./server/db.js');
    const setupDb = dbModule.setupDb;
    const db = await setupDb();
    
    try {
        console.log("Creating dummy annual_leave...");
        // USE LOWERCASE columns for the db insert
        const result = await db.run(
            'INSERT INTO annual_leave (user_email, startdate, enddate, duration, reason, status, submitdate) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['employee@thesl.co.za', '2026-05-01', '2026-05-05', 5, 'Vacation', 'Pending', '2026-04-08']
        );
        
        console.log("annual_leave id:", result.lastID);
        
        console.log("Creating pending_approval...");
        await db.run(
            'INSERT INTO pending_approvals (reference_id, user_email, name, type, duration, details, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [result.lastID, 'employee@thesl.co.za', 'Dummy Employee', 'Annual', 5, `Annual Leave`, '2026-04-08']
        );
        
        const pending = await db.all('SELECT * FROM pending_approvals');
        console.log("Pending created:", pending[0]);
        
        const id = pending[0].id;
        
        console.log(`Approving pending id: ${id}`);
        await db.run('UPDATE annual_leave SET status = ? WHERE id = ?', ['Approved', pending[0].reference_id]);
        console.log("annual_leave updated!");
        
        const user = await db.get('SELECT annual_balance, annual_used FROM users WHERE email = ?', [pending[0].user_email]);
        console.log("User:", user);
        
        if(user) {
            await db.run('UPDATE users SET annual_balance = ?, annual_used = ? WHERE email = ?', 
                        [user.annual_balance - pending[0].duration, user.annual_used + pending[0].duration, pending[0].user_email]);
            console.log("users updated!");
            
            const checks = await db.get('SELECT annual_balance, annual_used FROM users WHERE email = ?', [pending[0].user_email]);
            console.log("user after update:", checks);
        }
        
        await db.run('DELETE FROM pending_approvals WHERE id = ?', [id]);
        console.log("Success! Cleaned up.");
    } catch(e) {
        console.error("ERROR:", e);
    }
}
test();
