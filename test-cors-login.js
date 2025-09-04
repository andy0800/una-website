const https = require('https');

console.log('🔍 Testing CORS on Login Endpoint');
console.log('==================================');

const frontendOrigin = 'https://cute-churros-f9f049.netlify.app';

// Test OPTIONS request (preflight)
console.log('1. Testing OPTIONS preflight request...');
const optionsReq = https.request({
    hostname: 'una-backend-c207.onrender.com',
    port: 443,
    path: '/api/users/login',
    method: 'OPTIONS',
    headers: {
        'Origin': frontendOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
    }
}, (res) => {
    console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`   CORS Headers:`);
    console.log(`     Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'MISSING'}`);
    console.log(`     Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || 'MISSING'}`);
    console.log(`     Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers'] || 'MISSING'}`);
    console.log(`     Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'MISSING'}`);
    
    if (res.headers['access-control-allow-origin']) {
        console.log('   ✅ CORS headers present');
    } else {
        console.log('   ❌ CORS headers missing - this is the problem!');
    }
    
    // Test POST request
    console.log('\n2. Testing POST request...');
    const postData = JSON.stringify({ phone: 'test', password: 'test' });
    
    const postReq = https.request({
        hostname: 'una-backend-c207.onrender.com',
        port: 443,
        path: '/api/users/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': frontendOrigin,
            'Content-Length': Buffer.byteLength(postData)
        }
    }, (res) => {
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`   CORS Headers:`);
        console.log(`     Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'MISSING'}`);
        console.log(`     Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'MISSING'}`);
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log(`   Response: ${data}`);
            
            if (res.headers['access-control-allow-origin']) {
                console.log('\n🎉 CORS is working!');
            } else {
                console.log('\n⚠️  CORS is still not working');
                console.log('   The issue is that CORS headers are not being set');
                console.log('   This means the CORS middleware is not functioning properly');
            }
        });
    });
    
    postReq.on('error', (e) => {
        console.error('   ❌ POST request failed:', e.message);
    });
    
    postReq.write(postData);
    postReq.end();
});

optionsReq.on('error', (e) => {
    console.error('❌ OPTIONS request failed:', e.message);
});

optionsReq.end();
