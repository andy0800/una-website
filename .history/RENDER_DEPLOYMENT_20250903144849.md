# 🚀 Render Deployment Guide

## Prerequisites
1. GitHub repository with your code
2. Render account (free tier available)
3. MongoDB Atlas account (for database)

## Deployment Steps

### 1. Environment Variables Setup
In your Render dashboard, add these environment variables:

**Required:**
- `NODE_ENV` = `production`
- `PORT` = `3000`
- `JWT_SECRET` = `7b3bb2580b321e6428615d88dae6973f8a25195ac207732082735cd9416abe35`
- `MONGO_URI` = `mongodb+srv://username:password@cluster.mongodb.net/una_institute`

**Optional (for optimization):**
- `ENABLE_CLUSTERING` = `false`
- `ENABLE_PERFORMANCE_OPTIMIZATION` = `true`
- `LOG_LEVEL` = `info`
- `CORS_ORIGIN` = `*`

### 2. Build Configuration
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Node Version:** 18.x or higher

### 3. Health Check
- **Health Check Path:** `/health`
- The server will respond with status information

### 4. Database Setup
1. Create a MongoDB Atlas cluster
2. Get your connection string
3. Add it as `MONGO_URI` environment variable
4. The server will connect automatically

### 5. Deployment
1. Connect your GitHub repository to Render
2. Select the repository
3. Configure the environment variables
4. Deploy!

## Troubleshooting

### Common Issues:
1. **Server exits with status 1:** Check MongoDB connection string
2. **Performance Optimizer errors:** Server will continue without optimization
3. **Missing environment variables:** Server will use defaults

### Health Check Endpoints:
- `/health` - Basic health status
- `/health/detailed` - Detailed system information
- `/metrics` - Performance metrics

## Production Features
- ✅ Graceful error handling
- ✅ MongoDB connection resilience
- ✅ Performance optimization
- ✅ Health monitoring
- ✅ Security headers
- ✅ CORS configuration
- ✅ Rate limiting

## Support
If deployment fails, check:
1. Environment variables are set correctly
2. MongoDB connection string is valid
3. Node.js version is compatible
4. All dependencies are installed
