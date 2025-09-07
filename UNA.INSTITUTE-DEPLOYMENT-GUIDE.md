# UNA Institute - Custom Domain Deployment Guide

## 🌐 Domain Configuration: una.institute

This guide will help you configure both frontend and backend to serve the UNA Institute website at `una.institute`.

## 📋 Prerequisites

1. **Domain Ownership**: You must own the `una.institute` domain
2. **DNS Access**: Access to your domain's DNS settings
3. **Netlify Account**: For frontend hosting
4. **Render Account**: For backend hosting (or your preferred backend hosting)

## 🔧 Configuration Changes Made

### ✅ Frontend Configuration (Netlify)
- **Updated `frontend/js/config.js`**: All API endpoints now point to `https://api.una.institute`
- **Created `frontend/netlify.toml`**: Complete Netlify configuration with security headers
- **Updated `frontend/_redirects`**: Custom domain redirects and HTTPS enforcement

### ✅ Backend Configuration (Render)
- **Updated `backend/server.js`**: CORS settings include `una.institute` domains
- **Created `backend/env.una.institute.example`**: Production environment template
- **Socket.IO CORS**: Updated to include new domain

## 🚀 Deployment Steps

### Step 1: DNS Configuration

Configure your DNS records for `una.institute`:

```
# A Records (if using A records)
@                    A      [Netlify IP]
www                  A      [Netlify IP]

# CNAME Records (recommended)
@                    CNAME  [your-netlify-site].netlify.app
www                  CNAME  [your-netlify-site].netlify.app

# API Subdomain
api                  CNAME  [your-render-app].onrender.com
```

### Step 2: Netlify Configuration

1. **Connect Domain**:
   - Go to Netlify Dashboard → Site Settings → Domain Management
   - Add custom domain: `una.institute`
   - Add www subdomain: `www.una.institute`

2. **SSL Certificate**:
   - Netlify will automatically provision SSL certificates
   - Enable "Force HTTPS" in Site Settings

3. **Deploy**:
   - Connect your GitHub repository
   - Set build command: `echo 'Static site - no build required'`
   - Set publish directory: `frontend`

### Step 3: Backend Configuration (Render)

1. **Environment Variables**:
   ```bash
   NODE_ENV=production
   ALLOWED_ORIGINS=https://una.institute,https://www.una.institute,https://api.una.institute
   JWT_SECRET=your-secure-jwt-secret
   MONGO_URI=your-mongodb-connection-string
   ```

2. **Custom Domain**:
   - In Render Dashboard, go to your service settings
   - Add custom domain: `api.una.institute`
   - Configure SSL certificate

### Step 4: Database Configuration

1. **MongoDB Atlas**:
   - Add `api.una.institute` to IP whitelist
   - Update connection string in environment variables

## 🔒 Security Configuration

### Frontend Security Headers
The `netlify.toml` includes comprehensive security headers:
- Content Security Policy (CSP)
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

### Backend CORS
- Configured for `una.institute` and `www.una.institute`
- Includes API subdomain support
- Credentials enabled for authentication

## 🧪 Testing Checklist

### Frontend Testing
- [ ] `https://una.institute` loads correctly
- [ ] `https://www.una.institute` redirects to `https://una.institute`
- [ ] Arabic pages load: `https://una.institute/ar/`
- [ ] English pages load: `https://una.institute/en/`
- [ ] Admin pages load: `https://una.institute/admin/`
- [ ] Mobile navigation works
- [ ] All forms submit correctly

### Backend Testing
- [ ] API endpoints respond: `https://api.una.institute/api/`
- [ ] CORS headers present
- [ ] Authentication works
- [ ] File uploads work
- [ ] Database connections stable

### Integration Testing
- [ ] Frontend can communicate with backend
- [ ] User registration/login works
- [ ] Admin dashboard accessible
- [ ] Video streaming works
- [ ] Mobile responsiveness maintained

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Check `ALLOWED_ORIGINS` environment variable
   - Verify domain spelling in backend configuration

2. **SSL Certificate Issues**:
   - Wait 24-48 hours for DNS propagation
   - Check DNS records are correct
   - Verify domain ownership

3. **API Connection Issues**:
   - Check `api.una.institute` DNS resolution
   - Verify backend is running
   - Check environment variables

4. **Mobile Navigation Issues**:
   - Clear browser cache
   - Check console for JavaScript errors
   - Verify all files are deployed

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify DNS propagation: `nslookup una.institute`
3. Test API connectivity: `curl https://api.una.institute/api/`
4. Check Netlify and Render logs

## 🎯 Expected Results

After successful deployment:
- ✅ Website accessible at `https://una.institute`
- ✅ API accessible at `https://api.una.institute`
- ✅ SSL certificates active
- ✅ Mobile navigation working
- ✅ All features functional
- ✅ Professional domain branding

---

**Note**: DNS propagation can take up to 48 hours. Be patient and test from different locations.
