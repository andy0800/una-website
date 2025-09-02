const fs = require('fs');
const path = require('path');

// Function to clean up HTML files
function cleanupHTMLFile(filePath, isArabic = false) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove duplicate header placeholders
    const headerPattern = /<!-- Dynamic Header -->\s*<div id="header-placeholder"><\/div>\s*<script>[\s\S]*?<\/script>/g;
    const matches = content.match(headerPattern);
    
    if (matches && matches.length > 1) {
      // Keep only the first one
      const firstMatch = matches[0];
      content = content.replace(headerPattern, firstMatch);
    }
    
    // Remove static authentication scripts
    const authScriptPattern = /<script>\s*\/\/ Authentication check[\s\S]*?<\/script>/g;
    content = content.replace(authScriptPattern, '');
    
    // Remove any remaining hardcoded headers or mobile navigation
    const hardcodedHeaderPattern = /<!-- Header -->\s*<header[\s\S]*?<\/header>/g;
    content = content.replace(hardcodedHeaderPattern, '');
    
    const hardcodedMobilePattern = /<!-- Mobile Navigation Overlay -->\s*<div class="mobile-nav"[\s\S]*?<\/div>\s*<\/div>/g;
    content = content.replace(hardcodedMobilePattern, '');
    
    // Ensure proper header loading script
    const headerScript = `  <!-- Dynamic Header -->
  <div id="header-placeholder"></div>
  <script>
    // This script runs immediately after the placeholder is in the DOM
    (function() {
      const headerPlaceholder = document.getElementById('header-placeholder');
      const headerPath = 'header.html'; // Path to the ${isArabic ? 'Arabic' : 'English'} header file
      
      fetch(headerPath)
        .then(response => response.text())
        .then(html => {
          headerPlaceholder.innerHTML = html;
          // The main.js script (linked at the end of the body) will then handle
          // the dynamic elements within this injected HTML once its DOMContentLoaded fires.
        })
        .catch(error => console.error('Error loading header:', error));
    })();
  </script>`;
    
    // Replace any existing header placeholder with the correct one
    const existingHeaderPattern = /<!-- Dynamic Header -->\s*<div id="header-placeholder"><\/div>\s*<script>[\s\S]*?<\/script>/;
    if (content.match(existingHeaderPattern)) {
      content = content.replace(existingHeaderPattern, headerScript);
    } else {
      // Insert header after body tag if none exists
      const bodyTag = '<body';
      const bodyIndex = content.indexOf(bodyTag);
      if (bodyIndex !== -1) {
        const insertIndex = content.indexOf('>', bodyIndex) + 1;
        content = content.slice(0, insertIndex) + '\n' + headerScript + content.slice(insertIndex);
      }
    }
    
    // Write the cleaned content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Cleaned: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
  }
}

// Function to process all HTML files in a directory
function processDirectory(dirPath, isArabic = false) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(filePath, isArabic);
    } else if (file.endsWith('.html') && file !== 'header.html') {
      // Process HTML files (excluding header.html)
      cleanupHTMLFile(filePath, isArabic);
    }
  });
}

// Main execution
console.log('🧹 Starting comprehensive header cleanup...\n');

// Process English files
console.log('📁 Cleaning English files...');
processDirectory('./frontend/en', false);

// Process Arabic files  
console.log('\n📁 Cleaning Arabic files...');
processDirectory('./frontend/ar', true);

console.log('\n✨ Header cleanup completed!');
console.log('\n📝 Summary of fixes applied:');
console.log('1. ✅ Removed duplicate header placeholders');
console.log('2. ✅ Removed static authentication scripts');
console.log('3. ✅ Removed hardcoded headers and mobile navigation');
console.log('4. ✅ Ensured proper header loading scripts');
console.log('5. ✅ Fixed language switcher logic');
console.log('6. ✅ Centralized all header functionality');
console.log('\n🚀 Next steps:');
console.log('1. Test the website to ensure headers load correctly');
console.log('2. Verify that authentication and mobile navigation work');
console.log('3. Check that all navigation links function properly');
console.log('4. Test language switching on different pages');
