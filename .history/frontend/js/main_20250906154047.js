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
  
  // Initialize all components immediately
  setupAuthentication();
  setupActiveNavigation();
  setupLanguageSwitchers();
  
  // Initialize mobile navigation
  setupMobileNavigation();
}

// Make initializeHeader globally available
window.initializeHeader = initializeHeader;

// ===== MOBILE NAVIGATION SYSTEM =====
class MobileNavigation {
  constructor() {
    this.isOpen = false;
    this.elements = {};
    this.init();
  }

  init() {
    // Detect current language
    this.isArabic = this.detectLanguage();
    this.suffix = this.isArabic ? 'Ar' : 'En';
    
    // Get elements
    this.elements = {
      hamburger: document.getElementById(`hamburgerMenu${this.suffix}`),
      mobileNav: document.getElementById(`mobileNav${this.suffix}`),
      closeBtn: document.getElementById(`mobileNavClose${this.suffix}`)
    };

    console.log(`🔧 Mobile Navigation (${this.isArabic ? 'Arabic' : 'English'}) initialized:`, {
      hamburger: !!this.elements.hamburger,
      mobileNav: !!this.elements.mobileNav,
      closeBtn: !!this.elements.closeBtn
    });

    if (this.elements.hamburger && this.elements.mobileNav && this.elements.closeBtn) {
      this.setupEventListeners();
    } else {
      console.log('❌ Mobile navigation elements not found');
    }
  }

  detectLanguage() {
    return document.documentElement.lang === 'ar' || 
           window.location.pathname.includes('/ar/') ||
           document.querySelector('.arabic');
  }

  setupEventListeners() {
    // Hamburger menu click
    this.elements.hamburger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    // Close button click
    this.elements.closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.close();
    });

    // Close on link click
    this.elements.mobileNav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        this.close();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !this.elements.mobileNav.contains(e.target) && 
          !this.elements.hamburger.contains(e.target)) {
        this.close();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Close on window resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 991 && this.isOpen) {
        this.close();
      }
    });

    console.log('✅ Mobile navigation event listeners set up');
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    console.log('🍔 Opening mobile menu');
    
    this.elements.mobileNav.style.display = 'block';
    this.elements.mobileNav.offsetHeight; // Force reflow
    
    this.elements.hamburger.classList.add('active');
    this.elements.mobileNav.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    this.isOpen = true;
    console.log('✅ Mobile menu opened');
  }

  close() {
    console.log('❌ Closing mobile menu');
    
    this.elements.hamburger.classList.remove('active');
    this.elements.mobileNav.classList.remove('active');
    document.body.style.overflow = '';
    
    // Hide after transition
    setTimeout(() => {
      if (!this.elements.mobileNav.classList.contains('active')) {
        this.elements.mobileNav.style.display = 'none';
      }
    }, 300);
    
    this.isOpen = false;
    console.log('✅ Mobile menu closed');
  }
}

// Initialize mobile navigation
function setupMobileNavigation() {
  new MobileNavigation();
}

// ===== AUTHENTICATION HANDLING =====
function setupAuthentication() {
  console.log('🔐 Setting up authentication...');
  
  const token = localStorage.getItem('userToken');
  const isLoggedIn = token && isTokenValid(token);
  
  console.log('🔐 Token found:', !!token);
  console.log('🔐 User logged in:', isLoggedIn);
  
  if (isLoggedIn) {
    console.log('✅ User is authenticated, showing authenticated UI');
    showAuthenticatedUI();
  } else {
    console.log('❌ User not authenticated, showing public UI');
    showPublicUI();
    
    // Clear invalid token
    if (token) {
      localStorage.removeItem('userToken');
    }
  }
}

function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch (error) {
    console.log('🔐 Token validation error:', error);
    return false;
  }
}

function showAuthenticatedUI() {
  // Show authenticated elements
  const profileNavItem = document.getElementById('profileNavItem');
  const lecturesNavItem = document.getElementById('lecturesNavItem');
  const mobileProfileNavItem = document.getElementById('mobileProfileNavItem');
  const mobileLecturesNavItem = document.getElementById('mobileLecturesNavItem');
  const logoutBtn = document.getElementById('logoutBtn');
  const registerBtn = document.getElementById('registerBtn');
  const loginBtn = document.getElementById('loginBtn');

  if (profileNavItem) profileNavItem.style.display = 'block';
  if (lecturesNavItem) lecturesNavItem.style.display = 'block';
  if (mobileProfileNavItem) mobileProfileNavItem.style.display = 'block';
  if (mobileLecturesNavItem) mobileLecturesNavItem.style.display = 'block';
  if (logoutBtn) logoutBtn.style.display = 'inline-block';
  if (registerBtn) registerBtn.style.display = 'none';
  if (loginBtn) loginBtn.style.display = 'none';

  // Setup logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('🚪 User logging out');
      localStorage.removeItem('userToken');
      window.location.reload();
    });
  }
}

