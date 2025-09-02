@echo off
title UNA Institute - Network Server Startup
color 0A

echo.
echo ========================================
echo    UNA Institute Network Server
echo ========================================
echo.

echo 🌐 Starting server with network sharing enabled...
echo.

echo 📍 Your Network Information:
echo    IP Address: 192.168.187.16
echo    Port: 3000
echo    Network Access: http://192.168.187.16:3000
echo.

echo 📱 Other devices can access your website using:
echo    http://192.168.187.16:3000
echo.

echo 🔧 Starting server...
echo.

cd /d "%~dp0backend"
npm start

echo.
echo ❌ Server stopped. Press any key to exit...
pause >nul
