// ===== HEADER INITIALIZATION AND AUTHENTICATION HANDLING =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Page loaded, initializing...');
  // Initialize header functionality
  initializeHeader();
  
  // Additional authentication check after a short delay to ensure all elements are loaded
  setTimeout(() => {
    console.log('🔄 Running delayed authentication check...');
    setupAuthentication();
  }, 500);
});

// ===== AUTHENTICATION STATE MONITORING =====
// Check authentication state when window gains focus (user returns to tab)
window.addEventListener('focus', () => {
  console.log('👁️ Window focused, checking authentication state');
  setupAuthentication();
});

// Check authentication state when page becomes visible (user switches back to tab)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('👁️ Page visible, checking authentication state');
    setupAuthentication();
  }
});

// Function to initialize header functionality
function initializeHeader() {
  console.log('🔄 Initializing header functionality...');
  
  // Reset mobile nav initialization flag to allow re-initialization
  mobileNavInitialized = false;
  
  // Initialize all components immediately
  setupMobileNavigation();
  setupAuthentication();
  setupActiveNavigation();
  setupLanguageSwitchers();
  
  // Ensure close button is set up after dynamic loading
  setTimeout(() => {
    setupMobileNavCloseButton();
  }, 200);
}

// Make initializeHeader globally available
window.initializeHeader = initializeHeader;

// SUPER-SIMPLE test function
window.testCloseButton = function() {
  console.log('🧪 SUPER-SIMPLE: Testing close button...');
  
  // Test both language versions
  const closeBtnEn = document.getElementById('mobileNavCloseEn');
  const closeBtnAr = document.getElementById('mobileNavCloseAr');
  const mobileNavEn = document.getElementById('mobileNavEn');
  const mobileNavAr = document.getElementById('mobileNavAr');
  const hamburgerMenuEn = document.getElementById('hamburgerMenuEn');
  const hamburgerMenuAr = document.getElementById('hamburgerMenuAr');
  
  console.log('🔍 Elements found:');
  console.log('  - Close button (EN):', !!closeBtnEn);
  console.log('  - Close button (AR):', !!closeBtnAr);
  console.log('  - Mobile nav (EN):', !!mobileNavEn);
  console.log('  - Mobile nav (AR):', !!mobileNavAr);
  console.log('  - Hamburger menu (EN):', !!hamburgerMenuEn);
  console.log('  - Hamburger menu (AR):', !!hamburgerMenuAr);
  
  // Test English version
  if (closeBtnEn) {
    console.log('🔍 Close button (EN) details:');
    console.log('  - Visible:', closeBtnEn.offsetWidth > 0 && closeBtnEn.offsetHeight > 0);
    console.log('  - Display:', window.getComputedStyle(closeBtnEn).display);
    console.log('  - Pointer events:', window.getComputedStyle(closeBtnEn).pointerEvents);
    console.log('  - Z-index:', window.getComputedStyle(closeBtnEn).zIndex);
    console.log('  - Position:', window.getComputedStyle(closeBtnEn).position);
    console.log('  - Clickable area:', closeBtnEn.getBoundingClientRect());
    
    // Test direct click
    console.log('🧪 Testing direct click (EN)...');
    closeBtnEn.click();
  }
  
  // Test Arabic version
  if (closeBtnAr) {
    console.log('🔍 Close button (AR) details:');
    console.log('  - Visible:', closeBtnAr.offsetWidth > 0 && closeBtnAr.offsetHeight > 0);
    console.log('  - Display:', window.getComputedStyle(closeBtnAr).display);
    console.log('  - Pointer events:', window.getComputedStyle(closeBtnAr).pointerEvents);
    console.log('  - Z-index:', window.getComputedStyle(closeBtnAr).zIndex);
    console.log('  - Position:', window.getComputedStyle(closeBtnAr).position);
    console.log('  - Clickable area:', closeBtnAr.getBoundingClientRect());
    
    // Test direct click
    console.log('🧪 Testing direct click (AR)...');
    closeBtnAr.click();
  }
  
  // Test mobile nav visibility
  if (mobileNavEn) {
    console.log('🔍 Mobile nav (EN) details:');
    console.log('  - Display:', window.getComputedStyle(mobileNavEn).display);
    console.log('  - Opacity:', window.getComputedStyle(mobileNavEn).opacity);
    console.log('  - Visibility:', window.getComputedStyle(mobileNavEn).visibility);
    console.log('  - Has active class:', mobileNavEn.classList.contains('active'));
  }
  
  if (mobileNavAr) {
    console.log('🔍 Mobile nav (AR) details:');
    console.log('  - Display:', window.getComputedStyle(mobileNavAr).display);
    console.log('  - Opacity:', window.getComputedStyle(mobileNavAr).opacity);
    console.log('  - Visibility:', window.getComputedStyle(mobileNavAr).visibility);
    console.log('  - Has active class:', mobileNavAr.classList.contains('active'));
  }
};

