# 🔐 UNA Institute Admin Panel

## 📋 Overview
The admin panel provides comprehensive management capabilities for the UNA Institute website, including user management, course administration, content editing, and live streaming control.

## 🚀 Quick Start

### 1. Create Admin Account
```bash
# Navigate to backend directory
cd backend

# Create your first admin user
node scripts/createAdmin.js <username> <password>

# Example:
node scripts/createAdmin.js admin MySecurePassword123
```

### 2. Access Admin Panel
- **Login URL**: `/admin/login.html`
- **Dashboard URL**: `/admin/dashboard.html`
- **Default Port**: 3000 (http://localhost:3000/admin/login.html)

## 🛠️ Features

### User Management
- ✅ Create, edit, and delete users
- ✅ Assign courses to users
- ✅ Manage user certificates
- ✅ Export user data to Excel

### Course Management
- ✅ Create and edit courses
- ✅ Set course duration and descriptions
- ✅ Manage course enrollments

### Content Management
- ✅ Edit website pages (English/Arabic)
- ✅ HTML content editor with preview
- ✅ Real-time content updates

### Live Streaming
- ✅ Start/stop live streams
- ✅ Screen sharing capabilities
- ✅ Viewer management
- ✅ Recording functionality

### Statistics & Analytics
- ✅ User count and growth
- ✅ Course enrollment statistics
- ✅ Form submission tracking
- ✅ Certificate issuance data

## 🔧 Technical Details

### File Structure
```
frontend/admin/
├── login.html          # Admin login page
├── dashboard.html      # Main admin interface
├── css/admin.css      # Admin panel styling
└── js/
    ├── login.js       # Login functionality
    ├── dashboard.js   # Main dashboard logic
    └── stream.js      # Live streaming controls
```

### Backend Routes
- **POST** `/api/admin/login` - Admin authentication
- **GET** `/api/admin/users` - Fetch all users
- **POST** `/api/admin/users` - Create new user
- **PUT** `/api/admin/users/:id/info` - Update user information
- **GET** `/api/admin/courses` - Fetch all courses
- **POST** `/api/admin/courses` - Create new course
- **PUT** `/api/admin/courses/:id` - Update course
- **GET** `/api/admin/stats` - Dashboard statistics
- **GET** `/api/admin/health` - Admin panel health check

### Security Features
- ✅ JWT-based authentication
- ✅ Admin token verification middleware
- ✅ Password hashing with bcrypt
- ✅ CORS protection
- ✅ Rate limiting

## 🚨 Troubleshooting

### Common Issues

#### 1. Cannot Access Admin Panel
- Ensure MongoDB is running
- Check if admin user exists
- Verify JWT_SECRET in .env file

#### 2. File Operations Fail
- Check file permissions
- Verify directory structure
- Ensure proper file paths

#### 3. Live Streaming Issues
- Check Socket.IO connection
- Verify media device permissions
- Ensure proper network configuration

### Health Check
```bash
# Check admin panel status
curl -H "Authorization: Bearer <your-admin-token>" \
     http://localhost:3000/api/admin/health
```

## 📱 Mobile Responsiveness
The admin panel is fully responsive and works on:
- ✅ Desktop computers
- ✅ Tablets
- ✅ Mobile phones

## 🔒 Security Best Practices
1. **Use strong passwords** (minimum 8 characters)
2. **Delete createAdmin.js** after first use
3. **Regular token rotation**
4. **Monitor access logs**
5. **Keep dependencies updated**

## 📞 Support
For technical support or questions about the admin panel:
- Check the server logs for error messages
- Verify all environment variables are set
- Ensure MongoDB connection is stable

## 🔄 Updates
The admin panel automatically updates when:
- New users register
- Courses are modified
- Content is edited
- Live streams are started/stopped

---

**⚠️ Important**: Always keep your admin credentials secure and never share them publicly!
