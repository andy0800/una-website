#!/usr/bin/env node

/**
 * 🧪 WebRTC Functionality Tests
 * 
 * Specialized tests for WebRTC livestreaming functionality
 * Tests: Peer connections, media streams, signaling, ICE handling, etc.
 */

const fs = require('fs');
const path = require('path');

// WebRTC-specific test configuration
const WEBRTC_TEST_CONFIG = {
    // WebRTC Core Functions
    core: {
        name: 'WebRTC Core Functions',
        files: [
            'frontend/admin/js/custom-webrtc.js',
            'frontend/js/custom-webrtc-viewer.js'
        ],
        functions: [
            'RTCPeerConnection creation',
            'MediaStream acquisition',
            'getUserMedia implementation',
            'Constraints handling',
            'Stream tracks management',
            'Peer connection state management',
            'Connection establishment',
            'Data channel support'
        ]
    },

    // Signaling Functions
    signaling: {
        name: 'WebRTC Signaling Functions',
        files: [
            'frontend/admin/js/custom-webrtc.js',
            'frontend/js/custom-webrtc-viewer.js',
            'backend/socket/streamSocket.js'
        ],
        functions: [
            'Offer creation and sending',
            'Answer creation and sending',
            'ICE candidate exchange',
            'SDP negotiation',
            'Room ID generation',
            'Socket event handling',
            'Signaling state management',
            'Connection state monitoring'
        ]
    },

    // Media Handling Functions
    media: {
        name: 'WebRTC Media Functions',
        files: [
            'frontend/admin/js/custom-webrtc.js',
            'frontend/js/custom-webrtc-viewer.js'
        ],
        functions: [
            'Video stream handling',
            'Audio stream handling',
            'Stream quality adaptation',
            'Bandwidth management',
            'Codec selection',
            'Resolution scaling',
            'Frame rate control',
            'Audio level monitoring'
        ]
    },

    // Connection Management Functions
    connection: {
        name: 'WebRTC Connection Functions',
        files: [
            'frontend/admin/js/custom-webrtc.js',
            'frontend/js/custom-webrtc-viewer.js',
            'backend/socket/streamSocket.js'
        ],
        functions: [
            'Peer connection lifecycle',
            'Connection state transitions',
            'ICE connection state',
            'Signaling state',
            'Connection quality monitoring',
            'Reconnection handling',
            'Connection cleanup',
            'Error recovery'
        ]
    },

    // Room Management Functions
    room: {
        name: 'WebRTC Room Management Functions',
        files: [
            'backend/socket/streamSocket.js',
            'frontend/admin/js/custom-webrtc.js'
        ],
        functions: [
            'Room creation',
            'Room joining',
            'Room leaving',
            'Room cleanup',
            'Viewer management',
            'Admin authentication',
            'Room state persistence',
            'Room metadata management'
        ]
    },

    // Error Handling Functions
    errorHandling: {
        name: 'WebRTC Error Handling Functions',
        files: [
            'frontend/admin/js/custom-webrtc.js',
            'frontend/js/custom-webrtc-viewer.js',
            'backend/socket/streamSocket.js'
        ],
        functions: [
            'Connection failure handling',
            'Media access errors',
            'Network error recovery',
            'ICE failure handling',
            'SDP negotiation errors',
            'Stream error handling',
            'Authentication errors',
            'Permission errors'
        ]
    },

    // Performance Functions
    performance: {
        name: 'WebRTC Performance Functions',
        files: [
            'frontend/admin/js/custom-webrtc.js',
            'frontend/js/custom-webrtc-viewer.js'
        ],
        functions: [
            'Latency monitoring',
            'Bandwidth measurement',
            'Packet loss detection',
            'Jitter calculation',
            'Quality metrics',
            'Performance optimization',
            'Resource management',
            'Memory usage monitoring'
        ]
    },

    // Security Functions
    security: {
        name: 'WebRTC Security Functions',
        files: [
            'backend/socket/streamSocket.js',
            'frontend/admin/js/custom-webrtc.js'
        ],
        functions: [
            'Authentication validation',
            'Authorization checks',
            'Token verification',
            'Room access control',
            'Stream encryption',
            'Secure signaling',
            'Privacy protection',
            'Data validation'
        ]
    }
};

