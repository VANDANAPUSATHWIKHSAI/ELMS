const axios = require('axios');

async function testPrincipalAPI() {
    try {
        console.log('🔄 Attempting login for Principal 501...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            employeeId: '501',
            password: '678'
        });

        const token = loginRes.data.token;
        console.log('✅ Login successful. Token obtained.');
        console.log('User object from login:', JSON.stringify(loginRes.data.user, null, 2));

        console.log('🔄 Calling Principal Stats API...');
        const statsRes = await axios.get('http://localhost:5000/api/principal/stats', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('📊 Stats Result:', JSON.stringify(statsRes.data, null, 2));

        if (statsRes.data.totalStaff === 56) {
            console.log('❌ FAILED: Total Staff is still 56 (unfiltered).');
        } else if (statsRes.data.totalStaff === 14) {
            console.log('✅ SUCCESS: Total Staff is 14 (filtered).');
        } else {
            console.log(`🤔 UNKNOWN: Total Staff is ${statsRes.data.totalStaff}.`);
        }

    } catch (err) {
        console.error('❌ Error during test:', err.response ? err.response.data : err.message);
    }
}

testPrincipalAPI();
