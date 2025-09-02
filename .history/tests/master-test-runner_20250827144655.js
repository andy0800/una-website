#!/usr/bin/env node

/**
 * 🧪 Master Test Runner
 * 
 * Executes all test suites and provides comprehensive system validation
 * Covers: Comprehensive Functions, WebRTC, Socket.IO, and Integration
 */

const fs = require('fs');
const path = require('path');

// Import test runners
const ComprehensiveTestRunner = require('./comprehensive-function-tests');
const WebRTCTestRunner = require('./webrtc-functionality-tests');
const SocketTestRunner = require('./socket-functionality-tests');

// Master test configuration
const MASTER_TEST_CONFIG = {
    comprehensive: {
        name: 'Comprehensive Function Tests',
        runner: ComprehensiveTestRunner,
        description: 'Tests all possible functions across the entire system',
        priority: 'high'
    },
    webrtc: {
        name: 'WebRTC Functionality Tests',
        runner: WebRTCTestRunner,
        description: 'Tests WebRTC livestreaming functionality',
        priority: 'high'
    },
    socket: {
        name: 'Socket.IO Functionality Tests',
        runner: SocketTestRunner,
        description: 'Tests Socket.IO real-time communication',
        priority: 'high'
    }
};

// Master Test Runner
class MasterTestRunner {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            suites: {},
            startTime: null,
            endTime: null,
            duration: null
        };
        this.currentSuite = null;
    }

    // Run all test suites
    async runAllSuites() {
        console.log('\n🚀 Starting Master Test Suite Execution...\n');
        console.log('='.repeat(80));
        console.log('🧪 COMPREHENSIVE SYSTEM VALIDATION');
        console.log('='.repeat(80));
        
        this.results.startTime = new Date();
        
        for (const [suiteName, config] of Object.entries(MASTER_TEST_CONFIG)) {
            await this.runTestSuite(suiteName, config);
        }
        
        this.results.endTime = new Date();
        this.results.duration = this.results.endTime - this.results.startTime;
        
        this.generateMasterReport();
    }

    // Run individual test suite
    async runTestSuite(suiteName, config) {
        console.log(`\n📋 Running ${config.name}...`);
        console.log(`   Description: ${config.description}`);
        console.log(`   Priority: ${config.priority.toUpperCase()}`);
        console.log('='.repeat(60));
        
        try {
            const runner = new config.runner();
            const suiteResults = await this.executeSuite(runner);
            
            this.results.suites[suiteName] = {
                name: config.name,
                priority: config.priority,
                results: suiteResults,
                status: suiteResults.failed > 0 ? 'FAILED' : 'PASSED'
            };
            
            // Aggregate results
            this.results.total += suiteResults.total;
            this.results.passed += suiteResults.passed;
            this.results.failed += suiteResults.failed;
            this.results.skipped += suiteResults.skipped;
            
        } catch (error) {
            console.error(`❌ Error running ${suiteName} suite:`, error);
            this.results.suites[suiteName] = {
                name: config.name,
                priority: config.priority,
                error: error.message,
                status: 'ERROR'
            };
        }
    }

    // Execute test suite and capture results
    async executeSuite(runner) {
        // Capture console output
        const originalLog = console.log;
        const originalError = console.error;
        let output = '';
        
        console.log = (...args) => {
            output += args.join(' ') + '\n';
            originalLog(...args);
        };
        
        console.error = (...args) => {
            output += 'ERROR: ' + args.join(' ') + '\n';
            originalError(...args);
        };
        
        try {
            // Run the suite
            await runner.runAllTests();
            
            // Return results (this won't execute due to process.exit in individual runners)
            return {
                total: runner.results.total,
                passed: runner.results.passed,
                failed: runner.results.failed,
                skipped: runner.results.skipped,
                output: output
            };
            
        } catch (error) {
            // Handle case where suite doesn't exit
            return {
                total: runner.results.total || 0,
                passed: runner.results.passed || 0,
                failed: runner.results.failed || 0,
                skipped: runner.results.skipped || 0,
                output: output,
                error: error.message
            };
        } finally {
            // Restore console functions
            console.log = originalLog;
            console.error = originalError;
        }
    }

    // Generate master test report
    generateMasterReport() {
        console.log('\n' + '='.repeat(100));
        console.log('📊 MASTER TEST SUITE RESULTS');
        console.log('='.repeat(100));
        
        console.log(`\n⏱️  Test Execution Summary:`);
        console.log(`   Start Time: ${this.results.startTime.toISOString()}`);
        console.log(`   End Time: ${this.results.endTime.toISOString()}`);
        console.log(`   Duration: ${(this.results.duration / 1000).toFixed(2)} seconds`);
        
        console.log(`\n📈 Overall Results:`);
        console.log(`   Total Tests: ${this.results.total}`);
        console.log(`   ✅ Passed: ${this.results.passed}`);
        console.log(`   ❌ Failed: ${this.results.failed}`);
        console.log(`   ⏭️  Skipped: ${this.results.skipped}`);
        console.log(`   Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(2)}%`);
        
        console.log(`\n📋 Suite Results:`);
        for (const [suiteName, suite] of Object.entries(this.results.suites)) {
            const statusIcon = suite.status === 'PASSED' ? '✅' : suite.status === 'FAILED' ? '❌' : '⚠️';
            console.log(`   ${statusIcon} ${suite.name}: ${suite.status}`);
            
            if (suite.results) {
                console.log(`      Tests: ${suite.results.passed}/${suite.results.total} passed`);
            }
            
            if (suite.error) {
                console.log(`      Error: ${suite.error}`);
            }
        }
        
        // System health assessment
        this.assessSystemHealth();
        
        // Save master report
        const reportPath = 'tests/master-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Master report saved to: ${reportPath}`);
        
        // Exit with appropriate code
        const hasFailures = this.results.failed > 0 || Object.values(this.results.suites).some(s => s.status === 'FAILED');
        process.exit(hasFailures ? 1 : 0);
    }

    // Assess overall system health
    assessSystemHealth() {
        console.log(`\n🏥 System Health Assessment:`);
        
        const totalSuites = Object.keys(this.results.suites).length;
        const passedSuites = Object.values(this.results.suites).filter(s => s.status === 'PASSED').length;
        const failedSuites = Object.values(this.results.suites).filter(s => s.status === 'FAILED').length;
        const errorSuites = Object.values(this.results.suites).filter(s => s.status === 'ERROR').length;
        
        const overallSuccessRate = (this.results.passed / this.results.total) * 100;
        const suiteSuccessRate = (passedSuites / totalSuites) * 100;
        
        // Health indicators
        if (overallSuccessRate >= 95 && suiteSuccessRate >= 90) {
            console.log(`   🟢 EXCELLENT: System is in excellent condition`);
        } else if (overallSuccessRate >= 85 && suiteSuccessRate >= 75) {
            console.log(`   🟡 GOOD: System is functioning well with minor issues`);
        } else if (overallSuccessRate >= 70 && suiteSuccessRate >= 50) {
            console.log(`   🟠 FAIR: System has some issues that need attention`);
        } else {
            console.log(`   🔴 POOR: System has significant issues requiring immediate attention`);
        }
        
        console.log(`   Overall Test Success: ${overallSuccessRate.toFixed(2)}%`);
        console.log(`   Suite Success Rate: ${suiteSuccessRate.toFixed(2)}%`);
        console.log(`   Critical Issues: ${failedSuites}`);
        console.log(`   System Errors: ${errorSuites}`);
        
        // Recommendations
        this.provideRecommendations();
    }

    // Provide system recommendations
    provideRecommendations() {
        console.log(`\n💡 Recommendations:`);
        
        if (this.results.failed > 0) {
            console.log(`   🔧 Fix ${this.results.failed} failed tests to improve system reliability`);
        }
        
        if (this.results.skipped > 0) {
            console.log(`   📝 Review ${this.results.skipped} skipped tests to ensure complete coverage`);
        }
        
        const failedSuites = Object.values(this.results.suites).filter(s => s.status === 'FAILED');
        if (failedSuites.length > 0) {
            console.log(`   🚨 Prioritize fixing failed test suites: ${failedSuites.map(s => s.name).join(', ')}`);
        }
        
        if (this.results.total < 100) {
            console.log(`   📊 Consider adding more tests to improve coverage (currently ${this.results.total} tests)`);
        }
        
        console.log(`   🔄 Run tests regularly to maintain system health`);
        console.log(`   📈 Monitor success rates over time for trends`);
    }

    // Run specific test suite
    async runSpecificSuite(suiteName) {
        if (!MASTER_TEST_CONFIG[suiteName]) {
            console.error(`❌ Unknown test suite: ${suiteName}`);
            console.log(`Available suites: ${Object.keys(MASTER_TEST_CONFIG).join(', ')}`);
            process.exit(1);
        }
        
        console.log(`\n🎯 Running specific test suite: ${suiteName}`);
        await this.runTestSuite(suiteName, MASTER_TEST_CONFIG[suiteName]);
        
        this.results.endTime = new Date();
        this.results.duration = this.results.endTime - this.results.startTime;
        this.generateMasterReport();
    }

    // List available test suites
    listSuites() {
        console.log('\n📋 Available Test Suites:');
        console.log('='.repeat(60));
        
        for (const [suiteName, config] of Object.entries(MASTER_TEST_CONFIG)) {
            console.log(`\n🔧 ${suiteName.toUpperCase()}`);
            console.log(`   Name: ${config.name}`);
            console.log(`   Description: ${config.description}`);
            console.log(`   Priority: ${config.priority.toUpperCase()}`);
        }
        
        console.log(`\n💡 Usage:`);
        console.log(`   node tests/master-test-runner.js                    # Run all suites`);
        console.log(`   node tests/master-test-runner.js --suite <name>     # Run specific suite`);
        console.log(`   node tests/master-test-runner.js --list            # List available suites`);
    }
}

// Main execution
if (require.main === module) {
    const runner = new MasterTestRunner();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--list') || args.includes('-l')) {
        runner.listSuites();
        process.exit(0);
    }
    
    if (args.includes('--suite') || args.includes('-s')) {
        const suiteIndex = args.indexOf('--suite') !== -1 ? args.indexOf('--suite') : args.indexOf('-s');
        const suiteName = args[suiteIndex + 1];
        
        if (!suiteName) {
            console.error('❌ Please specify a suite name');
            runner.listSuites();
            process.exit(1);
        }
        
        runner.runSpecificSuite(suiteName).catch(error => {
            console.error('❌ Master test runner error:', error);
            process.exit(1);
        });
    } else {
        // Run all suites by default
        runner.runAllSuites().catch(error => {
            console.error('❌ Master test runner error:', error);
            process.exit(1);
        });
    }
}

module.exports = MasterTestRunner;