// ULTRA-SIMPLE force close function
window.forceCloseMobileNav = function() {
  console.log('🚨 ULTRA-SIMPLE: Force closing mobile nav...');
  const mobileNav = document.getElementById('mobileNav');
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  
  if (mobileNav) {
    mobileNav.classList.remove('active');
    mobileNav.style.display = 'none';
    console.log('✅ Force closed mobile nav');
  }
  
  if (hamburgerMenu) {
    hamburgerMenu.classList.remove('active');
    console.log('✅ Force closed hamburger menu');
  }
  
  document.body.style.overflow = '';
  console.log('✅ Force close complete');
};

// ===== MOBILE NAVIGATION FUNCTIONALITY =====
// Global variables to prevent duplicate event listeners
let mobileNavInitialized = false;
let mobileNavElements = {};

function setupMobileNavigation() {
  // Prevent duplicate initialization
  if (mobileNavInitialized) return;
  
  // Detect current language and get appropriate elements
  const isArabic = document.documentElement.lang === 'ar' || 
                   window.location.pathname.includes('/ar/') ||
                   document.querySelector('.arabic');
  
  const elementSuffix = isArabic ? 'Ar' : 'En';
  
  mobileNavElements = {
    hamburgerMenu: document.getElementById(`hamburgerMenu${elementSuffix}`),
    mobileNav: document.getElementById(`mobileNav${elementSuffix}`),
    mobileNavClose: document.getElementById(`mobileNavClose${elementSuffix}`)
  };

  console.log(`🔧 Mobile nav elements found (${isArabic ? 'Arabic' : 'English'}):`, {
    hamburgerMenu: !!mobileNavElements.hamburgerMenu,
    mobileNav: !!mobileNavElements.mobileNav,
    mobileNavClose: !!mobileNavElements.mobileNavClose,
    elementSuffix: elementSuffix
  });

  // Check if elements exist
  if (!mobileNavElements.hamburgerMenu || !mobileNavElements.mobileNav) {
    console.log('❌ Mobile nav elements not found, skipping setup');
    return;
  }
  
  // Ensure mobile nav is properly configured based on screen size
  if (window.innerWidth > 991) {
    mobileNavElements.mobileNav.style.display = 'none';
  } else {
    // On mobile, ensure it's available but hidden with opacity
    mobileNavElements.mobileNav.style.display = 'block';
  }

  // Hamburger menu toggle - support both click and touch
  mobileNavElements.hamburgerMenu.addEventListener('click', handleHamburgerClick);
  mobileNavElements.hamburgerMenu.addEventListener('touchend', handleHamburgerClick);

  // Setup close button with robust detection
  setupMobileNavCloseButton();

  // Close mobile nav when clicking on a link
  mobileNavElements.mobileNav.addEventListener('click', handleMobileNavLinkClick);

  // Close mobile nav when clicking outside - only add once
  if (!window.outsideClickHandlerAdded) {
    document.addEventListener('click', handleOutsideClick);
    window.outsideClickHandlerAdded = true;
  }
  
  // ULTRA-SIMPLE global click handler - only add once
  if (!window.globalCloseHandlerAdded) {
    document.addEventListener('click', function(e) {
      if (e.target && (e.target.id === 'mobileNavCloseEn' || e.target.id === 'mobileNavCloseAr')) {
        console.log('🎯 GLOBAL: Close button click detected!', e.target.id);
        e.preventDefault();
        e.stopPropagation();
        
        // Detect which language version was clicked
        const isArabic = e.target.id === 'mobileNavCloseAr';
        const elementSuffix = isArabic ? 'Ar' : 'En';
        
        const mobileNav = document.getElementById(`mobileNav${elementSuffix}`);
        const hamburgerMenu = document.getElementById(`hamburgerMenu${elementSuffix}`);
        
        if (mobileNav) {
          mobileNav.classList.remove('active');
          mobileNav.style.display = 'none';
          console.log(`✅ GLOBAL: Mobile nav closed (${isArabic ? 'Arabic' : 'English'})`);
        }
        
        if (hamburgerMenu) {
          hamburgerMenu.classList.remove('active');
          console.log(`✅ GLOBAL: Hamburger menu closed (${isArabic ? 'Arabic' : 'English'})`);
        }
        
        document.body.style.overflow = '';
      }
    });
    window.globalCloseHandlerAdded = true;
    console.log('✅ ULTRA-SIMPLE: Global click handler added');
  }

  // Handle window resize - only add once
  if (!window.resizeHandlerAdded) {
    window.addEventListener('resize', handleWindowResize);
    window.resizeHandlerAdded = true;
  }

  mobileNavInitialized = true;
}

