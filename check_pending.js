import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkPending() {
    console.log('Checking pending_approvals table...');
    // We try to insert a dummy record to see if it works and what columns it has
    const dummy = {
        reference_id: 999,
        user_email: 'test@example.com',
        name: 'Test User',
        type: 'Annual',
        duration: 1,
        details: 'Test Details',
        date: '2026-04-09'
    };
    
    const { data, error } = await supabase.from('pending_approvals').insert([dummy]).select();
    if (error) {
        console.error('Error inserting into pending_approvals:', error);
        // If error is about missing columns, it will tell us
    } else {
        console.log('Successfully inserted dummy into pending_approvals:', data[0]);
        // Clean up
        await supabase.from('pending_approvals').delete().eq('id', data[0].id);
        console.log('Cleaned up dummy.');
    }
}

checkPending();
