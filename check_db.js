import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkColumns() {
    const { data, error } = await supabase.from('annual_leave').select('*').limit(1);
    if (error) {
        console.error('Error fetching annual_leave:', error);
        return;
    }
    if (data && data.length > 0) {
        console.log('Columns in annual_leave:', Object.keys(data[0]));
    } else {
        console.log('No data in annual_leave, checking sick_leave...');
        const { data: sickData, error: sickError } = await supabase.from('sick_leave').select('*').limit(1);
        if (sickData && sickData.length > 0) {
            console.log('Columns in sick_leave:', Object.keys(sickData[0]));
        } else {
            console.log('No data found to check columns. I will try to fetch table info if possible.');
        }
    }
    
    const { data: pending, error: pendingErr } = await supabase.from('pending_approvals').select('*').limit(1);
    if (pending && pending.length > 0) {
        console.log('Columns in pending_approvals:', Object.keys(pending[0]));
    }
}

checkColumns();
