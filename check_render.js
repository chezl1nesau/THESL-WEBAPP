import fetch from 'node-fetch';

async function checkBackend() {
    console.log('Checking Render backend status...');
    const url = 'https://thesl-backend.onrender.com/api/admin/pending';
    // This will probably return 401/403 but it confirms the server is UP and can respond
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log(`Response length: ${text.length}`);
    } catch (err) {
        console.error('Error reaching backend:', err.message);
    }
}

checkBackend();
