import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function cleanup() {
    console.log('Cleaning up simulation data...');
    // Delete annual_leave with reason 'Test simulation'
    const { data: ann, error: err1 } = await supabase.from('annual_leave').delete().eq('reason', 'Test simulation').select();
    if (ann && ann.length > 0) {
        console.log(`Deleted ${ann.length} annual_leave records.`);
        const ids = ann.map(a => a.id);
        // Delete pending_approvals with reference_id in those ids
        const { data: pend, error: err2 } = await supabase.from('pending_approvals').delete().in('reference_id', ids).select();
        if (pend) console.log(`Deleted ${pend.length} pending_approvals.`);
    }
}

cleanup();
