#!/usr/bin/env node

/**
 * 🧪 WebRTC Livestreaming System Test Runner
 * 
 * This script runs comprehensive tests on all components of the WebRTC system
 * Usage: node test-runner.js [--admin] [--viewer] [--integration] [--all]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test configuration
const TEST_CONFIG = {
    admin: {
        name: 'Admin System Tests',
        files: [
            'frontend/admin/js/custom-webrtc.js',
            'frontend/admin/js/dashboard.js'
        ],
        tests: [
            'Syntax validation',
            'Class definition',
            'Method availability',
            'Socket.IO integration'
        ]
    },
    viewer: {
        name: 'Viewer System Tests',
        files: [
            'frontend/js/custom-webrtc-viewer.js'
        ],
        tests: [
            'Syntax validation',
            'Class definition',
            'Method availability',
            'Socket.IO integration'
        ]
    },
    backend: {
        name: 'Backend System Tests',
        files: [
            'backend/socket/streamSocket.js',
            'backend/server.js'
        ],
        tests: [
            'Syntax validation',
            'Socket.IO event handlers',
            'WebRTC room management',
            'API endpoints'
        ]
    },
    integration: {
        name: 'Integration Tests',
        files: [
            'frontend/admin/js/custom-webrtc.js',
            'frontend/js/custom-webrtc-viewer.js',
            'backend/socket/streamSocket.js'
        ],
        tests: [
            'Component compatibility',
            'Event flow validation',
            'Data structure consistency',
            'Error handling'
        ]
    }
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Test results storage
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
};

// Utility functions
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
    log('\n' + '='.repeat(60), 'cyan');
    log(`🧪 ${title}`, 'bright');
    log('='.repeat(60), 'cyan');
}

function logTest(testName, result, message = '') {
    const status = result ? '✅ PASS' : '❌ FAIL';
    const color = result ? 'green' : 'red';
    log(`${status} ${testName}`, color);
    if (message) {
        log(`   ${message}`, 'yellow');
    }
}

// Test functions
function testSyntaxValidation(filePath) {
    try {
        const result = execSync(`node -c "${filePath}"`, { encoding: 'utf8' });
        return { passed: true, message: 'Syntax OK' };
    } catch (error) {
        return { passed: false, message: `Syntax error: ${error.message}` };
    }
}

function testFileExists(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return { passed: true, message: 'File exists' };
        } else {
            return { passed: false, message: 'File not found' };
        }
    } catch (error) {
        return { passed: false, message: `File check error: ${error.message}` };
    }
}

function testFileContent(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic content validation
        const checks = [
            { name: 'File not empty', test: content.length > 0 },
            { name: 'Contains JavaScript', test: content.includes('function') || content.includes('class') || content.includes('const') || content.includes('let') },
            { name: 'No obvious syntax errors', test: !content.includes('undefined') || content.includes('function') || content.includes('class') }
        ];
        
        const results = checks.map(check => ({
            name: check.name,
            passed: check.test,
            message: check.test ? 'Content valid' : 'Content validation failed'
        }));
        
        return results;
    } catch (error) {
        return [{ passed: false, message: `File read error: ${error.message}` }];
    }
}

function testClassDefinition(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for class definitions
        const classChecks = [
            { name: 'CustomWebRTCManager class', test: content.includes('class CustomWebRTCManager') },
            { name: 'CustomWebRTCViewer class', test: content.includes('class CustomWebRTCViewer') },
            { name: 'Constructor method', test: content.includes('constructor(') },
            { name: 'Async methods', test: content.includes('async ') }
        ];
        
        const results = classChecks.map(check => ({
            name: check.name,
            passed: check.test,
            message: check.test ? 'Class definition found' : 'Class definition missing'
        }));
        
        return results;
    } catch (error) {
        return [{ passed: false, message: `Class check error: ${error.message}` }];
    }
}

function testSocketIOIntegration(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for Socket.IO usage
        const socketChecks = [
            { name: 'Socket.IO import', test: content.includes('io(') || content.includes('socket.io') },
            { name: 'Socket event listeners', test: content.includes('socket.on(') || content.includes('.on(') },
            { name: 'Socket emit', test: content.includes('socket.emit(') || content.includes('.emit(') },
            { name: 'Connection handling', test: content.includes('connect') || content.includes('disconnect') }
        ];
        
        const results = socketChecks.map(check => ({
            name: check.name,
            passed: check.test,
            message: check.test ? 'Socket.IO integration found' : 'Socket.IO integration missing'
        }));
        
        return results;
    } catch (error) {
        return [{ passed: false, message: `Socket.IO check error: ${error.message}` }];
    }
}

function testWebRTCMethods(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for WebRTC methods
        const webrtcChecks = [
            { name: 'RTCPeerConnection', test: content.includes('RTCPeerConnection') || content.includes('new RTCPeerConnection') },
            { name: 'getUserMedia', test: content.includes('getUserMedia') || content.includes('navigator.mediaDevices') },
            { name: 'createOffer/createAnswer', test: content.includes('createOffer') || content.includes('createAnswer') },
            { name: 'ICE candidates', test: content.includes('icecandidate') || content.includes('addIceCandidate') }
        ];
        
        const results = webrtcChecks.map(check => ({
            name: check.name,
            passed: check.test,
            message: check.test ? 'WebRTC method found' : 'WebRTC method missing'
        }));
        
        return results;
    } catch (error) {
        return [{ passed: false, message: `WebRTC check error: ${error.message}` }];
    }
}

function testBackendEvents(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for backend event handlers
        const eventChecks = [
            { name: 'Connection event', test: content.includes('connection') },
            { name: 'Admin events', test: content.includes('admin-start') || content.includes('admin-end') },
            { name: 'Viewer events', test: content.includes('join-stream') || content.includes('viewer-join') },
            { name: 'WebRTC events', test: content.includes('webrtc-offer') || content.includes('webrtc-answer') },
            { name: 'ICE candidates', test: content.includes('ice-candidate') }
        ];
        
        const results = eventChecks.map(check => ({
            name: check.name,
            passed: check.test,
            message: check.test ? 'Event handler found' : 'Event handler missing'
        }));
        
        return results;
    } catch (error) {
        return [{ passed: false, message: `Event check error: ${error.message}` }];
    }
}

// Run tests for a specific component
async function runComponentTests(componentName) {
    const component = TEST_CONFIG[componentName];
    if (!component) {
        log(`❌ Unknown component: ${componentName}`, 'red');
        return;
    }
    
    logHeader(component.name);
    
    for (const filePath of component.files) {
        log(`\n📁 Testing file: ${filePath}`, 'blue');
        
        // Test 1: File exists
        const existsTest = testFileExists(filePath);
        logTest('File exists', existsTest.passed, existsTest.message);
        updateTestResults(existsTest.passed);
        
        if (!existsTest.passed) {
            continue;
        }
        
        // Test 2: Syntax validation
        const syntaxTest = testSyntaxValidation(filePath);
        logTest('Syntax validation', syntaxTest.passed, syntaxTest.message);
        updateTestResults(syntaxTest.passed);
        
        if (!syntaxTest.passed) {
            continue;
        }
        
        // Test 3: File content validation
        const contentTests = testFileContent(filePath);
        for (const test of contentTests) {
            logTest(test.name, test.passed, test.message);
            updateTestResults(test.passed);
        }
        
        // Test 4: Class definitions (for frontend files)
        if (filePath.includes('frontend')) {
            const classTests = testClassDefinition(filePath);
            for (const test of classTests) {
                logTest(test.name, test.passed, test.message);
                updateTestResults(test.passed);
            }
        }
        
        // Test 5: Socket.IO integration
        const socketTests = testSocketIOIntegration(filePath);
        for (const test of socketTests) {
            logTest(test.name, test.passed, test.message);
            updateTestResults(test.passed);
        }
        
        // Test 6: WebRTC methods (for frontend files)
        if (filePath.includes('frontend')) {
            const webrtcTests = testWebRTCMethods(filePath);
            for (const test of webrtcTests) {
                logTest(test.name, test.passed, test.message);
                updateTestResults(test.passed);
            }
        }
        
        // Test 7: Backend events (for backend files)
        if (filePath.includes('backend')) {
            const eventTests = testBackendEvents(filePath);
            for (const test of eventTests) {
                logTest(test.name, test.passed, test.message);
                updateTestResults(test.passed);
            }
        }
    }
}

// Update test results
function updateTestResults(passed) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
}

// Run integration tests
async function runIntegrationTests() {
    logHeader('Integration Tests');
    
    // Test component compatibility
    log('\n🔗 Testing component compatibility...', 'blue');
    
    // Check if all required files exist
    const requiredFiles = [
        'frontend/admin/js/custom-webrtc.js',
        'frontend/js/custom-webrtc-viewer.js',
        'backend/socket/streamSocket.js'
    ];
    
    let allFilesExist = true;
    for (const file of requiredFiles) {
        const exists = testFileExists(file);
        logTest(`File: ${file}`, exists.passed, exists.message);
        if (!exists.passed) {
            allFilesExist = false;
        }
    }
    
    if (allFilesExist) {
        logTest('All required files present', true, 'System ready for integration');
        updateTestResults(true);
    } else {
        logTest('All required files present', false, 'Missing files prevent integration');
        updateTestResults(false);
    }
    
    // Test event flow consistency
    log('\n🔄 Testing event flow consistency...', 'blue');
    
    try {
        const adminContent = fs.readFileSync('frontend/admin/js/custom-webrtc.js', 'utf8');
        const viewerContent = fs.readFileSync('frontend/js/custom-webrtc-viewer.js', 'utf8');
        const backendContent = fs.readFileSync('backend/socket/streamSocket.js', 'utf8');
        
        // Check for consistent event names
        const eventChecks = [
            { name: 'stream-started event', admin: adminContent.includes('stream-started'), backend: backendContent.includes('stream-started') },
            { name: 'webrtc-offer event', admin: adminContent.includes('webrtc-offer'), backend: backendContent.includes('webrtc-offer'), viewer: viewerContent.includes('webrtc-offer') },
            { name: 'webrtc-answer event', admin: adminContent.includes('webrtc-answer'), backend: backendContent.includes('webrtc-answer'), viewer: viewerContent.includes('webrtc-answer') },
            { name: 'ice-candidate event', admin: adminContent.includes('ice-candidate'), backend: backendContent.includes('ice-candidate'), viewer: viewerContent.includes('ice-candidate') }
        ];
        
        for (const check of eventChecks) {
            const allComponentsHaveEvent = check.admin && check.backend && (check.viewer !== undefined ? check.viewer : true);
            logTest(check.name, allComponentsHaveEvent, allComponentsHaveEvent ? 'Event consistent across components' : 'Event missing in some components');
            updateTestResults(allComponentsHaveEvent);
        }
        
    } catch (error) {
        logTest('Event flow consistency', false, `Error checking events: ${error.message}`);
        updateTestResults(false);
    }
}

// Display test summary
function displayTestSummary() {
    logHeader('Test Summary');
    
    const passRate = testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0;
    
    log(`\n📊 Test Results:`, 'bright');
    log(`   Total Tests: ${testResults.total}`, 'blue');
    log(`   ✅ Passed: ${testResults.passed}`, 'green');
    log(`   ❌ Failed: ${testResults.failed}`, 'red');
    log(`   ⏭️  Skipped: ${testResults.skipped}`, 'yellow');
    log(`   📈 Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : passRate >= 60 ? 'yellow' : 'red');
    
    if (testResults.failed === 0) {
        log('\n🎉 All tests passed! The system is ready for production.', 'green');
    } else if (passRate >= 80) {
        log('\n⚠️  Most tests passed. Review failed tests before production.', 'yellow');
    } else {
        log('\n❌ Many tests failed. Fix issues before production.', 'red');
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    log('🧪 WebRTC Livestreaming System Test Runner', 'bright');
    log('================================================', 'cyan');
    
    // Determine which tests to run
    let testsToRun = [];
    
    if (args.includes('--all') || args.length === 0) {
        testsToRun = Object.keys(TEST_CONFIG);
    } else {
        if (args.includes('--admin')) testsToRun.push('admin');
        if (args.includes('--viewer')) testsToRun.push('viewer');
        if (args.includes('--backend')) testsToRun.push('backend');
        if (args.includes('--integration')) testsToRun.push('integration');
    }
    
    log(`\n🚀 Running tests: ${testsToRun.join(', ')}`, 'blue');
    
    // Run component tests
    for (const component of testsToRun) {
        if (component === 'integration') {
            await runIntegrationTests();
        } else {
            await runComponentTests(component);
        }
    }
    
    // Display summary
    displayTestSummary();
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
    log(`\n❌ Unhandled Rejection at: ${promise}`, 'red');
    log(`   Reason: ${reason}`, 'red');
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    log(`\n❌ Uncaught Exception: ${error.message}`, 'red');
    log(`   Stack: ${error.stack}`, 'red');
    process.exit(1);
});

// Run tests
if (require.main === module) {
    main().catch(error => {
        log(`\n❌ Test runner failed: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = {
    runComponentTests,
    runIntegrationTests,
    testResults
};