// SUPER-SIMPLE hamburger click handler
function handleHamburgerClick(e) {
  console.log('🍔 SUPER-SIMPLE: Hamburger clicked!');
  e.preventDefault();
  e.stopPropagation();
  
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  const mobileNav = document.getElementById('mobileNav');
  
  if (mobileNav && hamburgerMenu) {
    // Simple show logic
    mobileNav.style.display = 'block';
    mobileNav.classList.add('active');
    hamburgerMenu.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Mobile nav shown');
    
    // Setup close button only once
    setupMobileNavCloseButton();
  } else {
    console.log('❌ Mobile nav or hamburger not found');
  }
}

function handleMobileNavClose(e) {
  console.log('❌ Mobile nav close clicked!', e);
  e.preventDefault();
  e.stopPropagation();
  
  // Force close the mobile nav
  closeMobileNav();
  
  // Additional safety: ensure it's closed
  setTimeout(() => {
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav && mobileNav.classList.contains('active')) {
      console.log('🔧 Force closing mobile nav (safety check)');
      mobileNav.classList.remove('active');
      mobileNav.style.display = 'none';
      document.body.style.overflow = '';
    }
  }, 50);
}

// SUPER-SIMPLE close button setup - NO cloning, NO multiple attempts
function setupMobileNavCloseButton() {
  console.log('🔧 SUPER-SIMPLE: Setting up mobile nav close button');
  
  const closeBtn = document.getElementById('mobileNavClose');
  if (closeBtn) {
    console.log('🔧 Close button found!', closeBtn);
    
    // Remove any existing listeners first
    closeBtn.removeEventListener('click', handleCloseClick);
    closeBtn.removeEventListener('touchend', handleCloseClick);
    
    // Add ONE simple event listener
    closeBtn.addEventListener('click', handleCloseClick);
    closeBtn.addEventListener('touchend', handleCloseClick);
    
    // Also set onclick as backup
    closeBtn.onclick = handleCloseClick;
    
    console.log('✅ SUPER-SIMPLE: Close button setup complete!');
  } else {
    console.log('❌ Close button not found');
  }
}

// Simple close handler function
function handleCloseClick(e) {
  console.log('🎯 CLOSE BUTTON CLICKED!', e);
  e.preventDefault();
  e.stopPropagation();
  
  const mobileNav = document.getElementById('mobileNav');
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  
  if (mobileNav) {
    mobileNav.classList.remove('active');
    mobileNav.style.display = 'none';
    console.log('✅ Mobile nav closed');
  }
  
  if (hamburgerMenu) {
    hamburgerMenu.classList.remove('active');
    console.log('✅ Hamburger menu closed');
  }
  
  document.body.style.overflow = '';
  console.log('✅ Close complete!');
}

function handleMobileNavLinkClick(e) {
  if (e.target.tagName === 'A') {
    closeMobileNav();
  }
}

function handleOutsideClick(e) {
  const { hamburgerMenu, mobileNav } = mobileNavElements;
  
  if (mobileNav && mobileNav.classList.contains('active') && 
      !mobileNav.contains(e.target) && 
      !hamburgerMenu.contains(e.target)) {
    closeMobileNav();
  }
}

// Debounced resize handler
let resizeTimeout;
function handleWindowResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (window.innerWidth > 991) {
      closeMobileNav();
    }
  }, 100);
}