// WebRTC Test Runner
class WebRTCTestRunner {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            details: []
        };
    }

    // Run all WebRTC tests
    async runAllTests() {
        console.log('\n🚀 Starting WebRTC Functionality Tests...\n');
        
        for (const [category, config] of Object.entries(WEBRTC_TEST_CONFIG)) {
            await this.runCategoryTests(category, config);
        }
        
        this.generateReport();
    }

    // Run tests for a specific category
    async runCategoryTests(category, config) {
        console.log(`\n📋 Testing ${config.name}...`);
        console.log('='.repeat(60));
        
        for (const func of config.functions) {
            await this.testWebRTCFunction(category, func, config.files);
        }
    }

    // Test individual WebRTC function
    async testWebRTCFunction(category, functionName, files) {
        this.results.total++;
        
        try {
            // Check if files exist
            const fileExists = await this.checkFilesExist(files);
            if (!fileExists) {
                this.results.skipped++;
                console.log(`⏭️  SKIPPED: ${functionName} (files not found)`);
                return;
            }

            // Check WebRTC-specific implementation
            const implementation = await this.checkWebRTCImplementation(functionName, files);
            if (!implementation.exists) {
                this.results.failed++;
                this.results.details.push({
                    category,
                    function: functionName,
                    status: 'FAILED',
                    error: 'WebRTC function not implemented'
                });
                console.log(`❌ FAILED: ${functionName} (not implemented)`);
                return;
            }

            // Check WebRTC-specific issues
            const issues = await this.checkWebRTCIssues(functionName, files);
            if (issues.length > 0) {
                this.results.failed++;
                this.results.details.push({
                    category,
                    function: functionName,
                    status: 'FAILED',
                    error: `WebRTC issues: ${issues.join(', ')}`
                });
                console.log(`❌ FAILED: ${functionName} (issues: ${issues.join(', ')})`);
                return;
            }

            // Check WebRTC best practices
            const bestPractices = await this.checkWebRTCBestPractices(functionName, files);
            if (!bestPractices.compliant) {
                this.results.failed++;
                this.results.details.push({
                    category,
                    function: functionName,
                    status: 'FAILED',
                    error: `Best practices not followed: ${bestPractices.issues.join(', ')}`
                });
                console.log(`❌ FAILED: ${functionName} (best practices: ${bestPractices.issues.join(', ')})`);
                return;
            }

            this.results.passed++;
            console.log(`✅ PASSED: ${functionName}`);
            
        } catch (error) {
            this.results.failed++;
            this.results.details.push({
                category,
                function: functionName,
                status: 'FAILED',
                error: error.message
            });
            console.log(`❌ FAILED: ${functionName} (error: ${error.message})`);
        }
    }

    // Check if files exist
    async checkFilesExist(files) {
        for (const file of files) {
            if (!fs.existsSync(file)) {
                return false;
            }
        }
        return true;
    }

    // Check WebRTC-specific implementation
    async checkWebRTCImplementation(functionName, files) {
        const result = { exists: false, type: null };
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                const content = fs.readFileSync(file, 'utf8');
                
                // WebRTC-specific patterns
                const webrtcPatterns = {
                    'RTCPeerConnection': ['RTCPeerConnection', 'new RTCPeerConnection', 'createPeerConnection'],
                    'MediaStream': ['getUserMedia', 'MediaStream', 'navigator.mediaDevices'],
                    'Signaling': ['offer', 'answer', 'setLocalDescription', 'setRemoteDescription'],
                    'ICE': ['icecandidate', 'addIceCandidate', 'onicecandidate'],
                    'Connection': ['onconnectionstatechange', 'oniceconnectionstatechange', 'onsignalingstatechange'],
                    'Stream': ['getTracks', 'addTrack', 'removeTrack', 'onaddstream'],
                    'Room': ['roomId', 'createRoom', 'joinRoom', 'leaveRoom'],
                    'Error': ['onerror', 'catch', 'try', 'error handling']
                };
                
                // Find matching pattern
                for (const [type, patterns] of Object.entries(webrtcPatterns)) {
                    if (patterns.some(pattern => content.includes(pattern))) {
                        result.exists = true;
                        result.type = type;
                        break;
                    }
                }
                
                if (result.exists) break;
            }
        }
        
        return result;
    }

    // Check WebRTC-specific issues
    async checkWebRTCIssues(functionName, files) {
        const issues = [];
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                const content = fs.readFileSync(file, 'utf8');
                
                // WebRTC-specific issue checks
                if (content.includes('localhost') && content.includes('3000')) {
                    issues.push('Hardcoded localhost port');
                }
                
                if (content.includes('console.log') && !file.includes('test')) {
                    issues.push('Console logging in production code');
                }
                
                if (content.includes('TODO') || content.includes('FIXME')) {
                    issues.push('TODO/FIXME comments found');
                }
                
                // Check for missing WebRTC error handling
                if (content.includes('RTCPeerConnection') && !content.includes('onerror') && !content.includes('catch')) {
                    issues.push('Missing WebRTC error handling');
                }
                
                // Check for missing connection state handling
                if (content.includes('RTCPeerConnection') && !content.includes('onconnectionstatechange')) {
                    issues.push('Missing connection state handling');
                }
            }
        }
        
        return issues;
    }

    // Check WebRTC best practices
    async checkWebRTCBestPractices(functionName, files) {
        const result = { compliant: true, issues: [] };
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                const content = fs.readFileSync(file, 'utf8');
                
                // Check for proper cleanup
                if (content.includes('RTCPeerConnection') && !content.includes('close()')) {
                    result.compliant = false;
                    result.issues.push('Missing peer connection cleanup');
                }
                
                // Check for proper stream cleanup
                if (content.includes('getUserMedia') && !content.includes('getTracks().forEach(track => track.stop())')) {
                    result.compliant = false;
                    result.issues.push('Missing stream track cleanup');
                }
                
                // Check for proper error handling
                if (content.includes('RTCPeerConnection') && !content.includes('try') && !content.includes('catch')) {
                    result.compliant = false;
                    result.issues.push('Missing try-catch error handling');
                }
                
                // Check for proper state management
                if (content.includes('RTCPeerConnection') && !content.includes('connectionState')) {
                    result.compliant = false;
                    result.issues.push('Missing connection state management');
                }
            }
        }
        
        return result;
    }

    // Generate WebRTC test report
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 WEBRTC FUNCTIONALITY TEST RESULTS');
        console.log('='.repeat(80));
        
        console.log(`\n📈 Summary:`);
        console.log(`   Total Tests: ${this.results.total}`);
        console.log(`   ✅ Passed: ${this.results.passed}`);
        console.log(`   ❌ Failed: ${this.results.failed}`);
        console.log(`   ⏭️  Skipped: ${this.results.skipped}`);
        console.log(`   Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(2)}%`);
        
        if (this.results.failed > 0) {
            console.log(`\n❌ Failed Tests:`);
            this.results.details
                .filter(detail => detail.status === 'FAILED')
                .forEach(detail => {
                    console.log(`   ${detail.category} > ${detail.function}: ${detail.error}`);
                });
        }
        
        if (this.results.skipped > 0) {
            console.log(`\n⏭️  Skipped Tests:`);
            this.results.details
                .filter(detail => detail.status === 'SKIPPED')
                .forEach(detail => {
                    console.log(`   ${detail.category} > ${detail.function}: ${detail.error}`);
                });
        }
        
        // Save detailed report
        const reportPath = 'tests/webrtc-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        // Exit with appropriate code
        process.exit(this.results.failed > 0 ? 1 : 0);
    }
}

// Main execution
if (require.main === module) {
    const runner = new WebRTCTestRunner();
    runner.runAllTests().catch(error => {
        console.error('❌ WebRTC test runner error:', error);
        process.exit(1);
    });
}

module.exports = WebRTCTestRunner;
