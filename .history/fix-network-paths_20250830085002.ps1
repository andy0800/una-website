# Fix Network Paths for UNA Institute Website
# This script converts relative paths to absolute paths for network sharing compatibility

Write-Host "🔧 Fixing HTML file paths for network sharing..." -ForegroundColor Green

# Function to fix paths in a file
function Fix-FilePaths {
    param(
        [string]$FilePath
    )
    
    try {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $originalContent = $content
        
        # Fix CSS paths
        $content = $content -replace 'href="\.\./css/', 'href="/css/'
        $content = $content -replace 'href="css/', 'href="/css/'
        
        # Fix JavaScript paths
        $content = $content -replace 'src="\.\./js/', 'src="/js/'
        $content = $content -replace 'src="js/', 'src="/js/'
        
        # Fix image paths
        $content = $content -replace 'src="\.\./images/', 'src="/images/'
        $content = $content -replace 'src="images/', 'src="/images/'
        
        # Fix admin-specific paths
        $content = $content -replace 'href="css/admin.css"', 'href="/admin/css/admin.css"'
        $content = $content -replace 'src="js/login.js"', 'src="/admin/js/login.js"'
        $content = $content -replace 'src="js/dashboard.js"', 'src="/admin/js/dashboard.js"'
        
        # Only write if content changed
        if ($content -ne $originalContent) {
            Set-Content $FilePath $content -Encoding UTF8
            Write-Host "✅ Fixed: $FilePath" -ForegroundColor Green
            return $true
        } else {
            Write-Host "ℹ️  No changes needed: $FilePath" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "❌ Error processing $FilePath : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Get all HTML files
$htmlFiles = Get-ChildItem -Path "frontend" -Recurse -Filter "*.html" | Where-Object { $_.FullName -notlike "*\.history*" }

Write-Host "📁 Found $($htmlFiles.Count) HTML files to process" -ForegroundColor Cyan

$fixedCount = 0
$totalCount = $htmlFiles.Count

foreach ($file in $htmlFiles) {
    Write-Host "🔧 Processing: $($file.Name)" -ForegroundColor Blue
    
    if (Fix-FilePaths $file.FullName) {
        $fixedCount++
    }
}

Write-Host "`n🎉 Path fixing completed!" -ForegroundColor Green
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Total files processed: $totalCount" -ForegroundColor White
Write-Host "   Files modified: $fixedCount" -ForegroundColor Green
Write-Host "   Files unchanged: $($totalCount - $fixedCount)" -ForegroundColor Yellow

Write-Host "`n🌐 Your website should now work properly when accessed via IP address from other devices!" -ForegroundColor Green
Write-Host "📱 Test by accessing: http://192.168.187.16:3000 from another device" -ForegroundColor Cyan
