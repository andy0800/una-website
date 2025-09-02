# 🌐 Network Sharing Setup - UNA Institute Website

## 📍 Your Network Configuration

- **Your IP Address:** `192.168.187.16`
- **Port:** `3000`
- **Network Access URL:** `http://192.168.187.16:3000`

## 🚀 Quick Start

### Method 1: Use the Startup Scripts

1. **Double-click** `start-network-server.bat` (Windows)
2. **Or run** `start-network-server.ps1` (PowerShell)
3. **Server will start** with network sharing enabled

### Method 2: Manual Start

```bash
# Navigate to backend directory
cd backend

# Start the server
npm start
```

## 📱 Access from Other Devices

### Prerequisites
- ✅ All devices must be on the **same WiFi network**
- ✅ Your server must be running
- ✅ Windows Firewall must allow port 3000

### Access URLs

| Device Type | Access URL |
|-------------|------------|
| **Your Computer** | `http://localhost:3000` |
| **Other Devices** | `http://192.168.187.16:3000` |

### Step-by-Step Access

1. **On the other device:**
   - Connect to the same WiFi network
   - Open any web browser
   - Enter: `http://192.168.187.16:3000`
   - Press Enter

2. **You should see:**
   - Your UNA Institute website
   - All functionality working
   - Responsive design on mobile devices

## 🔧 Troubleshooting

### Can't Access from Other Devices?

1. **Check Network Connection:**
   ```cmd
   ipconfig
   ```
   Verify your IP is still `192.168.187.16`

2. **Check Server Status:**
   - Ensure server is running
   - Check console for errors
   - Verify port 3000 is not blocked

3. **Windows Firewall:**
   - Allow Node.js through firewall
   - Or temporarily disable firewall for testing

4. **Test Local Access:**
   - Try `http://localhost:3000` on your computer
   - If this works, the issue is network-related

### Connection Refused?

1. **Check Server Configuration:**
   - Server must listen on `0.0.0.0:3000`
   - Not just `localhost:3000`

2. **Check Port Availability:**
   ```cmd
   netstat -an | findstr :3000
   ```

3. **Restart Server:**
   - Stop server (Ctrl+C)
   - Start again with `npm start`

## 📊 Network Status Page

Visit `http://192.168.187.16:3000/network-access.html` for:
- Real-time network status
- Access instructions
- Troubleshooting guide
- Device compatibility info

## 🌍 Supported Devices

- ✅ **Smartphones** (iOS & Android)
- ✅ **Tablets** (iPad, Android)
- ✅ **Laptops** (Windows, Mac, Linux)
- ✅ **Desktop PCs** (Windows, Mac, Linux)

## 🔒 Security Notes

- **Local Network Only:** This setup is for local network access only
- **Not Internet Accessible:** Your website won't be accessible from the internet
- **Development Use:** This is intended for development and testing
- **Production:** Use proper hosting services for production deployment

## 📝 Configuration Files

- **Server Config:** `backend/server.js`
- **CORS Settings:** `backend/middleware/security.js`
- **Network Config:** `backend/config/network.js`

## 🆘 Need Help?

1. **Check the console** for error messages
2. **Verify network settings** with `ipconfig`
3. **Test local access** first
4. **Check Windows Firewall** settings
5. **Restart the server** if needed

## 🎯 Success Indicators

When everything is working correctly, you should see:

```
✅ HTTP server running on port 3000
🌐 Network accessible at: http://192.168.187.16:3000
🏠 Server listening on port 3000
🔗 Local access: http://localhost:3000
🌐 Network access: http://192.168.187.16:3000
📱 Other devices can access: http://192.168.187.16:3000
```

---

**Happy Network Sharing! 🌐📱**

Your UNA Institute website is now accessible from any device on your local network!
