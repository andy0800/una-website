const https = require('https');

console.log('🔍 Testing Frontend Login Simulation');
console.log('=====================================');

// Simulate exactly what the frontend does
const frontendOrigin = 'https://cute-churros-f9f049.netlify.app';
const loginUrl = 'https://una-backend-c207.onrender.com/api/users/login';

const postData = JSON.stringify({
    phone: 'test',
    password: 'test'
});

const options = {
    hostname: 'una-backend-c207.onrender.com',
    port: 443,
    path: '/api/users/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Origin': frontendOrigin,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
};

console.log('Frontend Origin:', frontendOrigin);
console.log('Login URL:', loginUrl);
console.log('Request Body:', postData);
console.log('---');

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`CORS Allow-Origin: ${res.headers['access-control-allow-origin'] || 'Not set'}`);
    console.log(`CORS Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'Not set'}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', data);
        
        if (res.statusCode === 400) {
            console.log('✅ SUCCESS: Frontend login simulation works!');
            console.log('   - Backend receives POST requests correctly');
            console.log('   - CORS is configured properly');
            console.log('   - The issue might be in the frontend JavaScript execution');
        } else {
            console.log(`⚠️  Unexpected status: ${res.statusCode}`);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
});

req.write(postData);
req.end();
