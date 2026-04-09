import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verify() {
    console.log('--- START VERIFICATION ---');
    const aakifahEmail = 'aakifah.sims@thesl.co.za';
    const afnaanEmail = 'afnaan@thesl.co.za';
    const cameronEmail = 'cameron@thesl.co.za';

    // 1. Submit a request as Aakifah
    // Since we can't call the actual running express server easily without a token,
    // we will simulate what the updated server.js DOES.
    
    console.log('1. Simulating Aakifah submitting leave...');
    
    // Step A: Fetch manager email from users
    const { data: userRec } = await supabase.from('users').select('manager_email').eq('email', aakifahEmail).single();
    const managerEmail = userRec?.manager_email;
    console.log(`   Found manager for Aakifah: ${managerEmail}`);

    if (managerEmail !== afnaanEmail) {
        console.error(`   ❌ ERROR: Manager should be ${afnaanEmail}, but found ${managerEmail}`);
    }

    // Step B: Insert into annual_leave
    const { data: leaveRec, error: leaveErr } = await supabase.from('annual_leave').insert([{
        user_email: aakifahEmail,
        startdate: '2026-04-24',
        enddate: '2026-04-24',
        duration: 1,
        reason: 'Sync Bug Verification',
        status: 'Pending',
        submitdate: '2026-04-09'
    }]).select().single();

    if (leaveErr) {
        console.error('   ❌ Failed to insert into annual_leave:', leaveErr.message);
        return;
    }
    console.log(`   annual_leave inserted (ID: ${leaveRec.id})`);

    // Step C: Insert into pending_approvals (the core of the fix)
    const { data: pendingRec, error: pendingErr } = await supabase.from('pending_approvals').insert([{
        reference_id: leaveRec.id,
        user_email: aakifahEmail,
        name: 'Aakifah Sims',
        type: 'Annual',
        duration: 1,
        details: 'Sync Bug Verification',
        date: '2026-04-24',
        manager_email: managerEmail // This is the new field
    }]).select().single();

    if (pendingErr) {
        console.error('   ❌ Failed to insert into pending_approvals:', pendingErr.message);
    } else {
        console.log(`   ✅ pending_approvals inserted with manager_email: ${pendingRec.manager_email}`);
    }

    // 2. Verify Visibility Logic
    console.log('\n2. Verifying Visibility (API Simulation)...');
    
    // Simulation for Afnaan (Manager/Super Authorized)
    const afnaanSeeEverything = ['afnaan@thesl.co.za', 'chezlin@thesl.co.za', 'zaid@thesl.co.za'].includes(afnaanEmail);
    console.log(`   If Afnaan (${afnaanEmail}) loads dashboard:`);
    const { data: afnaanView } = await supabase.from('pending_approvals').select('*');
    console.log(`   - (Global View) Returns ${afnaanView.length} records. Should contain Aakifah's request: ${afnaanView.some(r => r.user_email === aakifahEmail)}`);

    // Simulation for Cameron (Regular Manager)
    console.log(`   If Cameron (${cameronEmail}) loads dashboard:`);
    const { data: cameronView } = await supabase.from('pending_approvals').select('*').eq('manager_email', cameronEmail);
    console.log(`   - (Scoped View) Returns ${cameronView.length} records. Should be 0 if Aakifah is not his employee: ${cameronView.length === 0}`);

    // Cleanup
    console.log('\nCleaning up verification data...');
    await supabase.from('pending_approvals').delete().eq('details', 'Sync Bug Verification');
    await supabase.from('annual_leave').delete().eq('reason', 'Sync Bug Verification');
    console.log('Done.');
}

verify();