function closeMobileNav() {
  console.log('🚪 Closing mobile nav...');
  const { hamburgerMenu, mobileNav } = mobileNavElements;
  
  hamburgerMenu.classList.remove('active');
  mobileNav.classList.remove('active');
  document.body.style.overflow = '';
  
  // Hide mobile nav after transition
  setTimeout(() => {
    if (!mobileNav.classList.contains('active')) {
      mobileNav.style.display = 'none';
      console.log('🚪 Mobile nav hidden');
    }
  }, 300);
  
  console.log('🚪 Mobile nav closed');
}

// ===== AUTHENTICATION HANDLING =====
function setupAuthentication() {
  console.log('🔐 Setting up authentication...');
  
  const profileNavItem = document.getElementById('profileNavItem');
  const lecturesNavItem = document.getElementById('lecturesNavItem');
  const liveNavItem = document.getElementById('liveNavItem');
  const mobileProfileNavItem = document.getElementById('mobileProfileNavItem');
  const mobileLecturesNavItem = document.getElementById('mobileLecturesNavItem');
  const mobileLiveNavItem = document.getElementById('mobileLiveNavItem');
  const logoutBtn = document.getElementById('logoutBtn');
  const registerBtn = document.getElementById('registerBtn');
  const loginBtn = document.getElementById('loginBtn');

  // Get token from localStorage
  const userToken = localStorage.getItem('userToken');
  console.log('🔐 Token found:', !!userToken);

  // Check if token exists and is valid
  const isLoggedIn = userToken && isTokenValid(userToken);
  console.log('🔐 User logged in:', isLoggedIn);

  if (isLoggedIn) {
    console.log('✅ User is authenticated, showing authenticated UI');
    // Show authenticated elements
    if (profileNavItem) profileNavItem.style.display = 'inline-block';
    if (lecturesNavItem) lecturesNavItem.style.display = 'inline-block';
    if (liveNavItem) liveNavItem.style.display = 'inline-block';
    if (mobileProfileNavItem) mobileProfileNavItem.style.display = 'block';
    if (mobileLecturesNavItem) mobileLecturesNavItem.style.display = 'block';
    if (mobileLiveNavItem) mobileLiveNavItem.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (registerBtn) registerBtn.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'none';
  } else {
    console.log('❌ User not authenticated, showing public UI');
    // Show public elements
    if (profileNavItem) profileNavItem.style.display = 'none';
    if (lecturesNavItem) lecturesNavItem.style.display = 'none';
    if (liveNavItem) liveNavItem.style.display = 'none';
    if (mobileProfileNavItem) mobileProfileNavItem.style.display = 'none';
    if (mobileLecturesNavItem) mobileLecturesNavItem.style.display = 'none';
    if (mobileLiveNavItem) mobileLiveNavItem.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'inline-block';
    if (loginBtn) loginBtn.style.display = 'inline-block';
    
    // Clear invalid token
    if (userToken && !isTokenValid(userToken)) {
      console.log('🗑️ Clearing invalid token');
      localStorage.removeItem('userToken');
    }
  }

  // Setup logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('🚪 User logging out');
      localStorage.removeItem('userToken');
      localStorage.removeItem('adminToken');
      // Force page reload to update UI
      window.location.reload();
    });
  }
}

// ===== TOKEN VALIDATION =====
function isTokenValid(token) {
  if (!token) return false;
  
  try {
    // Decode JWT token (basic validation)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    if (payload.exp && payload.exp < currentTime) {
      console.log('⏰ Token expired');
      return false;
    }
    
    console.log('✅ Token is valid');
    return true;
  } catch (error) {
    console.log('❌ Token validation error:', error);
    return false;
  }
}

// ===== GLOBAL AUTHENTICATION UTILITIES =====
// Make authentication functions available globally
window.authUtils = {
  isLoggedIn: () => {
    const token = localStorage.getItem('userToken');
    return token && isTokenValid(token);
  },
  
  getToken: () => {
    return localStorage.getItem('userToken');
  },
  
  logout: () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('adminToken');
    window.location.reload();
  },
  
  checkAuth: () => {
    setupAuthentication();
  }
};

