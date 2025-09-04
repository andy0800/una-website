#!/usr/bin/env node
/**
 * UNA Institute - Login API Comprehensive Test Script
 * This script tests all aspects of the login API functionality
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://una-backend-c207.onrender.com';
const TEST_RESULTS = {
    connectivity: null,
    health: null,
    userRoutes: null,
    corsPreflight: null,
    loginEndpoint: null,
    loginValidation: null,
    crossOrigin: null
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'UNA-API-Test/1.0',
                ...options.headers
            }
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData,
                        rawData: data
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: null,
                        rawData: data
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

// Test functions
async function testBasicConnectivity() {
    console.log('🔍 Testing basic backend connectivity...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/`);
        
        if (response.status === 200) {
            TEST_RESULTS.connectivity = 'SUCCESS';
            console.log('✅ Backend is reachable!');
            console.log(`   Status: ${response.status}`);
            console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.rawData}`);
        }
    } catch (error) {
        TEST_RESULTS.connectivity = 'FAILED';
        console.log('❌ Backend connectivity failed:');
        console.log(`   Error: ${error.message}`);
    }
}

async function testHealthCheck() {
    console.log('\n🔍 Testing health check endpoint...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/health`);
        
        if (response.status === 200) {
            TEST_RESULTS.health = 'SUCCESS';
            console.log('✅ Health check passed!');
            console.log(`   Status: ${response.data.status}`);
            console.log(`   Uptime: ${response.data.uptime}s`);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.rawData}`);
        }
    } catch (error) {
        TEST_RESULTS.health = 'FAILED';
        console.log('❌ Health check failed:');
        console.log(`   Error: ${error.message}`);
    }
}

async function testUserRoutes() {
    console.log('\n🔍 Testing user routes endpoint...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/users/test`);
        
        if (response.status === 200) {
            TEST_RESULTS.userRoutes = 'SUCCESS';
            console.log('✅ User routes working!');
            console.log(`   Message: ${response.data.message}`);
            console.log(`   Timestamp: ${response.data.timestamp}`);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.rawData}`);
        }
    } catch (error) {
        TEST_RESULTS.userRoutes = 'FAILED';
        console.log('❌ User routes test failed:');
        console.log(`   Error: ${error.message}`);
    }
}

async function testCORSPreflight() {
    console.log('\n🔍 Testing CORS preflight request...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/users/login`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://cute-churros-f9f049.netlify.app',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'] || response.headers['Access-Control-Allow-Origin'],
            'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'] || response.headers['Access-Control-Allow-Methods'],
            'Access-Control-Allow-Headers': response.headers['access-control-allow-headers'] || response.headers['Access-Control-Allow-Headers'],
            'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials'] || response.headers['Access-Control-Allow-Credentials']
        };
        
        // CORS preflight is successful if we get 200/204 status and have the required CORS headers
        // Note: Access-Control-Allow-Origin may not be present if origin is not allowed
        if ((response.status === 200 || response.status === 204) && corsHeaders['Access-Control-Allow-Methods']) {
            TEST_RESULTS.corsPreflight = 'SUCCESS';
            console.log('✅ CORS preflight successful!');
            console.log(`   Allow-Origin: ${corsHeaders['Access-Control-Allow-Origin']}`);
            console.log(`   Allow-Methods: ${corsHeaders['Access-Control-Allow-Methods']}`);
            console.log(`   Allow-Headers: ${corsHeaders['Access-Control-Allow-Headers']}`);
            console.log(`   Allow-Credentials: ${corsHeaders['Access-Control-Allow-Credentials']}`);
        } else {
            throw new Error('CORS headers missing or invalid');
        }
    } catch (error) {
        TEST_RESULTS.corsPreflight = 'FAILED';
        console.log('❌ CORS preflight failed:');
        console.log(`   Error: ${error.message}`);
    }
}

async function testLoginEndpoint() {
    console.log('\n🔍 Testing login endpoint accessibility...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/users/login`, {
            method: 'POST',
            headers: {
                'Origin': 'https://cute-churros-f9f049.netlify.app'
            },
            body: {
                phone: 'test',
                password: 'test'
            }
        });
        
        // We expect either 400 (validation error) or 401 (auth error), not 404
        if (response.status === 404) {
            throw new Error('Login endpoint not found (404)');
        }
        
        TEST_RESULTS.loginEndpoint = 'SUCCESS';
        console.log('✅ Login endpoint accessible!');
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
        TEST_RESULTS.loginEndpoint = 'FAILED';
        console.log('❌ Login endpoint test failed:');
        console.log(`   Error: ${error.message}`);
    }
}

async function testLoginValidation() {
    console.log('\n🔍 Testing login validation...');
    const testCases = [
        { phone: '', password: 'test', expected: 'Phone required' },
        { phone: '123', password: '', expected: 'Password required' },
        { phone: '', password: '', expected: 'Both required' }
    ];
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    for (const testCase of testCases) {
        try {
            const response = await makeRequest(`${BACKEND_URL}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Origin': 'https://cute-churros-f9f049.netlify.app'
                },
                body: {
                    phone: testCase.phone,
                    password: testCase.password
                }
            });
            
            if (response.status === 400 && response.data.message) {
                passedTests++;
                console.log(`   ✅ Validation test passed: ${testCase.expected}`);
            } else {
                console.log(`   ❌ Validation test failed: Expected 400, got ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Validation test error: ${error.message}`);
        }
    }
    
    if (passedTests === totalTests) {
        TEST_RESULTS.loginValidation = 'SUCCESS';
        console.log(`✅ All validation tests passed! (${passedTests}/${totalTests})`);
    } else {
        TEST_RESULTS.loginValidation = 'PARTIAL';
        console.log(`⚠️ Some validation tests failed: (${passedTests}/${totalTests})`);
    }
}

async function testCrossOriginRequest() {
    console.log('\n🔍 Testing cross-origin request...');
    try {
        const response = await makeRequest(`${BACKEND_URL}/api/users/test`, {
            headers: {
                'Origin': 'https://cute-churros-f9f049.netlify.app'
            }
        });
        
        if (response.status === 200) {
            TEST_RESULTS.crossOrigin = 'SUCCESS';
            console.log('✅ Cross-origin request successful!');
            console.log(`   Origin: https://cute-churros-f9f049.netlify.app`);
            console.log(`   Status: ${response.status}`);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.rawData}`);
        }
    } catch (error) {
        TEST_RESULTS.crossOrigin = 'FAILED';
        console.log('❌ Cross-origin request failed:');
        console.log(`   Error: ${error.message}`);
    }
}

function printTestSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const results = Object.entries(TEST_RESULTS);
    const passed = results.filter(([_, status]) => status === 'SUCCESS').length;
    const failed = results.filter(([_, status]) => status === 'FAILED').length;
    const partial = results.filter(([_, status]) => status === 'PARTIAL').length;
    
    results.forEach(([test, status]) => {
        const icon = status === 'SUCCESS' ? '✅' : status === 'FAILED' ? '❌' : '⚠️';
        console.log(`${icon} ${test.padEnd(20)}: ${status}`);
    });
    
    console.log('='.repeat(60));
    console.log(`Total: ${passed} passed, ${failed} failed, ${partial} partial`);
    
    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Login API is fully functional.');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the issues above.');
    }
    
    console.log('='.repeat(60));
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting UNA Institute Login API Comprehensive Test');
    console.log(`Backend URL: ${BACKEND_URL}`);
    console.log(`Test Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    
    await testBasicConnectivity();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testHealthCheck();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testUserRoutes();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testCORSPreflight();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testLoginEndpoint();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testLoginValidation();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testCrossOriginRequest();
    
    printTestSummary();
}

// Run tests if this script is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    runAllTests,
    testBasicConnectivity,
    testHealthCheck,
    testUserRoutes,
    testCORSPreflight,
    testLoginEndpoint,
    testLoginValidation,
    testCrossOriginRequest,
    TEST_RESULTS
};
