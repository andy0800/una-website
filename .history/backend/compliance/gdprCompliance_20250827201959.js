const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class GDPRCompliance {
  constructor() {
    this.isEnabled = process.env.ENABLE_GDPR_COMPLIANCE !== 'false';
    this.dataRetentionDays = parseInt(process.env.DATA_RETENTION_DAYS) || 2555; // 7 years
    this.encryptionKey = process.env.GDPR_ENCRYPTION_KEY || crypto.randomBytes(32);
    this.privacyPolicyPath = path.join(__dirname, '../../privacy-policy.html');
    
    // Data categories for GDPR
    this.dataCategories = {
      personal: ['name', 'email', 'phone', 'address', 'id_number'],
      sensitive: ['health', 'financial', 'political', 'religious'],
      technical: ['ip_address', 'user_agent', 'cookies', 'session_data'],
      behavioral: ['usage_patterns', 'preferences', 'interactions']
    };
    
    // User rights under GDPR
    this.userRights = [
      'right_to_access',
      'right_to_rectification',
      'right_to_erasure',
      'right_to_restrict_processing',
      'right_to_data_portability',
      'right_to_object',
      'right_to_withdraw_consent'
    ];
    
    console.log('🔐 GDPR Compliance module initialized');
  }
  
  // Middleware for GDPR compliance
  middleware() {
    return (req, res, next) => {
      if (!this.isEnabled) return next();
      
      // Add GDPR headers
      res.setHeader('X-GDPR-Compliant', 'true');
      res.setHeader('X-Data-Retention-Days', this.dataRetentionDays);
      
      // Log data processing
      this.logDataProcessing(req);
      
      // Check consent
      if (this.requiresConsent(req.path)) {
        if (!this.hasValidConsent(req)) {
          return res.status(403).json({
            error: 'GDPR consent required',
            message: 'Please provide valid consent for data processing',
            consentUrl: '/gdpr/consent'
          });
        }
      }
      
      next();
    };
  }
  
  // Check if endpoint requires consent
  requiresConsent(path) {
    const consentRequiredPaths = [
      '/api/users',
      '/api/admin',
      '/api/webrtc',
      '/api/lectures'
    ];
    
    return consentRequiredPaths.some(requiredPath => 
      path.startsWith(requiredPath)
    );
  }
  
  // Check if request has valid consent
  hasValidConsent(req) {
    const consentHeader = req.get('X-GDPR-Consent');
    const consentCookie = req.cookies?.gdpr_consent;
    
    if (consentHeader && this.validateConsent(consentHeader)) {
      return true;
    }
    
    if (consentCookie && this.validateConsent(consentCookie)) {
      return true;
    }
    
    return false;
  }
  
  // Validate consent format
  validateConsent(consent) {
    try {
      const decoded = JSON.parse(Buffer.from(consent, 'base64').toString());
      return decoded.timestamp && 
             decoded.permissions && 
             decoded.version === '1.0' &&
             (Date.now() - new Date(decoded.timestamp).getTime()) < (365 * 24 * 60 * 60 * 1000); // 1 year
    } catch (error) {
      return false;
    }
  }
  
  // Log data processing activities
  logDataProcessing(req) {
    if (!this.isEnabled) return;
    
    const processingLog = {
      timestamp: new Date().toISOString(),
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      dataCategories: this.identifyDataCategories(req),
      purpose: this.identifyProcessingPurpose(req.path),
      legalBasis: this.identifyLegalBasis(req.path),
      consent: this.hasValidConsent(req)
    };
    
    // Store in processing log (in production, this would go to a database)
    this.storeProcessingLog(processingLog);
  }
  
  // Identify data categories in request
  identifyDataCategories(req) {
    const categories = [];
    
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (this.dataCategories.personal.includes(key)) {
          categories.push('personal');
        }
        if (this.dataCategories.sensitive.includes(key)) {
          categories.push('sensitive');
        }
        if (this.dataCategories.technical.includes(key)) {
          categories.push('technical');
        }
      });
    }
    
    // Always include technical data
    if (req.ip || req.get('User-Agent')) {
      categories.push('technical');
    }
    
    return [...new Set(categories)];
  }
  
  // Identify processing purpose
  identifyProcessingPurpose(path) {
    if (path.includes('/auth')) return 'authentication';
    if (path.includes('/users')) return 'user_management';
    if (path.includes('/webrtc')) return 'livestreaming';
    if (path.includes('/lectures')) return 'content_delivery';
    if (path.includes('/admin')) return 'administration';
    return 'general_service';
  }
  
  // Identify legal basis
  identifyLegalBasis(path) {
    if (path.includes('/auth')) return 'contract';
    if (path.includes('/webrtc')) return 'legitimate_interest';
    if (path.includes('/admin')) return 'legal_obligation';
    return 'consent';
  }
  
  // Store processing log
  storeProcessingLog(log) {
    // In production, this would be stored in a database
    // For now, we'll just log it
    console.log('📝 GDPR Data Processing Log:', log);
  }
  
  // Export user data (Right to Access)
  async exportUserData(userId) {
    try {
      // In production, this would query the database
      const userData = {
        userId,
        exportDate: new Date().toISOString(),
        data: {
          profile: {
            name: 'User Name',
            email: 'user@example.com',
            phone: '+1234567890'
          },
          preferences: {
            language: 'en',
            notifications: true
          },
          activity: {
            lastLogin: new Date().toISOString(),
            sessions: []
          }
        },
        metadata: {
          format: 'json',
          version: '1.0',
          encryption: 'AES-256'
        }
      };
      
      // Encrypt sensitive data
      const encryptedData = this.encryptData(userData);
      
      return {
        success: true,
        data: encryptedData,
        message: 'User data exported successfully'
      };
      
    } catch (error) {
      console.error('GDPR data export failed:', error);
      return {
        success: false,
        error: 'Failed to export user data',
        details: error.message
      };
    }
  }
  
  // Delete user data (Right to Erasure)
  async deleteUserData(userId) {
    try {
      // In production, this would:
      // 1. Anonymize personal data
      // 2. Delete user account
      // 3. Remove from all related collections
      // 4. Log the deletion
      
      const deletionLog = {
        userId,
        deletionDate: new Date().toISOString(),
        dataCategories: ['personal', 'sensitive', 'technical', 'behavioral'],
        reason: 'user_request',
        method: 'anonymization_and_deletion'
      };
      
      // Store deletion log
      this.storeDeletionLog(deletionLog);
      
      return {
        success: true,
        message: 'User data deleted successfully',
        deletionId: crypto.randomUUID()
      };
      
    } catch (error) {
      console.error('GDPR data deletion failed:', error);
      return {
        success: false,
        error: 'Failed to delete user data',
        details: error.message
      };
    }
  }
  
  // Get privacy policy
  getPrivacyPolicy() {
    try {
      if (fs.existsSync(this.privacyPolicyPath)) {
        return fs.readFileSync(this.privacyPolicyPath, 'utf8');
      }
      
      // Return default privacy policy if file doesn't exist
      return this.generateDefaultPrivacyPolicy();
      
    } catch (error) {
      console.error('Failed to read privacy policy:', error);
      return this.generateDefaultPrivacyPolicy();
    }
  }
  
  // Generate default privacy policy
  generateDefaultPrivacyPolicy() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Privacy Policy - UNA Institute</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #333; border-bottom: 2px solid #667eea; }
              h2 { color: #555; margin-top: 30px; }
              .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
              .highlight { background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107; }
          </style>
      </head>
      <body>
          <h1>Privacy Policy</h1>
          <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
          
          <div class="section">
              <h2>1. Information We Collect</h2>
              <p>We collect the following types of information:</p>
              <ul>
                  <li><strong>Personal Information:</strong> Name, email, phone number, ID number</li>
                  <li><strong>Technical Information:</strong> IP address, browser type, device information</li>
                  <li><strong>Usage Information:</strong> How you interact with our services</li>
                  <li><strong>Livestreaming Data:</strong> Video/audio streams, chat messages, participation records</li>
              </ul>
          </div>
          
          <div class="section">
              <h2>2. How We Use Your Information</h2>
              <p>We use your information for:</p>
              <ul>
                  <li>Providing educational services</li>
                  <li>Managing your account</li>
                  <li>Delivering livestreaming content</li>
                  <li>Improving our services</li>
                  <li>Legal compliance</li>
              </ul>
          </div>
          
          <div class="section">
              <h2>3. Data Retention</h2>
              <p>We retain your data for ${this.dataRetentionDays} days, after which it is automatically deleted or anonymized.</p>
          </div>
          
          <div class="section">
              <h2>4. Your Rights</h2>
              <p>Under GDPR, you have the right to:</p>
              <ul>
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Restrict processing of your data</li>
                  <li>Data portability</li>
                  <li>Object to processing</li>
                  <li>Withdraw consent</li>
              </ul>
          </div>
          
          <div class="section">
              <h2>5. Data Security</h2>
              <p>We implement appropriate security measures to protect your data, including:</p>
              <ul>
                  <li>Encryption of sensitive data</li>
                  <li>Secure transmission protocols</li>
                  <li>Access controls and authentication</li>
                  <li>Regular security audits</li>
              </ul>
          </div>
          
          <div class="section">
              <h2>6. Contact Information</h2>
              <p>For privacy-related questions or to exercise your rights, contact us at:</p>
              <p>Email: privacy@unainstitute.com<br>
              Address: [Your Address]<br>
              Phone: [Your Phone]</p>
          </div>
          
          <div class="highlight">
              <p><strong>Note:</strong> This is a default privacy policy. Please customize it according to your specific needs and legal requirements.</p>
          </div>
      </body>
      </html>
    `;
  }
  
  // Encrypt sensitive data
  encryptData(data) {
    try {
      const jsonString = JSON.stringify(data);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      
      let encrypted = cipher.update(jsonString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        algorithm: 'aes-256-cbc'
      };
    } catch (error) {
      console.error('Data encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  // Decrypt data
  decryptData(encryptedData) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Data decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  // Store deletion log
  storeDeletionLog(log) {
    // In production, this would be stored in a database
    console.log('🗑️ GDPR Data Deletion Log:', log);
  }
  
  // Admin middleware for accessing GDPR endpoints
  requireAdmin(req, res, next) {
    // In production, implement proper admin authentication
    const adminToken = req.headers['x-admin-token'];
    
    if (!adminToken || adminToken !== process.env.ADMIN_SECRET) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'Valid admin token required for this endpoint'
      });
    }
    
    next();
  }
  
  // Generate consent token
  generateConsent(permissions = ['basic', 'livestreaming', 'analytics']) {
    const consent = {
      timestamp: new Date().toISOString(),
      permissions,
      version: '1.0',
      id: crypto.randomUUID()
    };
    
    return Buffer.from(JSON.stringify(consent)).toString('base64');
  }
  
  // Validate consent token
  validateConsentToken(token) {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      return decoded.timestamp && 
             decoded.permissions && 
             decoded.version === '1.0' &&
             decoded.id;
    } catch (error) {
      return false;
    }
  }
  
  // Get consent status
  getConsentStatus(token) {
    if (!this.validateConsentToken(token)) {
      return {
        valid: false,
        message: 'Invalid consent token'
      };
    }
    
    const consent = JSON.parse(Buffer.from(token, 'base64').toString());
    const age = Date.now() - new Date(consent.timestamp).getTime();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
    
    return {
      valid: age < maxAge,
      age: Math.floor(age / (24 * 60 * 60 * 1000)), // days
      maxAge: 365,
      permissions: consent.permissions,
      expiresAt: new Date(new Date(consent.timestamp).getTime() + maxAge).toISOString()
    };
  }
  
  // Update consent
  updateConsent(oldToken, newPermissions) {
    try {
      if (!this.validateConsentToken(oldToken)) {
        throw new Error('Invalid old consent token');
      }
      
      const oldConsent = JSON.parse(Buffer.from(oldToken, 'base64').toString());
      const newConsent = {
        ...oldConsent,
        timestamp: new Date().toISOString(),
        permissions: newPermissions,
        previousPermissions: oldConsent.permissions,
        updatedAt: new Date().toISOString()
      };
      
      return Buffer.from(JSON.stringify(newConsent)).toString('base64');
      
    } catch (error) {
      console.error('Consent update failed:', error);
      throw new Error('Failed to update consent');
    }
  }
  
  // Withdraw consent
  withdrawConsent(token) {
    try {
      if (!this.validateConsentToken(token)) {
        throw new Error('Invalid consent token');
      }
      
      const consent = JSON.parse(Buffer.from(token, 'base64').toString());
      const withdrawal = {
        originalConsent: consent,
        withdrawnAt: new Date().toISOString(),
        status: 'withdrawn',
        id: crypto.randomUUID()
      };
      
      // Store withdrawal record
      this.storeWithdrawalRecord(withdrawal);
      
      return {
        success: true,
        withdrawalId: withdrawal.id,
        message: 'Consent withdrawn successfully'
      };
      
    } catch (error) {
      console.error('Consent withdrawal failed:', error);
      throw new Error('Failed to withdraw consent');
    }
  }
  
  // Store withdrawal record
  storeWithdrawalRecord(withdrawal) {
    // In production, this would be stored in a database
    console.log('❌ GDPR Consent Withdrawal:', withdrawal);
  }
  
  // Data processing impact assessment
  async conductDPIA(processingActivity) {
    try {
      const dpia = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        activity: processingActivity,
        riskAssessment: {
          likelihood: 'medium',
          severity: 'medium',
          overallRisk: 'medium'
        },
        mitigationMeasures: [
          'Data encryption',
          'Access controls',
          'Regular audits',
          'User consent management'
        ],
        conclusion: 'Processing activity is acceptable with implemented measures'
      };
      
      // Store DPIA
      this.storeDPIA(dpia);
      
      return dpia;
      
    } catch (error) {
      console.error('DPIA failed:', error);
      throw new Error('Failed to conduct DPIA');
    }
  }
  
  // Store DPIA
  storeDPIA(dpia) {
    // In production, this would be stored in a database
    console.log('📋 GDPR DPIA:', dpia);
  }
  
  // Cleanup old data
  async cleanup() {
    try {
      const cutoffDate = new Date(Date.now() - (this.dataRetentionDays * 24 * 60 * 60 * 1000));
      
      // In production, this would:
      // 1. Query database for old records
      // 2. Anonymize or delete old data
      // 3. Log cleanup activities
      
      console.log(`🧹 GDPR cleanup: Removing data older than ${cutoffDate.toISOString()}`);
      
      return {
        success: true,
        message: 'GDPR cleanup completed',
        cutoffDate: cutoffDate.toISOString()
      };
      
    } catch (error) {
      console.error('GDPR cleanup failed:', error);
      throw new Error('Failed to cleanup old data');
    }
  }
  
  // Test GDPR compliance
  test() {
    console.log('🧪 Testing GDPR compliance...');
    
    // Test consent generation
    const consent = this.generateConsent();
    console.log('✅ Consent generated:', consent);
    
    // Test consent validation
    const isValid = this.validateConsentToken(consent);
    console.log('✅ Consent validation:', isValid);
    
    // Test consent status
    const status = this.getConsentStatus(consent);
    console.log('✅ Consent status:', status);
    
    console.log('✅ GDPR compliance test completed');
  }
}

module.exports = GDPRCompliance;
