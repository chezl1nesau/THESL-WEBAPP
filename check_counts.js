import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkCounts() {
    const { count: annualCount, error: err1 } = await supabase.from('annual_leave').select('*', { count: 'exact', head: true });
    const { count: sickCount, error: err2 } = await supabase.from('sick_leave').select('*', { count: 'exact', head: true });
    const { count: pendingCount, error: err3 } = await supabase.from('pending_approvals').select('*', { count: 'exact', head: true });
    
    console.log('Annual Leave Count:', annualCount);
    console.log('Sick Leave Count:', sickCount);
    console.log('Pending Approvals Count:', pendingCount);
}

checkCounts();
