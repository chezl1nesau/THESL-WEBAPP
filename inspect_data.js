import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inspectData() {
    const { data: annual, error: err1 } = await supabase.from('annual_leave').select('*');
    console.log('Annual Leave Data:', annual);
    
    const { data: pending, error: err2 } = await supabase.from('pending_approvals').select('*');
    console.log('Pending Approvals Data:', pending);
}

inspectData();