function showPublicUI() {
  // Show public elements
  const profileNavItem = document.getElementById('profileNavItem');
  const lecturesNavItem = document.getElementById('lecturesNavItem');
  const mobileProfileNavItem = document.getElementById('mobileProfileNavItem');
  const mobileLecturesNavItem = document.getElementById('mobileLecturesNavItem');
  const logoutBtn = document.getElementById('logoutBtn');
  const registerBtn = document.getElementById('registerBtn');
  const loginBtn = document.getElementById('loginBtn');

  if (profileNavItem) profileNavItem.style.display = 'none';
  if (lecturesNavItem) lecturesNavItem.style.display = 'none';
  if (mobileProfileNavItem) mobileProfileNavItem.style.display = 'none';
  if (mobileLecturesNavItem) mobileLecturesNavItem.style.display = 'none';
  if (logoutBtn) logoutBtn.style.display = 'none';
  if (registerBtn) registerBtn.style.display = 'inline-block';
  if (loginBtn) loginBtn.style.display = 'inline-block';
}

// ===== ACTIVE NAVIGATION =====
function setupActiveNavigation() {
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop() || 'index.html';
  
  // Remove active class from all navigation items
  const allNavLinks = document.querySelectorAll('.main-nav a, .mobile-nav a');
  allNavLinks.forEach(link => link.classList.remove('active'));
  
  // Add active class to current page
  allNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// ===== LANGUAGE SWITCHING =====
function setupLanguageSwitchers() {
  console.log('🌐 Setting up language switchers...');
  
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentHost = window.location.hostname;
  
  console.log(`🌐 Setting up language switchers for page: ${currentPage} on ${currentHost}`);
  
  // Arabic link
  const arLink = document.getElementById('arLink');
  if (arLink) {
    console.log('🌐 Arabic link found:', !!arLink);
    
    arLink.addEventListener('click', (e) => {
      e.preventDefault();
      
      let targetUrl;
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        // Local development
        targetUrl = `/ar/${currentPage}`;
      } else {
        // Production
        targetUrl = `https://cute-churros-f9f049.netlify.app/ar/${currentPage}`;
      }
      
      console.log(`AR -> EN: ${currentPage} -> ${targetUrl}`);
      window.location.href = targetUrl;
    });
  } else {
    console.log('🌐 Arabic link not found');
  }
  
  // English link
  const enLink = document.getElementById('enLink');
  if (enLink) {
    console.log('🌐 English link found:', !!enLink);
    
    enLink.addEventListener('click', (e) => {
      e.preventDefault();
      
      let targetUrl;
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        // Local development
        targetUrl = `/en/${currentPage}`;
      } else {
        // Production
        targetUrl = `https://cute-churros-f9f049.netlify.app/en/${currentPage}`;
      }
      
      console.log(`EN -> AR: ${currentPage} -> ${targetUrl}`);
      window.location.href = targetUrl;
    });
  } else {
    console.log('🌐 English link not found');
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

// ===== GLOBAL AUTH UTILITIES =====
window.authUtils = {
  isLoggedIn: () => {
    const token = localStorage.getItem('userToken');
    return token && isTokenValid(token);
  },
  
  getToken: () => localStorage.getItem('userToken'),
  
  logout: () => {
    localStorage.removeItem('userToken');
    window.location.reload();
  },
  
  checkAuth: () => setupAuthentication()
};

// ===== DEBUG FUNCTIONS =====
window.testMobileNav = function() {
  console.log('🧪 Testing mobile navigation...');
  const nav = new MobileNavigation();
  return nav;
};

window.forceCloseMobileNav = function() {
  console.log('🚨 Force closing mobile nav...');
  const isArabic = document.documentElement.lang === 'ar' || 
                   window.location.pathname.includes('/ar/') ||
                   document.querySelector('.arabic');
  const suffix = isArabic ? 'Ar' : 'En';
  
  const mobileNav = document.getElementById(`mobileNav${suffix}`);
  const hamburgerMenu = document.getElementById(`hamburgerMenu${suffix}`);
  
  if (mobileNav) {
    mobileNav.classList.remove('active');
    mobileNav.style.display = 'none';
  }
  
  if (hamburgerMenu) {
    hamburgerMenu.classList.remove('active');
  }
  
  document.body.style.overflow = '';
  console.log('✅ Force close complete');
};