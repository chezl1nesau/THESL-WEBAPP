import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkAllColumns() {
    const tables = ['users', 'announcements', 'requests', 'annual_leave', 'sick_leave', 'lateness', 'pending_approvals', 'audit_logs', 'performance_reviews', 'documents', 'compliments', 'calendar_events'];
    
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Table ${table}: ERROR - ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`Table ${table}: [${Object.keys(data[0]).join(', ')}]`);
        } else {
            console.log(`Table ${table}: (empty)`);
            // Try to get columns anyway if we can
        }
    }
}

checkAllColumns();
