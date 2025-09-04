const https = require('https');

console.log('🔍 Testing Backend Status');
console.log('========================');

// Test 1: Health check endpoint
console.log('1. Testing health check endpoint...');
const healthReq = https.request({
    hostname: 'una-backend-c207.onrender.com',
    port: 443,
    path: '/health',
    method: 'GET'
}, (res) => {
    console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`   Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`   Response: ${data}`);
        
        if (res.statusCode === 200) {
            console.log('   ✅ Backend is running');
        } else {
            console.log('   ❌ Backend has issues');
        }
        
        // Test 2: Root endpoint
        console.log('\n2. Testing root endpoint...');
        const rootReq = https.request({
            hostname: 'una-backend-c207.onrender.com',
            port: 443,
            path: '/',
            method: 'GET'
        }, (res) => {
            console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
            
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`   Response: ${data.substring(0, 200)}...`);
                
                // Test 3: API endpoint
                console.log('\n3. Testing API endpoint...');
                const apiReq = https.request({
                    hostname: 'una-backend-c207.onrender.com',
                    port: 443,
                    path: '/api/users/test',
                    method: 'GET'
                }, (res) => {
                    console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
                    console.log(`   CORS Headers:`, {
                        'Access-Control-Allow-Origin': res.headers['access-control-allow-origin'],
                        'Access-Control-Allow-Methods': res.headers['access-control-allow-methods'],
                        'Access-Control-Allow-Headers': res.headers['access-control-allow-headers']
                    });
                    
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        console.log(`   Response: ${data}`);
                        
                        if (res.statusCode === 200) {
                            console.log('\n🎉 Backend is working correctly!');
                        } else {
                            console.log('\n⚠️  Backend has issues - check deployment logs');
                        }
                    });
                });
                
                apiReq.on('error', (e) => {
                    console.error('   ❌ API request failed:', e.message);
                });
                
                apiReq.end();
            });
        });
        
        rootReq.on('error', (e) => {
            console.error('   ❌ Root request failed:', e.message);
        });
        
        rootReq.end();
    });
});

healthReq.on('error', (e) => {
    console.error('❌ Health check failed:', e.message);
    console.log('\n🔍 Possible issues:');
    console.log('   - Backend deployment failed');
    console.log('   - Server crashed during startup');
    console.log('   - Environment variables not set correctly');
    console.log('   - Database connection issues');
    console.log('   - Port binding issues');
});

healthReq.end();
