import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkNotifications() {
    const { error } = await supabase.from('notifications').select('*').limit(1);
    if (error) {
        console.log('Notifications table does NOT exist or error:', error.message);
    } else {
        console.log('Notifications table exists.');
    }
}

checkNotifications();
