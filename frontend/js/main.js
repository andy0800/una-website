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

// ULTRA-SIMPLE test function
window.testCloseButton = function() {
  console.log('🧪 ULTRA-SIMPLE: Testing close button...');
  const closeBtn = document.getElementById('mobileNavClose');
  const mobileNav = document.getElementById('mobileNav');
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  
  console.log('🔍 Elements found:');
  console.log('  - Close button:', !!closeBtn);
  console.log('  - Mobile nav:', !!mobileNav);
  console.log('  - Hamburger menu:', !!hamburgerMenu);
  
  if (closeBtn) {
    console.log('🔍 Close button details:');
    console.log('  - Visible:', closeBtn.offsetWidth > 0 && closeBtn.offsetHeight > 0);
    console.log('  - Display:', window.getComputedStyle(closeBtn).display);
    console.log('  - Pointer events:', window.getComputedStyle(closeBtn).pointerEvents);
    console.log('  - Z-index:', window.getComputedStyle(closeBtn).zIndex);
    console.log('  - Position:', window.getComputedStyle(closeBtn).position);
    
    // Test direct click
    console.log('🧪 Testing direct click...');
    closeBtn.click();
  }
  
  if (mobileNav) {
    console.log('🔍 Mobile nav details:');
    console.log('  - Display:', window.getComputedStyle(mobileNav).display);
    console.log('  - Opacity:', window.getComputedStyle(mobileNav).opacity);
    console.log('  - Visibility:', window.getComputedStyle(mobileNav).visibility);
    console.log('  - Has active class:', mobileNav.classList.contains('active'));
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
  
  mobileNavElements = {
    hamburgerMenu: document.getElementById('hamburgerMenu'),
    mobileNav: document.getElementById('mobileNav'),
    mobileNavClose: document.getElementById('mobileNavClose')
  };

  console.log('🔧 Mobile nav elements found:', {
    hamburgerMenu: !!mobileNavElements.hamburgerMenu,
    mobileNav: !!mobileNavElements.mobileNav,
    mobileNavClose: !!mobileNavElements.mobileNavClose
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
      if (e.target && e.target.id === 'mobileNavClose') {
        console.log('🎯 GLOBAL: Close button click detected!');
        e.preventDefault();
        e.stopPropagation();
        
        const mobileNav = document.getElementById('mobileNav');
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        
        if (mobileNav) {
          mobileNav.classList.remove('active');
          mobileNav.style.display = 'none';
          console.log('✅ GLOBAL: Mobile nav closed');
        }
        
        if (hamburgerMenu) {
          hamburgerMenu.classList.remove('active');
          console.log('✅ GLOBAL: Hamburger menu closed');
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

// ULTRA-SIMPLE hamburger click handler
function handleHamburgerClick(e) {
  console.log('🍔 ULTRA-SIMPLE: Hamburger clicked!');
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
    
    // Re-setup close button after showing
    setTimeout(() => {
      setupMobileNavCloseButton();
    }, 100);
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

// ULTRA-SIMPLE close button setup - no complex logic
function setupMobileNavCloseButton() {
  console.log('🔧 ULTRA-SIMPLE: Setting up mobile nav close button');
  
  // Try multiple times with different approaches
  const attempts = [0, 100, 300, 500, 1000];
  
  attempts.forEach((delay, index) => {
    setTimeout(() => {
      const closeBtn = document.getElementById('mobileNavClose');
      if (closeBtn) {
        console.log(`🔧 Attempt ${index + 1}: Close button found!`, closeBtn);
        
        // Remove ALL existing event listeners
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        // Add the simplest possible event listener
        newCloseBtn.addEventListener('click', function(e) {
          console.log('🎯 CLOSE BUTTON CLICKED!', e);
          e.preventDefault();
          e.stopPropagation();
          
          // Simple close logic
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
        });
        
        // Also add touchend for mobile
        newCloseBtn.addEventListener('touchend', function(e) {
          console.log('🎯 CLOSE BUTTON TOUCHED!', e);
          e.preventDefault();
          e.stopPropagation();
          
          // Simple close logic
          const mobileNav = document.getElementById('mobileNav');
          const hamburgerMenu = document.getElementById('hamburgerMenu');
          
          if (mobileNav) {
            mobileNav.classList.remove('active');
            mobileNav.style.display = 'none';
            console.log('✅ Mobile nav closed (touch)');
          }
          
          if (hamburgerMenu) {
            hamburgerMenu.classList.remove('active');
            console.log('✅ Hamburger menu closed (touch)');
          }
          
          document.body.style.overflow = '';
        });
        
        // Direct onclick as ultimate backup
        newCloseBtn.onclick = function(e) {
          console.log('🎯 CLOSE BUTTON ONCLICK!', e);
          e.preventDefault();
          e.stopPropagation();
          
          const mobileNav = document.getElementById('mobileNav');
          const hamburgerMenu = document.getElementById('hamburgerMenu');
          
          if (mobileNav) {
            mobileNav.classList.remove('active');
            mobileNav.style.display = 'none';
          }
          
          if (hamburgerMenu) {
            hamburgerMenu.classList.remove('active');
          }
          
          document.body.style.overflow = '';
        };
        
        console.log('✅ ULTRA-SIMPLE: Close button setup complete!');
      } else {
        console.log(`❌ Attempt ${index + 1}: Close button not found`);
      }
    }, delay);
  });
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