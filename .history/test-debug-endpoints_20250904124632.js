const https = require('https');

console.log('🔍 Testing Debug Endpoints');
console.log('==========================');

// Test 1: Basic routing test
console.log('1. Testing /test-routing endpoint...');
const testReq = https.request({
    hostname: 'una-backend-c207.onrender.com',
    port: 443,
    path: '/test-routing',
    method: 'GET'
}, (res) => {
    console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`   Response: ${data}`);
        
        if (res.statusCode === 200) {
            console.log('   ✅ Basic routing works');
            
            // Test 2: API users endpoint
            console.log('\n2. Testing /api/users endpoint...');
            const usersReq = https.request({
                hostname: 'una-backend-c207.onrender.com',
                port: 443,
                path: '/api/users',
                method: 'GET'
            }, (res) => {
                console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
                console.log(`   CORS Headers:`, {
                    'Access-Control-Allow-Origin': res.headers['access-control-allow-origin'],
                    'Access-Control-Allow-Methods': res.headers['access-control-allow-methods']
                });
                
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    console.log(`   Response: ${data}`);
                    
                    if (res.statusCode === 200) {
                        console.log('   ✅ /api/users endpoint working');
                    } else {
                        console.log('   ❌ /api/users endpoint not working');
                        console.log('   This means the route registration is failing');
                    }
                });
            });
            
            usersReq.on('error', (e) => {
                console.error('   ❌ GET users request failed:', e.message);
            });
            
            usersReq.end();
            
        } else {
            console.log('   ❌ Basic routing not working');
        }
    });
});

testReq.on('error', (e) => {
    console.error('❌ Test routing request failed:', e.message);
});

testReq.end();
