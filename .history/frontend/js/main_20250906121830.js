// ===== HEADER INITIALIZATION AND AUTHENTICATION HANDLING =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize header functionality once
  initializeHeader();
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
  // Initialize all components immediately
  setupMobileNavigation();
  setupAuthentication();
  setupActiveNavigation();
  setupLanguageSwitchers();
}

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

  // Check if elements exist
  if (!mobileNavElements.hamburgerMenu || !mobileNavElements.mobileNav) {
    return;
  }

  // Hamburger menu toggle
  mobileNavElements.hamburgerMenu.addEventListener('click', handleHamburgerClick);

  // Close mobile nav
  if (mobileNavElements.mobileNavClose) {
    mobileNavElements.mobileNavClose.addEventListener('click', handleMobileNavClose);
  }

  // Close mobile nav when clicking on a link
  mobileNavElements.mobileNav.addEventListener('click', handleMobileNavLinkClick);

  // Close mobile nav when clicking outside
  document.addEventListener('click', handleOutsideClick);

  // Handle window resize
  window.addEventListener('resize', handleWindowResize);

  mobileNavInitialized = true;
}

// Event handlers
function handleHamburgerClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const { hamburgerMenu, mobileNav } = mobileNavElements;
  
  hamburgerMenu.classList.add('active');
  mobileNav.classList.add('active');
  document.body.style.overflow = 'hidden';
  mobileNav.style.display = 'block';
}

function handleMobileNavClose(e) {
  e.preventDefault();
  e.stopPropagation();
  closeMobileNav();
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

function handleWindowResize() {
  if (window.innerWidth > 991) {
    closeMobileNav();
  }
}

function closeMobileNav() {
  const { hamburgerMenu, mobileNav } = mobileNavElements;
  
  hamburgerMenu.classList.remove('active');
  mobileNav.classList.remove('active');
  document.body.style.overflow = '';
  
  // Hide the mobile nav after animation
  setTimeout(() => {
    if (!mobileNav.classList.contains('active')) {
      mobileNav.style.display = 'none';
    }
  }, 300);
}

// ===== AUTHENTICATION HANDLING =====
function setupAuthentication() {
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

  // Check if token exists and is valid
  const isLoggedIn = userToken && isTokenValid(userToken);

  if (isLoggedIn) {
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
      localStorage.removeItem('userToken');
    }
  }

  // Setup logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
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
  
  console.log(`Setting up language switchers for page: ${currentPage} on ${baseUrl}`);
  
  // Setup English to Arabic switcher
  const arLink = document.getElementById('arLink');
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
      'enroll.html': `${baseUrl}/ar/enroll.html`,
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