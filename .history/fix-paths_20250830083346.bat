@echo off
echo Fixing HTML file paths for network sharing...

REM Fix remaining HTML files
powershell -Command "(Get-Content 'frontend\en\profile.html') -replace 'href=\"\.\./css/', 'href=\"/css/' -replace 'src=\"\.\./js/', 'src=\"/js/' | Set-Content 'frontend\en\profile.html'"
powershell -Command "(Get-Content 'frontend\en\recorded-lectures.html') -replace 'href=\"\.\./css/', 'href=\"/css/' -replace 'src=\"\.\./js/', 'src=\"/js/' | Set-Content 'frontend\en\recorded-lectures.html'"
powershell -Command "(Get-Content 'frontend\en\enroll.html') -replace 'href=\"\.\./css/', 'href=\"/css/' -replace 'src=\"\.\./js/', 'src=\"/js/' | Set-Content 'frontend\en\enroll.html'"
powershell -Command "(Get-Content 'frontend\en\news.html') -replace 'href=\"\.\./css/', 'href=\"/css/' -replace 'src=\"\.\./js/', 'src=\"/js/' | Set-Content 'frontend\en\news.html'"

REM Fix Arabic files
powershell -Command "(Get-Content 'frontend\ar\about.html') -replace 'href=\"\.\./css/', 'href=\"/css/' -replace 'src=\"\.\./js/', 'src=\"/js/' | Set-Content 'frontend\ar\about.html'"
powershell -Command "(Get-Content 'frontend\ar\contact.html') -replace 'href=\"\.\./css/', 'href=\"/css/' -replace 'src=\"\.\./js/', 'src=\"/js/' | Set-Content 'frontend\ar\contact.html'"
powershell -Command "(Get-Content 'frontend\ar\login.html') -replace 'href=\"\.\./css/', 'href=\"/css/' -replace 'src=\"\.\./js/', 'src=\"/js/' | Set-Content 'frontend\ar\login.html'"
powershell -Command "(Get-Content 'frontend\ar\register.html') -replace 'href=\"\.\./css/', 'href=\"/css/' -replace 'src=\"\.\./js/', 'src=\"/js/' | Set-Content 'frontend\ar\register.html'"
powershell -Command "(Get-Content 'frontend\ar\courses.html') -replace 'href=\"\.\./css/', 'href=\"/css/' -replace 'src=\"\.\./js/', 'src=\"/js/' | Set-Content 'frontend\ar\courses.html'"
powershell -Command "(Get-Content 'frontend\ar\profile.html') -replace 'href=\"\.\./css/', 'href=\"/css/' -replace 'src=\"\.\./js/', 'src=\"/js/' | Set-Content 'frontend\ar\profile.html'"
powershell -Command "(Get-Content 'frontend\ar\recorded-lectures.html') -replace 'href=\"\.\./css/', 'href=\"/css/' -replace 'src=\"\.\./js/', 'src=\"/js/' | Set-Content 'frontend\ar\recorded-lectures.html'"

echo Path fixing completed!
echo Your website should now work properly when accessed via IP address.
pause
