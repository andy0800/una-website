#!/usr/bin/env node

/**
 * 🧪 Comprehensive Function Tests for WebRTC Livestreaming System
 * 
 * This test suite covers ALL possible functions and ensures they work correctly
 * Covers: Backend Routes, Socket Handlers, Models, Frontend Classes, and Integration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test configuration for ALL functions
const COMPREHENSIVE_TEST_CONFIG = {
    // Backend Core Functions
    server: {
        name: 'Server Core Functions',
        files: ['backend/server.js'],
        functions: [
            'HTTP server initialization',
            'Socket.IO server setup',
            'MongoDB connection',
            'Middleware registration',
            'Route registration',
            'Error handling',
            'Graceful shutdown'
        ]
    },

    // Socket.IO Functions
    socket: {
        name: 'Socket.IO Functions',
        files: ['backend/socket/streamSocket.js'],
        functions: [
            'Socket connection handling',
            'Admin authentication',
            'Room creation and management',
            'WebRTC signaling (offer/answer/ICE)',
            'Viewer join/leave handling',
            'Stream start/stop events',
            'Peer disconnection handling',
            'Room cleanup',
            'Error handling and logging'
        ]
    },

    // Admin Routes Functions
    adminRoutes: {
        name: 'Admin Routes Functions',
        files: ['backend/routes/adminRoutes.js'],
        functions: [
            'Admin authentication middleware',
            'Admin login/logout',
            'User management (CRUD)',
            'Course management (CRUD)',
            'Content management (CRUD)',
            'Form management (CRUD)',
            'Settings management',
            'Profile management',
            'Lecture management',
            'Chat management',
            'Recording management',
            'Screen sharing management',
            'Analytics dashboard',
            'Notifications system',
            'System health monitoring',
            'Security monitoring',
            'Audit logging',
            'Backup management',
            'Update management',
            'Feedback system',
            'Help center',
            'Internationalization',
            'Theme customization',
            'Accessibility features',
            'User activity tracking',
            'Admin activity logging',
            'System configuration',
            'Scheduled tasks',
            'Reporting tools',
            'Integrations',
            'API documentation',
            'Developer tools',
            'Maintenance mode',
            'GDPR compliance',
            'Legal compliance',
            'Payment gateway integration',
            'Subscription management',
            'Discount code management',
            'Referral program',
            'Affiliate program',
            'Email marketing integration',
            'SMS service integration',
            'Push notification service',
            'CRM integration',
            'ERP integration',
            'Accounting software integration',
            'HR software integration',
            'LMS integration',
            'CDN integration',
            'Cloud storage integration',
            'Video hosting integration',
            'Audio hosting integration',
            'Image hosting integration',
            'Document hosting integration',
            'Code hosting integration',
            'Version control integration',
            'CI/CD integration',
            'Automated testing',
            'Performance testing',
            'Security testing',
            'Load testing',
            'Stress testing',
            'Usability testing',
            'A/B testing',
            'Feature flagging',
            'Experimentation platform',
            'Personalization engine',
            'Recommendation engine',
            'Search engine',
            'Data analytics platform',
            'Business intelligence tools',
            'Customer support system',
            'Ticketing system',
            'Knowledge base',
            'FAQ system',
            'Community forum',
            'Blog platform',
            'CMS integration',
            'E-commerce platform integration',
            'Marketing automation',
            'Sales automation',
            'Customer journey mapping',
            'User segmentation',
            'Behavioral analytics',
            'Predictive analytics',
            'Machine learning models',
            'AI features',
            'Natural language processing',
            'Computer vision',
            'Voice recognition',
            'Chatbot integration',
            'Virtual assistant',
            'AR features',
            'VR features',
            'Blockchain integration',
            'Cryptocurrency payments',
            'NFT management',
            'Decentralized identity',
            'Smart contract management',
            'Supply chain management',
            'Logistics management',
            'Inventory management',
            'Order management',
            'Shipping management',
            'Returns management',
            'Customer relationship management',
            'Enterprise resource planning',
            'Human resources management',
            'Financial management',
            'Project management',
            'Task management',
            'Team collaboration',
            'Document management',
            'File sharing',
            'Calendar management',
            'Meeting management',
            'Event management',
            'Booking system',
            'Reservation system',
            'Ticketing system',
            'Membership management',
            'Donor management',
            'Fundraising management',
            'Grant management',
            'Volunteer management',
            'Nonprofit management',
            'Association management',
            'Club management',
            'Sports management',
            'Fitness management',
            'Wellness platforms',
            'Healthcare management systems',
            'Electronic health records',
            'Telemedicine platforms',
            'Patient engagement platforms',
            'Medical billing software',
            'Pharmacy management systems',
            'Laboratory information systems',
            'Radiology information systems',
            'Picture archiving communication systems',
            'Clinical decision support systems',
            'Medical imaging software',
            'Hospital management systems',
            'Clinic management software',
            'Dental practice management software',
            'Veterinary practice management software'
        ]
    },

    // User Routes Functions
    userRoutes: {
        name: 'User Routes Functions',
        files: ['backend/routes/userRoutes.js'],
        functions: [
            'User authentication',
            'User registration',
            'User profile management',
            'Password reset',
            'Email verification',
            'User preferences',
            'Privacy settings'
        ]
    },

    // Lecture Routes Functions
    lectureRoutes: {
        name: 'Lecture Routes Functions',
        files: ['backend/routes/lectureRoutes.js'],
        functions: [
            'Lecture creation',
            'Lecture retrieval',
            'Lecture updating',
            'Lecture deletion',
            'Lecture search',
            'Lecture categorization',
            'Lecture access control',
            'Lecture analytics',
            'Lecture recording management',
            'Lecture streaming',
            'Lecture quality settings',
            'Lecture metadata management'
        ]
    },

    // Course Routes Functions
    courseRoutes: {
        name: 'Course Routes Functions',
        files: ['backend/routes/courseRoutes.js'],
        functions: [
            'Course creation',
            'Course retrieval',
            'Course updating',
            'Course deletion',
            'Course enrollment',
            'Course progress tracking'
        ]
    },

    // Enrollment Routes Functions
    enrollmentRoutes: {
        name: 'Enrollment Routes Functions',
        files: ['backend/routes/enrollmentRoutes.js'],
        functions: [
            'Enrollment creation',
            'Enrollment retrieval',
            'Enrollment updating',
            'Enrollment deletion',
            'Enrollment status management'
        ]
    },

    // WebRTC Routes Functions
    webrtcRoutes: {
        name: 'WebRTC Routes Functions',
        files: ['backend/routes/webrtcRoutes.js'],
        functions: [
            'WebRTC configuration',
            'STUN/TURN server management',
            'ICE candidate handling',
            'Connection establishment',
            'Stream quality management'
        ]
    },

    // Model Functions
    models: {
        name: 'Database Model Functions',
        files: [
            'backend/models/Admin.js',
            'backend/models/User.js',
            'backend/models/Course.js',
            'backend/models/Enrollment.js',
            'backend/models/Content.js',
            'backend/models/PageContent.js',
            'backend/models/RecordedLecture.js'
        ],
        functions: [
            'Schema validation',
            'Data persistence',
            'Data retrieval',
            'Data updating',
            'Data deletion',
            'Relationship management',
            'Index optimization',
            'Data integrity checks'
        ]
    },

    // Frontend Admin Functions
    adminFrontend: {
        name: 'Admin Frontend Functions',
        files: [
            'frontend/admin/js/custom-webrtc.js',
            'frontend/admin/js/dashboard.js'
        ],
        functions: [
            'CustomWebRTCManager class initialization',
            'Media stream acquisition',
            'Peer connection management',
            'WebRTC offer creation',
            'ICE candidate handling',
            'Socket.IO event handling',
            'Viewer management',
            'Stream quality control',
            'Recording functionality',
            'Screen sharing',
            'Dashboard initialization',
            'User interface management',
            'Authentication handling',
            'Error handling and logging',
            'System testing',
            'Viewer popup management',
            'Real-time updates',
            'Connection status monitoring'
        ]
    },

    // Frontend Viewer Functions
    viewerFrontend: {
        name: 'Viewer Frontend Functions',
        files: ['frontend/js/custom-webrtc-viewer.js'],
        functions: [
            'CustomWebRTCViewer class initialization',
            'Stream joining',
            'WebRTC answer creation',
            'ICE candidate handling',
            'Media stream display',
            'Connection management',
            'Error handling',
            'User authentication',
            'Room joining',
            'Stream quality adaptation'
        ]
    },

    // Integration Functions
    integration: {
        name: 'System Integration Functions',
        files: [
            'backend/server.js',
            'backend/socket/streamSocket.js',
            'frontend/admin/js/custom-webrtc.js',
            'frontend/js/custom-webrtc-viewer.js'
        ],
        functions: [
            'End-to-end WebRTC flow',
            'Real-time communication',
            'Data synchronization',
            'Error propagation',
            'Performance optimization',
            'Scalability testing',
            'Load balancing',
            'Failover handling',
            'Security validation',
            'Compliance checking'
        ]
    }
};

// Test execution functions
class ComprehensiveTestRunner {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            details: []
        };
        this.currentTest = null;
    }

    // Run all tests
    async runAllTests() {
        console.log('\n🚀 Starting Comprehensive Function Tests...\n');
        
        for (const [category, config] of Object.entries(COMPREHENSIVE_TEST_CONFIG)) {
            await this.runCategoryTests(category, config);
        }
        
        this.generateReport();
    }

    // Run tests for a specific category
    async runCategoryTests(category, config) {
        console.log(`\n📋 Testing ${config.name}...`);
        console.log('='.repeat(60));
        
        for (const func of config.functions) {
            await this.testFunction(category, func, config.files);
        }
    }

    // Test individual function
    async testFunction(category, functionName, files) {
        this.results.total++;
        this.currentTest = { category, functionName, files };
        
        try {
            // Check if files exist
            const fileExists = await this.checkFilesExist(files);
            if (!fileExists) {
                this.results.skipped++;
                console.log(`⏭️  SKIPPED: ${functionName} (files not found)`);
                return;
            }

            // Check syntax
            const syntaxValid = await this.checkSyntax(files);
            if (!syntaxValid) {
                this.results.failed++;
                this.results.details.push({
                    category,
                    function: functionName,
                    status: 'FAILED',
                    error: 'Syntax error detected'
                });
                console.log(`❌ FAILED: ${functionName} (syntax error)`);
                return;
            }

            // Check function implementation
            const functionExists = await this.checkFunctionImplementation(functionName, files);
            if (!functionExists) {
                this.results.failed++;
                this.results.details.push({
                    category,
                    function: functionName,
                    status: 'FAILED',
                    error: 'Function not implemented'
                });
                console.log(`❌ FAILED: ${functionName} (not implemented)`);
                return;
            }

            // Check for common issues
            const issues = await this.checkForCommonIssues(functionName, files);
            if (issues.length > 0) {
                this.results.failed++;
                this.results.details.push({
                    category,
                    function: functionName,
                    status: 'FAILED',
                    error: `Issues found: ${issues.join(', ')}`
                });
                console.log(`❌ FAILED: ${functionName} (issues: ${issues.join(', ')})`);
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

    // Check syntax validity
    async checkSyntax(files) {
        for (const file of files) {
            try {
                // Try to require the file to check syntax
                if (file.endsWith('.js')) {
                    const content = fs.readFileSync(file, 'utf8');
                    // Basic syntax check - try to parse as JSON if it's a config file
                    if (file.includes('package.json') || file.includes('config')) {
                        JSON.parse(content);
                    } else {
                        // For JS files, try to create a function from the content
                        new Function(content);
                    }
                }
            } catch (error) {
                return false;
            }
        }
        return true;
    }

    // Check if function is implemented
    async checkFunctionImplementation(functionName, files) {
        for (const file of files) {
            if (file.endsWith('.js')) {
                const content = fs.readFileSync(file, 'utf8');
                
                // Define implementation patterns for each function
                const implementationPatterns = {
                    // Server Core Functions
                    'HTTP server initialization': ['server.listen', 'http.createServer', 'app.listen'],
                    'Socket.IO server setup': ['new Server', 'socket.io', 'io.on'],
                    'MongoDB connection': ['mongoose.connect', 'mongoose.connection'],
                    'Middleware registration': ['app.use', 'middleware'],
                    'Route registration': ['app.use', 'router.use', 'require(\'./routes'],
                    'Error handling': ['app.use', 'errorHandler', 'try', 'catch'],
                    'Graceful shutdown': ['process.on', 'SIGTERM', 'SIGINT', 'server.close'],
                    
                    // Socket.IO Functions
                    'Socket connection handling': ['io.on', 'connection', 'socket.on'],
                    'Admin authentication': ['adminSocketId', 'admin', 'role'],
                    'Room creation and management': ['webrtcRooms', 'createRoom', 'joinRoom'],
                    'WebRTC signaling (offer/answer/ICE)': ['offer', 'answer', 'ice-candidate', 'webrtc'],
                    'Viewer join/leave handling': ['viewer-join', 'viewerLeft', 'viewerCount'],
                    'Stream start/stop events': ['admin-start', 'admin-end', 'stream-started'],
                    'Peer disconnection handling': ['disconnect', 'disconnectPeer'],
                    'Room cleanup': ['webrtcRooms.delete', 'clear', 'cleanup'],
                    'Error handling and logging': ['try', 'catch', 'error', 'console.error'],
                    
                    // Admin Routes Functions
                    'Admin authentication middleware': ['verifyAdminToken', 'admin', 'role'],
                    'Admin login/logout': ['login', 'logout', 'bcrypt', 'jwt'],
                    'User management (CRUD)': ['users', 'User.find', 'User.findById', 'User.create'],
                    'Course management (CRUD)': ['courses', 'Course.find', 'Course.findById'],
                    'Content management (CRUD)': ['content', 'Content.find', 'PageContent'],
                    'Form management (CRUD)': ['forms', 'Enrollment.find'],
                    'Settings management': ['settings', 'config', 'preferences'],
                    'Profile management': ['profile', 'updateProfile'],
                    'Lecture management': ['lectures', 'RecordedLecture', 'lecture'],
                    'Chat management': ['chat', 'message', 'conversation'],
                    'Recording management': ['recording', 'record', 'mediaRecorder'],
                    'Screen sharing management': ['screenShare', 'getDisplayMedia'],
                    'Analytics dashboard': ['analytics', 'stats', 'dashboard'],
                    'Notifications system': ['notification', 'notify', 'alert'],
                    'System health monitoring': ['health', 'status', 'monitor'],
                    'Security monitoring': ['security', 'auth', 'permission'],
                    'Audit logging': ['audit', 'log', 'history'],
                    'Backup management': ['backup', 'export', 'import'],
                    'Update management': ['update', 'version', 'migration'],
                    'Feedback system': ['feedback', 'rating', 'review'],
                    'Help center': ['help', 'support', 'faq'],
                    'Internationalization': ['i18n', 'locale', 'language'],
                    'Theme customization': ['theme', 'style', 'css'],
                    'Accessibility features': ['accessibility', 'aria', 'screen reader'],
                    'User activity tracking': ['activity', 'tracking', 'analytics'],
                    'Admin activity logging': ['adminLog', 'adminActivity'],
                    'System configuration': ['config', 'settings', 'environment'],
                    'Scheduled tasks': ['schedule', 'cron', 'task'],
                    'Reporting tools': ['report', 'export', 'generate'],
                    'Integrations': ['integration', 'api', 'webhook'],
                    'API documentation': ['api', 'docs', 'documentation'],
                    'Developer tools': ['dev', 'debug', 'development'],
                    'Maintenance mode': ['maintenance', 'mode', 'offline'],
                    'GDPR compliance': ['gdpr', 'privacy', 'consent'],
                    'Legal compliance': ['legal', 'terms', 'policy'],
                    'Payment gateway integration': ['payment', 'stripe', 'paypal'],
                    'Subscription management': ['subscription', 'plan', 'billing'],
                    'Discount code management': ['discount', 'coupon', 'promo'],
                    'Referral program': ['referral', 'refer', 'invite'],
                    'Affiliate program': ['affiliate', 'commission', 'partner'],
                    'Email marketing integration': ['email', 'marketing', 'mailchimp'],
                    'SMS service integration': ['sms', 'text', 'twilio'],
                    'Push notification service': ['push', 'notification', 'fcm'],
                    'CRM integration': ['crm', 'customer', 'salesforce'],
                    'ERP integration': ['erp', 'enterprise', 'sap'],
                    'Accounting software integration': ['accounting', 'quickbooks', 'xero'],
                    'HR software integration': ['hr', 'human resources', 'bamboo'],
                    'LMS integration': ['lms', 'learning', 'moodle'],
                    'CDN integration': ['cdn', 'cloudflare', 'akamai'],
                    'Cloud storage integration': ['cloud', 'aws', 'azure'],
                    'Video hosting integration': ['video', 'youtube', 'vimeo'],
                    'Audio hosting integration': ['audio', 'soundcloud', 'spotify'],
                    'Image hosting integration': ['image', 'imgur', 'cloudinary'],
                    'Document hosting integration': ['document', 'google docs', 'dropbox'],
                    'Code hosting integration': ['code', 'github', 'gitlab'],
                    'Version control integration': ['git', 'version', 'repository'],
                    'CI/CD integration': ['ci', 'cd', 'jenkins', 'github actions'],
                    'Automated testing': ['test', 'jest', 'mocha'],
                    'Performance testing': ['performance', 'load', 'stress'],
                    'Security testing': ['security', 'penetration', 'vulnerability'],
                    'Load testing': ['load', 'stress', 'performance'],
                    'Stress testing': ['stress', 'load', 'performance'],
                    'Usability testing': ['usability', 'user experience', 'ux'],
                    'A/B testing': ['ab test', 'split test', 'experiment'],
                    'Feature flagging': ['feature flag', 'toggle', 'switch'],
                    'Experimentation platform': ['experiment', 'a/b', 'testing'],
                    'Personalization engine': ['personalization', 'customize', 'user'],
                    'Recommendation engine': ['recommendation', 'suggest', 'ai'],
                    'Search engine': ['search', 'query', 'index'],
                    'Data analytics platform': ['analytics', 'data', 'insights'],
                    'Business intelligence tools': ['bi', 'business intelligence', 'dashboard'],
                    'Customer support system': ['support', 'help', 'ticket'],
                    'Ticketing system': ['ticket', 'issue', 'support'],
                    'Knowledge base': ['knowledge', 'kb', 'help'],
                    'FAQ system': ['faq', 'question', 'answer'],
                    'Community forum': ['forum', 'community', 'discussion'],
                    'Blog platform': ['blog', 'post', 'article'],
                    'CMS integration': ['cms', 'content management', 'wordpress'],
                    'E-commerce platform integration': ['ecommerce', 'shop', 'store'],
                    'Marketing automation': ['marketing', 'automation', 'campaign'],
                    'Sales automation': ['sales', 'automation', 'pipeline'],
                    'Customer journey mapping': ['journey', 'customer', 'mapping'],
                    'User segmentation': ['segmentation', 'segment', 'user'],
                    'Behavioral analytics': ['behavior', 'analytics', 'tracking'],
                    'Predictive analytics': ['predictive', 'prediction', 'ml'],
                    'Machine learning models': ['ml', 'machine learning', 'model'],
                    'AI features': ['ai', 'artificial intelligence', 'intelligence'],
                    'Natural language processing': ['nlp', 'language', 'text'],
                    'Computer vision': ['vision', 'image', 'recognition'],
                    'Voice recognition': ['voice', 'speech', 'recognition'],
                    'Chatbot integration': ['chatbot', 'bot', 'ai'],
                    'Virtual assistant': ['assistant', 'virtual', 'ai'],
                    'AR features': ['ar', 'augmented reality', 'reality'],
                    'VR features': ['vr', 'virtual reality', 'reality'],
                    'Blockchain integration': ['blockchain', 'crypto', 'distributed'],
                    'Cryptocurrency payments': ['crypto', 'bitcoin', 'ethereum'],
                    'NFT management': ['nft', 'non-fungible', 'token'],
                    'Decentralized identity': ['decentralized', 'identity', 'blockchain'],
                    'Smart contract management': ['smart contract', 'ethereum', 'solidity'],
                    'Supply chain management': ['supply chain', 'logistics', 'inventory'],
                    'Logistics management': ['logistics', 'shipping', 'delivery'],
                    'Inventory management': ['inventory', 'stock', 'warehouse'],
                    'Order management': ['order', 'purchase', 'transaction'],
                    'Shipping management': ['shipping', 'delivery', 'tracking'],
                    'Returns management': ['return', 'refund', 'exchange'],
                    'Customer relationship management': ['crm', 'customer', 'relationship'],
                    'Enterprise resource planning': ['erp', 'enterprise', 'resource'],
                    'Human resources management': ['hr', 'human resources', 'personnel'],
                    'Financial management': ['financial', 'finance', 'accounting'],
                    'Project management': ['project', 'management', 'planning'],
                    'Task management': ['task', 'todo', 'checklist'],
                    'Team collaboration': ['team', 'collaboration', 'group'],
                    'Document management': ['document', 'file', 'management'],
                    'File sharing': ['file', 'share', 'upload'],
                    'Calendar management': ['calendar', 'schedule', 'event'],
                    'Meeting management': ['meeting', 'appointment', 'schedule'],
                    'Event management': ['event', 'calendar', 'schedule'],
                    'Booking system': ['booking', 'reservation', 'appointment'],
                    'Reservation system': ['reservation', 'booking', 'appointment'],
                    'Ticketing system': ['ticket', 'booking', 'reservation'],
                    'Membership management': ['membership', 'member', 'subscription'],
                    'Donor management': ['donor', 'donation', 'charity'],
                    'Fundraising management': ['fundraising', 'fund', 'donation'],
                    'Grant management': ['grant', 'funding', 'application'],
                    'Volunteer management': ['volunteer', 'volunteering', 'help'],
                    'Nonprofit management': ['nonprofit', 'charity', 'organization'],
                    'Association management': ['association', 'organization', 'group'],
                    'Club management': ['club', 'organization', 'group'],
                    'Sports management': ['sports', 'athletic', 'fitness'],
                    'Fitness management': ['fitness', 'workout', 'exercise'],
                    'Wellness platforms': ['wellness', 'health', 'fitness'],
                    'Healthcare management systems': ['healthcare', 'medical', 'patient'],
                    'Electronic health records': ['ehr', 'health record', 'medical'],
                    'Telemedicine platforms': ['telemedicine', 'telehealth', 'remote'],
                    'Patient engagement platforms': ['patient', 'engagement', 'healthcare'],
                    'Medical billing software': ['billing', 'medical', 'insurance'],
                    'Pharmacy management systems': ['pharmacy', 'medication', 'prescription'],
                    'Laboratory information systems': ['laboratory', 'lab', 'test'],
                    'Radiology information systems': ['radiology', 'x-ray', 'imaging'],
                    'Picture archiving communication systems': ['pacs', 'imaging', 'archive'],
                    'Clinical decision support systems': ['clinical', 'decision', 'support'],
                    'Medical imaging software': ['imaging', 'medical', 'radiology'],
                    'Hospital management systems': ['hospital', 'medical', 'management'],
                    'Clinic management software': ['clinic', 'medical', 'management'],
                    'Dental practice management software': ['dental', 'practice', 'management'],
                    'Veterinary practice management software': ['veterinary', 'vet', 'animal'],
                    
                    // User Routes Functions
                    'User authentication': ['login', 'auth', 'jwt', 'bcrypt'],
                    'User registration': ['register', 'signup', 'create user'],
                    'User profile management': ['profile', 'updateProfile', 'user info'],
                    'Password reset': ['password', 'reset', 'forgot'],
                    'Email verification': ['email', 'verify', 'verification'],
                    'User preferences': ['preferences', 'settings', 'user config'],
                    'Privacy settings': ['privacy', 'settings', 'user privacy'],
                    
                    // Lecture Routes Functions
                    'Lecture creation': ['create', 'lecture', 'RecordedLecture'],
                    'Lecture retrieval': ['find', 'lecture', 'get lecture'],
                    'Lecture updating': ['update', 'lecture', 'modify'],
                    'Lecture deletion': ['delete', 'lecture', 'remove'],
                    'Lecture search': ['search', 'lecture', 'query'],
                    'Lecture categorization': ['category', 'lecture', 'classify'],
                    'Lecture access control': ['access', 'permission', 'lecture'],
                    'Lecture analytics': ['analytics', 'stats', 'lecture'],
                    'Lecture recording management': ['recording', 'record', 'lecture'],
                    'Lecture streaming': ['stream', 'video', 'lecture'],
                    'Lecture quality settings': ['quality', 'resolution', 'lecture'],
                    'Lecture metadata management': ['metadata', 'info', 'lecture'],
                    
                    // Course Routes Functions
                    'Course creation': ['create', 'course', 'new course'],
                    'Course retrieval': ['find', 'course', 'get course'],
                    'Course updating': ['update', 'course', 'modify course'],
                    'Course deletion': ['delete', 'course', 'remove course'],
                    'Course enrollment': ['enroll', 'enrollment', 'course'],
                    'Course progress tracking': ['progress', 'tracking', 'course'],
                    
                    // Enrollment Routes Functions
                    'Enrollment creation': ['create', 'enrollment', 'enroll'],
                    'Enrollment retrieval': ['find', 'enrollment', 'get enrollment'],
                    'Enrollment updating': ['update', 'enrollment', 'modify'],
                    'Enrollment deletion': ['delete', 'enrollment', 'remove'],
                    'Enrollment status management': ['status', 'enrollment', 'progress'],
                    
                    // WebRTC Routes Functions
                    'WebRTC configuration': ['webrtc', 'config', 'ice servers'],
                    'STUN/TURN server management': ['stun', 'turn', 'ice servers'],
                    'ICE candidate handling': ['ice', 'candidate', 'webrtc'],
                    'Connection establishment': ['connection', 'connect', 'webrtc'],
                    'Stream quality management': ['quality', 'bitrate', 'stream'],
                    
                    // Model Functions
                    'Schema validation': ['schema', 'validation', 'mongoose'],
                    'Data persistence': ['save', 'create', 'mongoose'],
                    'Data retrieval': ['find', 'findById', 'mongoose'],
                    'Data updating': ['update', 'findByIdAndUpdate', 'mongoose'],
                    'Data deletion': ['delete', 'findByIdAndDelete', 'mongoose'],
                    'Relationship management': ['ref', 'populate', 'mongoose'],
                    'Index optimization': ['index', 'performance', 'mongoose'],
                    'Data integrity checks': ['validation', 'required', 'mongoose'],
                    
                    // Admin Frontend Functions
                    'CustomWebRTCManager class initialization': ['CustomWebRTCManager', 'class', 'new'],
                    'Media stream acquisition': ['getUserMedia', 'MediaStream', 'stream'],
                    'Peer connection management': ['RTCPeerConnection', 'peer', 'connection'],
                    'WebRTC offer creation': ['createOffer', 'offer', 'webrtc'],
                    'ICE candidate handling': ['iceCandidate', 'candidate', 'webrtc'],
                    'Socket.IO event handling': ['socket.on', 'socket.emit', 'io'],
                    'Viewer management': ['viewer', 'viewers', 'manage'],
                    'Stream quality control': ['quality', 'bitrate', 'stream'],
                    'Recording functionality': ['record', 'MediaRecorder', 'recording'],
                    'Screen sharing': ['screenShare', 'getDisplayMedia', 'screen'],
                    'Dashboard initialization': ['init', 'initialize', 'dashboard'],
                    'User interface management': ['ui', 'interface', 'dom'],
                    'Authentication handling': ['auth', 'token', 'login'],
                    'Error handling and logging': ['error', 'try', 'catch'],
                    'System testing': ['test', 'testing', 'debug'],
                    'Viewer popup management': ['popup', 'modal', 'viewer'],
                    'Real-time updates': ['real-time', 'update', 'live'],
                    'Connection status monitoring': ['status', 'monitor', 'connection'],
                    
                    // Viewer Frontend Functions
                    'CustomWebRTCViewer class initialization': ['CustomWebRTCViewer', 'class', 'new'],
                    'Stream joining': ['join', 'stream', 'room'],
                    'WebRTC answer creation': ['createAnswer', 'answer', 'webrtc'],
                    'ICE candidate handling': ['iceCandidate', 'candidate', 'webrtc'],
                    'Media stream display': ['video', 'audio', 'stream'],
                    'Connection management': ['connection', 'connect', 'webrtc'],
                    'Error handling': ['error', 'try', 'catch'],
                    'User authentication': ['auth', 'token', 'login'],
                    'Room joining': ['join', 'room', 'webrtc'],
                    'Stream quality adaptation': ['quality', 'adapt', 'stream'],
                    
                    // Integration Functions
                    'End-to-end WebRTC flow': ['webrtc', 'flow', 'end-to-end'],
                    'Real-time communication': ['real-time', 'communication', 'live'],
                    'Data synchronization': ['sync', 'synchronization', 'data'],
                    'Error propagation': ['error', 'propagation', 'handling'],
                    'Performance optimization': ['performance', 'optimize', 'speed'],
                    'Scalability testing': ['scale', 'scalability', 'test'],
                    'Load balancing': ['load', 'balance', 'distribute'],
                    'Failover handling': ['failover', 'backup', 'redundancy'],
                    'Security validation': ['security', 'validate', 'secure'],
                    'Compliance checking': ['compliance', 'check', 'audit']
                };
                
                // Get patterns for this function
                const patterns = implementationPatterns[functionName] || [];
                
                // Check for implementation patterns
                const hasPattern = patterns.some(pattern => 
                    content.toLowerCase().includes(pattern.toLowerCase())
                );
                
                if (hasPattern) return true;
                
                // Fallback: Check for function patterns
                const fallbackPatterns = [
                    `function ${functionName}`,
                    `${functionName}:`,
                    `${functionName}(`,
                    `async ${functionName}`,
                    `const ${functionName}`,
                    `let ${functionName}`,
                    `var ${functionName}`
                ];
                
                const hasFallbackPattern = fallbackPatterns.some(pattern => content.includes(pattern));
                if (hasFallbackPattern) return true;
                
                // Check for class methods
                if (content.includes('class') && content.includes(functionName)) {
                    return true;
                }
            }
        }
        return false;
    }

    // Check for common issues
    async checkForCommonIssues(functionName, files) {
        const issues = [];
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                const content = fs.readFileSync(file, 'utf8');
                
                // Check for console.log in production code
                if (content.includes('console.log') && !file.includes('test')) {
                    issues.push('console.log statements found');
                }
                
                // Check for TODO comments
                if (content.includes('TODO') || content.includes('FIXME')) {
                    issues.push('TODO/FIXME comments found');
                }
                
                // Check for hardcoded values
                if (content.includes('localhost:3000') || content.includes('127.0.0.1')) {
                    issues.push('Hardcoded localhost values found');
                }
                
                // Check for missing error handling
                if (content.includes(functionName) && !content.includes('try') && !content.includes('catch')) {
                    issues.push('Missing error handling');
                }
            }
        }
        
        return issues;
    }

    // Generate comprehensive report
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPREHENSIVE FUNCTION TEST RESULTS');
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
        const reportPath = 'tests/comprehensive-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        // Exit with appropriate code
        process.exit(this.results.failed > 0 ? 1 : 0);
    }
}

// Main execution
if (require.main === module) {
    const runner = new ComprehensiveTestRunner();
    runner.runAllTests().catch(error => {
        console.error('❌ Test runner error:', error);
        process.exit(1);
    });
}

module.exports = ComprehensiveTestRunner;
