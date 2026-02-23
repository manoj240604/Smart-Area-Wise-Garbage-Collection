const API_URL = 'http://localhost:5000/api';

async function verify() {
    try {
        console.log('Starting verification...');

        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password123'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful. Token obtained.');

        // 2. Fetch Available Workers
        console.log('Fetching available workers...');
        const availableWorkersRes = await fetch(`${API_URL}/workers?availability=true`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!availableWorkersRes.ok) {
            throw new Error(`Fetch available workers failed: ${availableWorkersRes.status}`);
        }

        const availableWorkers = await availableWorkersRes.json();
        console.log(`Found ${availableWorkers.length} available workers.`);

        const allAvailable = availableWorkers.every(w => w.availability === true);
        if (allAvailable) {
            console.log('PASS: All returned workers are available.');
        } else {
            console.error('FAIL: Some returned workers are NOT available.');
            availableWorkers.forEach(w => console.log(`- ${w.name}: ${w.availability}`));
        }

        // 3. Fetch All Workers (no filter)
        console.log('Fetching all workers (control test)...');
        const allWorkersRes = await fetch(`${API_URL}/workers`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!allWorkersRes.ok) {
            throw new Error(`Fetch all workers failed: ${allWorkersRes.status}`);
        }

        const allWorkers = await allWorkersRes.json();
        console.log(`Found ${allWorkers.length} total workers.`);

        if (availableWorkers.length === allWorkers.length) {
            console.log('NOTE: Available count equals total count. This means either all workers are available or the filter isnt working (if there are unavailable ones).');
        } else {
            console.log(`PASS: Filtered list (${availableWorkers.length}) is smaller than total list (${allWorkers.length}).`);
        }

    } catch (error) {
        console.error('Verification failed:', error.message);
    }
}

verify();
