const https = require('https');

console.log('🔍 Testing CORS Headers After Fix');
console.log('==================================');

// Test with the exact Netlify origin
const frontendOrigin = 'https://cute-churros-f9f049.netlify.app';

// Test 1: OPTIONS request (preflight)
console.log('1. Testing OPTIONS request (preflight)...');
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
    console.log(`   Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'MISSING'}`);
    console.log(`   Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || 'MISSING'}`);
    console.log(`   Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers'] || 'MISSING'}`);
    console.log(`   Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'MISSING'}`);
    
    if (res.headers['access-control-allow-origin']) {
        console.log('   ✅ OPTIONS request: CORS headers present');
    } else {
        console.log('   ❌ OPTIONS request: CORS headers missing');
    }
    
    // Test 2: POST request (actual login)
    console.log('\n2. Testing POST request (actual login)...');
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
        console.log(`   Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'MISSING'}`);
        console.log(`   Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'MISSING'}`);
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log(`   Response: ${data}`);
            
            if (res.headers['access-control-allow-origin']) {
                console.log('   ✅ POST request: CORS headers present');
                console.log('\n🎉 CORS FIX SUCCESSFUL!');
                console.log('   - Access-Control-Allow-Origin header is now present');
                console.log('   - Frontend should be able to make requests');
                console.log('   - No more CORS blocking errors');
            } else {
                console.log('   ❌ POST request: CORS headers still missing');
                console.log('\n⚠️  CORS FIX NOT WORKING YET');
                console.log('   - May need to wait for deployment to complete');
                console.log('   - Or additional configuration needed');
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
