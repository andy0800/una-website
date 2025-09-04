const https = require('https');

console.log('🔍 Testing CORS Fix');
console.log('===================');

// Test with Netlify origin
const frontendOrigin = 'https://cute-churros-f9f049.netlify.app';

const options = {
    hostname: 'una-backend-c207.onrender.com',
    port: 443,
    path: '/api/users/login',
    method: 'OPTIONS', // Test preflight request
    headers: {
        'Origin': frontendOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
    }
};

console.log('Testing OPTIONS request (preflight)');
console.log('Origin:', frontendOrigin);
console.log('---');

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'MISSING'}`);
    console.log(`Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || 'MISSING'}`);
    console.log(`Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers'] || 'MISSING'}`);
    console.log(`Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'MISSING'}`);
    
    if (res.headers['access-control-allow-origin']) {
        console.log('✅ SUCCESS: CORS headers are now present!');
    } else {
        console.log('❌ FAILED: CORS headers still missing');
    }
});

req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
});

req.end();
