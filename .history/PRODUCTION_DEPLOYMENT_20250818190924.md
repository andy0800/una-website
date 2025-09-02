# 🚀 **UNA Institute Website - Production Deployment Guide**

## 📋 **Pre-Deployment Checklist**

### **1. Environment Configuration**
- [ ] Copy `env.example` to `.env` in backend directory
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URI
- [ ] Set strong JWT secret
- [ ] Update CORS origins for production domain
- [ ] Set production rate limits

### **2. Security Verification**
- [ ] JWT secret is strong and unique
- [ ] MongoDB connection is secure
- [ ] CORS is configured for production domain
- [ ] Rate limiting is appropriate for production
- [ ] Security headers are enabled

### **3. Database Setup**
- [ ] MongoDB is running and accessible
- [ ] Database indexes are created
- [ ] Initial admin user is created
- [ ] Sample courses are loaded (if needed)

## 🔧 **Production Environment Variables**

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# MongoDB Configuration (Production)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/una_institute

# JWT Configuration
JWT_SECRET=your-super-strong-production-jwt-secret-key-here
JWT_EXPIRE=24h

# CORS Configuration (Production)
CORS_ORIGIN=https://yourdomain.com

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500

# Production Configuration
DEBUG=false
LOG_LEVEL=warn
```

## 🚀 **Deployment Steps**

### **Step 1: Prepare Production Environment**
```bash
# Install dependencies
npm run install:all

# Build the application
npm run build

# Set production environment
export NODE_ENV=production
```

### **Step 2: Start Production Server**
```bash
# Start production server
npm run start:prod

# Or use PM2 for process management
pm2 start backend/server.js --name "una-institute"
pm2 save
pm2 startup
```

### **Step 3: Verify Deployment**
```bash
# Check health endpoint
curl http://yourdomain.com/health

# Check server status
pm2 status
pm2 logs una-institute
```

## 📊 **Production Monitoring**

### **Health Checks**
- **Endpoint**: `/health`
- **Expected Response**: `{"status":"OK","timestamp":"...","uptime":...}`

### **Log Monitoring**
- **Development**: Full error details with stack traces
- **Production**: Clean, structured error logs without sensitive data

### **Performance Metrics**
- **Rate Limiting**: 500 requests per 15 minutes
- **File Upload**: 500MB maximum
- **Response Time**: Monitor via health endpoint

## 🔒 **Security Features**

### **Security Headers**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy`: Strict CSP without unsafe-inline

### **Authentication**
- JWT-based authentication
- Token expiration: 24 hours
- Secure token verification

### **Rate Limiting**
- **Auth Endpoints**: 5 attempts per 15 minutes
- **API Endpoints**: 500 requests per 15 minutes
- **File Uploads**: 10 uploads per 15 minutes

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. MongoDB Connection Failed**
```bash
# Check MongoDB status
systemctl status mongod

# Verify connection string
echo $MONGO_URI

# Test connection
mongo $MONGO_URI --eval "db.runCommand('ping')"
```

#### **2. JWT Authentication Failed**
```bash
# Check JWT secret
echo $JWT_SECRET

# Verify token format
jwt decode <token>
```

#### **3. CORS Issues**
```bash
# Check CORS configuration
grep -r "CORS" backend/middleware/

# Verify allowed origins
curl -H "Origin: https://yourdomain.com" -v http://localhost:3000/api/health
```

### **Log Analysis**
```bash
# View production logs
pm2 logs una-institute --lines 100

# Filter error logs
pm2 logs una-institute | grep "ERROR"

# Monitor real-time
pm2 logs una-institute --follow
```

## 📈 **Performance Optimization**

### **Database Optimization**
- Ensure MongoDB indexes are created
- Monitor query performance
- Use connection pooling

### **File Upload Optimization**
- Implement file compression
- Add CDN for static assets
- Optimize image formats

### **Caching Strategy**
- Implement Redis for session storage
- Add response caching for static content
- Use browser caching headers

## 🔄 **Maintenance & Updates**

### **Regular Maintenance**
- **Daily**: Check health endpoint
- **Weekly**: Review error logs
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

### **Update Process**
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm run install:all

# Restart server
pm2 restart una-institute

# Verify deployment
curl http://yourdomain.com/health
```

## 📞 **Support & Contact**

For production issues:
- **Emergency**: Check logs and health endpoint
- **Technical**: Review error handling and security
- **Performance**: Monitor rate limiting and database

---

**Last Updated**: August 18, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
