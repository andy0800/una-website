const https = require('https');

console.log('🔍 Testing /api/users/login endpoint');
console.log('=====================================');

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
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Status Message: ${res.statusMessage}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    console.log(`CORS Headers: ${res.headers['access-control-allow-credentials'] ? 'Present' : 'Missing'}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response Body:', data);
        
        if (res.statusCode === 400) {
            console.log('✅ SUCCESS: Login endpoint is working!');
            console.log('   - Returns 400 for invalid credentials (this is correct)');
            console.log('   - Server is processing the request properly');
        } else if (res.statusCode === 200) {
            console.log('✅ SUCCESS: Login successful!');
        } else {
            console.log(`⚠️  Unexpected status code: ${res.statusCode}`);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
});

req.write(postData);
req.end();