// ===== ACTIVE NAVIGATION HANDLING =====
function setupActiveNavigation() {
  // Get current page path
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop() || 'index.html';
  
  // Remove active class from all navigation items
  const allNavLinks = document.querySelectorAll('.main-nav a, .mobile-nav a');
  allNavLinks.forEach(link => link.classList.remove('active'));
  
  // Add active class to current page link
  const currentPageLink = document.querySelector(`a[href="${currentPage}"]`);
  if (currentPageLink) {
    currentPageLink.classList.add('active');
  }
  
  // Handle special cases for pages that might not match exactly
  if (currentPage === 'index.html' || currentPage === '') {
    const homeLink = document.querySelector('a[href="index.html"]');
    if (homeLink) homeLink.classList.add('active');
  }
}

// ===== LANGUAGE SWITCHER SETUP =====
function setupLanguageSwitchers() {
  console.log('🌐 Setting up language switchers...');
  
  // Get the current server protocol, hostname, and port
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  const baseUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
  
  // Get current page path
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop() || 'index.html';
  
  // Handle cases where currentPage might be empty
  if (!currentPage || currentPage === '') {
    currentPage = 'index.html';
  }
  
  console.log(`🌐 Setting up language switchers for page: ${currentPage} on ${baseUrl}`);
  
  // Setup English to Arabic switcher
  const arLink = document.getElementById('arLink');
  console.log('🌐 Arabic link found:', !!arLink);
  if (arLink) {
    // Map English pages to Arabic equivalents
    const enToArMap = {
      'index.html': `${baseUrl}/ar/index.html`,
      'about.html': `${baseUrl}/ar/about.html`,
      'courses.html': `${baseUrl}/ar/courses.html`,
      'news.html': `${baseUrl}/ar/news.html`,
      'contact.html': `${baseUrl}/ar/contact.html`,
      'profile.html': `${baseUrl}/ar/profile.html`,
      'livestream.html': `${baseUrl}/ar/livestream.html`,
      'login.html': `${baseUrl}/ar/login.html`,
      'register.html': `${baseUrl}/ar/register.html`,
      'course-details.html': `${baseUrl}/ar/course-details.html`,
      'enroll.html': `${baseUrl}/ar/index.html`, // Redirect to home since enroll.html doesn't exist in Arabic
      'recorded-lectures.html': `${baseUrl}/ar/recorded-lectures.html`
    };
    
    if (enToArMap[currentPage]) {
      arLink.href = enToArMap[currentPage];
      console.log(`EN -> AR: ${currentPage} -> ${enToArMap[currentPage]}`);
    } else {
      arLink.href = `${baseUrl}/ar/index.html`;
      console.log(`EN -> AR: ${currentPage} -> default (${baseUrl}/ar/index.html)`);
    }
  }
  
  // Setup Arabic to English switcher
  const enLink = document.getElementById('enLink');
  console.log('🌐 English link found:', !!enLink);
  if (enLink) {
    // Map Arabic pages to English equivalents
    const arToEnMap = {
      'index.html': `${baseUrl}/en/index.html`,
      'about.html': `${baseUrl}/en/about.html`,
      'courses.html': `${baseUrl}/en/courses.html`,
      'news.html': `${baseUrl}/en/news.html`,
      'contact.html': `${baseUrl}/en/contact.html`,
      'profile.html': `${baseUrl}/en/profile.html`,
      'livestream.html': `${baseUrl}/en/livestream.html`,
      'login.html': `${baseUrl}/en/login.html`,
      'register.html': `${baseUrl}/en/register.html`,
      'course-details.html': `${baseUrl}/en/course-details.html`,
      'enroll.html': `${baseUrl}/en/enroll.html`,
      'recorded-lectures.html': `${baseUrl}/en/recorded-lectures.html`
    };
    
    if (arToEnMap[currentPage]) {
      enLink.href = arToEnMap[currentPage];
      console.log(`AR -> EN: ${currentPage} -> ${arToEnMap[currentPage]}`);
    } else {
      enLink.href = `${baseUrl}/en/index.html`;
      console.log(`AR -> EN: ${currentPage} -> default (${baseUrl}/en/index.html)`);
    }
  }
}

// ===== SMOOTH SCROLLING =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// ===== ANIMATIONS ON SCROLL =====
document.addEventListener('DOMContentLoaded', () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
      }
    });
  }, observerOptions);

  // Observe elements with animation classes
  document.querySelectorAll('.animate-on-scroll, .card, .feature-card, .course-card').forEach(el => {
    observer.observe(el);
  });
});