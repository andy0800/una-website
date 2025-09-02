# UNA Institute Network Server Startup Script
# PowerShell version

Write-Host "========================================" -ForegroundColor Green
Write-Host "    UNA Institute Network Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 Starting server with network sharing enabled..." -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 Your Network Information:" -ForegroundColor Yellow
Write-Host "   IP Address: 192.168.187.16" -ForegroundColor White
Write-Host "   Port: 3000" -ForegroundColor White
Write-Host "   Network Access: http://192.168.187.16:3000" -ForegroundColor White
Write-Host ""

Write-Host "📱 Other devices can access your website using:" -ForegroundColor Yellow
Write-Host "   http://192.168.187.16:3000" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔧 Starting server..." -ForegroundColor Green
Write-Host ""

# Change to backend directory
Set-Location ".\backend"

# Start the server
npm start

Write-Host ""
Write-Host "❌ Server stopped. Press any key to exit..." -ForegroundColor Red
Read-Host
