const https = require('https');

console.log('🔍 Testing Backend API Endpoints');
console.log('================================');

// Test 1: Health check
console.log('1. Testing health check...');
const healthReq = https.request({
    hostname: 'una-backend-c207.onrender.com',
    port: 443,
    path: '/health',
    method: 'GET'
}, (res) => {
    console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
    
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`   Response: ${data}`);
        
        if (res.statusCode === 200) {
            console.log('   ✅ Backend is running');
            
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
                        
                        // Test 3: POST login endpoint
                        console.log('\n3. Testing POST /api/users/login...');
                        const loginData = JSON.stringify({ phone: 'test', password: 'test' });
                        
                        const loginReq = https.request({
                            hostname: 'una-backend-c207.onrender.com',
                            port: 443,
                            path: '/api/users/login',
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Content-Length': Buffer.byteLength(loginData)
                            }
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
                                
                                if (res.statusCode === 200 || res.statusCode === 400) {
                                    console.log('   ✅ POST /api/users/login endpoint working');
                                    console.log('\n🎉 All API endpoints are working!');
                                } else {
                                    console.log('   ❌ POST /api/users/login endpoint not working');
                                    console.log('   This explains the 404 error in the frontend');
                                }
                            });
                        });
                        
                        loginReq.on('error', (e) => {
                            console.error('   ❌ POST login request failed:', e.message);
                        });
                        
                        loginReq.write(loginData);
                        loginReq.end();
                        
                    } else {
                        console.log('   ❌ /api/users endpoint not working');
                    }
                });
            });
            
            usersReq.on('error', (e) => {
                console.error('   ❌ GET users request failed:', e.message);
            });
            
            usersReq.end();
            
        } else {
            console.log('   ❌ Backend is not running properly');
        }
    });
});

healthReq.on('error', (e) => {
    console.error('❌ Health check failed:', e.message);
});

healthReq.end();
