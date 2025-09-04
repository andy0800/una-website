# 🚀 UNA Institute - Local Development Setup

This guide explains how to run the UNA Institute website locally for development and testing.

## 📋 Prerequisites

- Node.js (version 16 or higher)
- MongoDB (running locally or MongoDB Atlas)
- Git

## 🏃‍♂️ Quick Start

### Option 1: Run Both Frontend and Backend Together
```bash
# This runs both frontend (port 3000) and backend (port 4000) in one process
npm run local
```

### Option 2: Run Frontend and Backend Separately

**Terminal 1 - Backend API (Port 4000):**
```bash
npm run backend
```

**Terminal 2 - Frontend (Port 3000):**
```bash
npm run frontend
```

## 🌐 Access Points

- **Frontend Website**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health
- **Frontend Health Check**: http://localhost:3000/health

## 🔧 Configuration

### Environment Variables
The local development setup automatically sets:
- `NODE_ENV=development`
- `PORT=4000` (for backend)
- `SERVE_FRONTEND=true` (for combined mode)

### API Endpoints
- **Users**: http://localhost:4000/api/users
- **Admin**: http://localhost:4000/api/admin
- **Courses**: http://localhost:4000/api/courses
- **Lectures**: http://localhost:4000/api/lectures
- **Enrollments**: http://localhost:4000/api/enrollments

## 🧪 Testing

### Test Registration
```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "1234567890",
    "password": "password123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1234567890",
    "password": "password123"
  }'
```

## 🐛 Debugging

### Backend Logs
The backend provides detailed logging for:
- Request/response details
- Database operations
- Authentication attempts
- Error handling

### Frontend Console
Open browser developer tools to see:
- API calls and responses
- CORS issues
- JavaScript errors

## 📁 Project Structure

```
├── backend/           # Backend API server
│   ├── server.js     # Main server file
│   ├── routes/       # API routes
│   ├── models/       # Database models
│   └── middleware/   # Custom middleware
├── frontend/         # Frontend static files
│   ├── ar/          # Arabic pages
│   ├── en/          # English pages
│   ├── admin/       # Admin pages
│   └── js/          # JavaScript files
├── start-local.js   # Combined server script
├── start-frontend.js # Frontend-only server script
└── package.json     # Dependencies and scripts
```

## 🔄 Development Workflow

1. **Start the servers** using one of the methods above
2. **Make changes** to frontend or backend code
3. **Test locally** at http://localhost:3000
4. **Debug issues** using browser console and server logs
5. **Deploy to production** when ready

## 🚨 Troubleshooting

### Port Already in Use
If you get "port already in use" errors:
```bash
# Kill processes on ports 3000 and 4000
npx kill-port 3000 4000
```

### MongoDB Connection Issues
Make sure MongoDB is running:
```bash
# Start MongoDB (if installed locally)
mongod
```

### CORS Issues
The local setup includes CORS configuration for both ports. If you still see CORS errors, check the browser console for specific details.

## 📞 Support

For issues or questions about local development setup, check the server logs and browser console for detailed error messages.
