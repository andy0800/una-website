const fs = require('fs');
const path = require('path');

// Function to replace header in HTML files
function replaceHeader(filePath, isArabic = false) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Define the header patterns to replace
    const headerPatterns = [
      // English header pattern
      /<!-- Header -->\s*<header class="site-header">[\s\S]*?<\/header>/,
      // Arabic header pattern  
      /<!-- Header -->\s*<header class="site-header">[\s\S]*?<\/header>/,
      // Mobile navigation pattern
      /<!-- Mobile Navigation Overlay -->\s*<div class="mobile-nav"[\s\S]*?<\/div>\s*<\/div>/,
    ];
    
    // Replace all patterns with dynamic header
    let newContent = content;
    headerPatterns.forEach(pattern => {
      newContent = newContent.replace(pattern, '');
    });
    
    // Insert dynamic header after body tag
    const bodyTag = '<body';
    const bodyIndex = newContent.indexOf(bodyTag);
    if (bodyIndex !== -1) {
      const insertIndex = newContent.indexOf('>', bodyIndex) + 1;
      const dynamicHeader = `
  <!-- Dynamic Header -->
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
      
      newContent = newContent.slice(0, insertIndex) + dynamicHeader + newContent.slice(insertIndex);
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
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
      replaceHeader(filePath, isArabic);
    }
  });
}

// Main execution
console.log('🚀 Starting header replacement process...\n');

// Process English files
console.log('📁 Processing English files...');
processDirectory('./frontend/en', false);

// Process Arabic files  
console.log('\n📁 Processing Arabic files...');
processDirectory('./frontend/ar', true);

console.log('\n✨ Header replacement process completed!');
console.log('\n📝 Next steps:');
console.log('1. Test the website to ensure headers load correctly');
console.log('2. Verify that authentication and mobile navigation work');
console.log('3. Check that all navigation links function properly');
