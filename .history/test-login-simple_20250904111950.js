const https = require('https');

const testLogin = () => {
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

    console.log('🔍 Testing login endpoint...');
    console.log('URL: https://una-backend-c207.onrender.com/api/users/login');
    console.log('Method: POST');
    console.log('Body:', postData);
    console.log('---');

    const req = https.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Response Body:', data);
            try {
                const jsonData = JSON.parse(data);
                console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.log('Response is not valid JSON');
            }
        });
    });

    req.on('error', (e) => {
        console.error('Request error:', e.message);
    });

    req.write(postData);
    req.end();
};

testLogin();
