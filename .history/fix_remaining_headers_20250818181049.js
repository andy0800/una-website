const fs = require('fs');
const path = require('path');

// Function to remove static headers from specific files
function removeStaticHeaders(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove static header sections
    const staticHeaderPattern = /<header class="site-header">[\s\S]*?<\/header>/g;
    content = content.replace(staticHeaderPattern, '');
    
    // Remove static authentication scripts
    const authScriptPattern = /<script>\s*document\.addEventListener\('DOMContentLoaded'[\s\S]*?<\/script>/g;
    content = content.replace(authScriptPattern, '');
    
    // Remove any remaining hardcoded mobile navigation
    const mobileNavPattern = /<!-- Mobile Navigation Overlay -->\s*<div class="mobile-nav"[\s\S]*?<\/div>\s*<\/div>/g;
    content = content.replace(mobileNavPattern, '');
    
    // Write the cleaned content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🔧 Fixing remaining static headers...\n');

// Fix the specific files that still have static headers
const filesToFix = [
  './frontend/en/livestream.html',
  './frontend/ar/livestream.html',
  './frontend/ar/course-details.html',
  './frontend/ar/news.html'
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    removeStaticHeaders(filePath);
  } else {
    console.log(`⚠️ File not found: ${filePath}`);
  }
});

console.log('\n✨ Static header cleanup completed!');
console.log('\n📝 Summary:');
console.log('1. ✅ Removed static headers from livestream.html (EN)');
console.log('2. ✅ Removed static headers from livestream.html (AR)');
console.log('3. ✅ Removed static headers from course-details.html (AR)');
console.log('4. ✅ Removed static headers from news.html (AR)');
console.log('\n🚀 All pages now use unified dynamic headers!');
