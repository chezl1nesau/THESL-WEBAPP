import 'dotenv/config';
import { setupDb } from './server/db.js';

async function testCasing() {
    const db = await setupDb();
    
    // We intentionally use CamelCase columns in the SQL string
    const query = 'INSERT INTO annual_leave (user_email, startDate, endDate, duration, reason, status, submitDate) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const params = ['test@example.com', '2026-07-01', '2026-07-05', 5, 'Casing Test', 'Pending', '2026-04-09'];
    
    console.log('Attempting insert with CamelCase columns in SQL string...');
    try {
        const result = await db.run(query, params);
        console.log('Success! Result:', result);
        
        // Cleanup
        await db.run('DELETE FROM annual_leave WHERE reason = ?', ['Casing Test']);
        console.log('Cleaned up.');
    } catch (err) {
        console.error('Failed as expected if casing is NOT handled:', err.message);
    }
}

testCasing();
