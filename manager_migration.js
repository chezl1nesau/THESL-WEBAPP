import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function migrate() {
    console.log('Starting Manager Sync Migration...');

    // Note: We cannot run ALTER TABLE directly via the JS client easily 
    // without an RPC or using the SQL Editor. 
    // However, I will try to check if the columns exist or if I can use a workaround.
    
    // Actually, I will try to update a record with the new column. 
    // If it fails, I know I need to ask the user to run the SQL or find another way.
    
    // I'll check the current table structure first.
    const { data, error } = await supabase.from('users').select('*').limit(1);
    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
    
    if (!columns.includes('manager_email')) {
        console.log('Columns "manager_email" missing. Please run the following SQL in Supabase SQL Editor:');
        console.log(`
        -- Add manager_email to users
        ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_email TEXT;

        -- Add manager_email to pending_approvals
        ALTER TABLE pending_approvals ADD COLUMN IF NOT EXISTS manager_email TEXT;

        -- Indexing
        CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_email);
        CREATE INDEX IF NOT EXISTS idx_pending_manager ON pending_approvals(manager_email);
        `);
        // I'll try to proceed with code changes anyway, assuming columns will be added.
    } else {
        console.log('Columns already exist.');
    }

    // Set Afnaan as the manager for Aakifah
    console.log('Setting Afnaan as Aakifah\'s manager...');
    const { error: updateErr } = await supabase
        .from('users')
        .update({ manager_email: 'afnaan@thesl.co.za' })
        .eq('email', 'aakifah.sims@thesl.co.za');
        
    if (updateErr) {
        console.error('Failed to set manager relationship:', updateErr.message);
    } else {
        console.log('Relationship established: Aakifah Sims -> Afnaan');
    }
}

migrate();
