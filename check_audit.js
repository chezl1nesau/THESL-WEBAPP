import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkAuditLogs() {
    const { data, error } = await supabase.from('audit_logs').select('*').order('id', { ascending: false }).limit(20);
    if (error) {
        console.error('Error fetching audit logs:', error);
        return;
    }
    console.log('Recent Audit Logs:');
    data.forEach(log => {
        console.log(`[${log.timestamp}] ${log.email} - ${log.action}: ${log.details}`);
    });
}

checkAuditLogs();
