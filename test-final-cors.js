const https = require('https');

console.log('🔍 Final CORS Test for Netlify Domain');
console.log('=====================================');

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
    
    if (res.headers['access-control-allow-origin'] === frontendOrigin) {
        console.log('   ✅ CORS headers are correct for Netlify domain!');
    } else {
        console.log('   ❌ CORS headers missing or incorrect');
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
            
            if (res.headers['access-control-allow-origin'] === frontendOrigin) {
                console.log('\n🎉 CORS is working perfectly for Netlify!');
                console.log('   Your frontend should now be able to make requests without CORS errors.');
            } else {
                console.log('\n⚠️  CORS is still not working');
                console.log('   The deployment might still be in progress or there might be another issue.');
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
