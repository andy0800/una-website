// frontend/js/recordedLectures.js
(() => {
  async function init() {
    const token = sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
    if (!token) {
      // Production-ready: Console logging removed
      window.location.href = 'login.html';
      return;
    }

    // Production-ready: Console logging removed

    try {
      // Load accessible lectures
      await loadLectures();
      
      // Check for active livestreams
      await checkActiveLivestreams();
      
      // Initialize logout button
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('userToken');
          window.location.href = 'index.html';
        });
      }
      
      // Initialize search and filter functionality
      initializeSearchAndFilters();

    } catch (error) {
      console.error('Error initializing recorded lectures:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        // Production-ready: Console logging removed
        localStorage.removeItem('userToken');
        window.location.href = 'index.html';
        return;
      }
      
      document.getElementById('lecturesGrid').innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--dark-gray);">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--accent-red); margin-bottom: 1rem;"></i>
          <p>Error loading lectures</p>
          <p style="color: #999; font-size: 0.9rem;">${error.message}</p>
          <button onclick="location.reload()" class="btn btn-primary">Retry</button>
        </div>
      `;
    }
  }
  
  // Check for active livestreams
  async function checkActiveLivestreams() {
    try {
      const token = sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
      if (!token) return;
      
      const response = await fetch('/api/admin/livestream/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const streamInfo = await response.json();
        if (streamInfo.isActive) {
          // Show livestream notification
          showLivestreamNotification(streamInfo);
        }
      }
    } catch (error) {
      console.error('Error checking active livestreams:', error);
    }
  }
  
  // Show livestream notification
  function showLivestreamNotification(streamInfo) {
    const notification = document.createElement('div');
    notification.className = 'livestream-notification';
    notification.innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 15px; margin: 20px 0; text-align: center;">
        <h3 style="margin: 0 0 15px 0; font-size: 1.5rem;">
          <i class="fas fa-broadcast-tower"></i> Live Now!
        </h3>
        <p style="margin: 0 0 20px 0; font-size: 1.1rem;">
          Join the current livestream session
        </p>
        <button onclick="joinLivestream('${streamInfo.roomId}')" class="btn btn-primary" style="background: #28a745; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1.1rem; cursor: pointer;">
          <i class="fas fa-play"></i> Join Stream
        </button>
      </div>
    `;
    
    const grid = document.getElementById('lecturesGrid');
    if (grid) {
      grid.insertBefore(notification, grid.firstChild);
    }
  }
  
  // Join livestream function
  function joinLivestream(roomId) {
    // Redirect to livestream page
    window.location.href = `/en/livestream.html?room=${roomId}`;
  }

  async function loadLectures() {
    try {
      const token = sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token');
      }

              // Production-ready: Console logging removed
      
      const response = await fetch('/api/lectures/user/lectures', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

              // Production-ready: Console logging removed

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please login again');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const lectures = await response.json();
              // Production-ready: Console logging removed
      
      // Store lectures globally for search/filter functionality
      allLectures = [...lectures];
      filteredLectures = [...lectures];
      
      displayLectures(lectures);
      updateStats(lectures);
    } catch (error) {
      console.error('Error loading lectures:', error);
      throw error;
    }
  }

  function displayLectures(lectures) {
    const grid = document.getElementById('lecturesGrid');
    
            // Production-ready: Console logging removed
    
    if (!lectures || lectures.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--dark-gray);">
          <i class="fas fa-video-camera" style="font-size: 3rem; color: var(--border-gray); margin-bottom: 1rem;"></i>
          <p>No lectures available yet</p>
          <p style="color: #999; font-size: 0.9rem;">Check back later for new content</p>
        </div>
      `;
      return;
    }



    // Create CSS grid for lectures
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
    grid.style.gap = '2rem';
    grid.style.padding = '2rem 0';

    grid.innerHTML = lectures.map(lecture => `
      <div class="lecture-card" style="
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
      " onclick="playLecture('${lecture._id}')">
        
        <div class="lecture-thumbnail" style="
          height: 200px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <i class="fas fa-play-circle" style="
            font-size: 4rem;
            color: white;
            opacity: 0.8;
          "></i>
          
          <div class="lecture-quality" style="
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
          ">${lecture.quality || '1080p'}</div>
          
          ${lecture.duration ? `
            <div class="lecture-duration" style="
              position: absolute;
              bottom: 10px;
              right: 10px;
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 0.8rem;
            ">${formatDuration(lecture.duration)}</div>
          ` : ''}
        </div>
        
        <div class="lecture-content" style="padding: 1.5rem;">
          <h3 class="lecture-title" style="
            margin: 0 0 0.5rem 0;
            font-size: 1.2rem;
            font-weight: 600;
            color: #333;
            line-height: 1.3;
          ">${lecture.title}</h3>
          
          ${lecture.description ? `
            <p class="lecture-description" style="
              margin: 0 0 1rem 0;
              color: #666;
              font-size: 0.9rem;
              line-height: 1.4;
            ">${lecture.description}</p>
          ` : ''}
          
          <div class="lecture-meta" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            color: #999;
          ">
            <span class="lecture-category" style="
              background: #f0f0f0;
              padding: 4px 8px;
              border-radius: 12px;
              font-weight: 500;
            ">${lecture.category || 'General'}</span>
            
            <span class="lecture-date">
              <i class="fas fa-calendar"></i>
              ${formatDate(lecture.streamDate)}
            </span>
          </div>
        </div>
      </div>
    `).join('');

    // Add hover effects
    const lectureCards = document.querySelectorAll('.lecture-card');
    lectureCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
      });
    });
  }

  function updateStats(lectures) {
    const totalLectures = lectures.length;
    const totalDuration = lectures.reduce((sum, lecture) => sum + (lecture.duration || 0), 0);
    
    document.getElementById('totalLectures').textContent = totalLectures;
    document.getElementById('totalDuration').textContent = formatDuration(totalDuration, true);
    
    // For now, set watched to 0 (can be implemented later with tracking)
    document.getElementById('watchedLectures').textContent = '0';
  }

  function formatDuration(seconds, short = false) {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (short) {
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `0:${minutes.toString().padStart(2, '0')}`;
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Make playLecture function globally accessible
  window.playLecture = async function(lectureId) {
    // Production-ready: Console logging removed
    
    if (!lectureId) {
      console.error('❌ No lecture ID provided');
      alert('Error: No lecture ID provided');
      return;
    }
    
    try {
      // Show popup with loading state
      showLecturePopup();
      
              // Production-ready: Console logging removed
      
      const response = await fetch(`/api/lectures/user/lectures/${lectureId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

              // Production-ready: Console logging removed

      if (!response.ok) {
        throw new Error('Failed to fetch lecture details');
      }

      const lecture = await response.json();
              // Production-ready: Console logging removed
      
      // Populate popup with lecture info
      document.getElementById('popupLectureTitle').textContent = lecture.title;
      document.getElementById('popupLectureDescription').textContent = lecture.description || 'No description available';
      document.getElementById('popupLectureDate').textContent = formatDate(lecture.streamDate);
      document.getElementById('popupLectureDuration').textContent = formatDuration(lecture.duration);
      document.getElementById('popupLectureQuality').textContent = lecture.quality || '1080p';
      document.getElementById('popupLectureCategory').textContent = lecture.category || 'General';
      
             // Set video source with authentication token
       const userToken = localStorage.getItem('userToken');
       const video = document.getElementById('lectureVideoPlayer');
       const placeholder = document.getElementById('lectureVideoPlaceholder');
       
       // Show placeholder while video loads
       placeholder.style.display = 'flex';
       video.style.display = 'none';
       
       video.src = `/api/lectures/user/lectures/${lectureId}/stream?token=${encodeURIComponent(userToken)}`;
       
       // Implement strict anti-download protection
       implementAntiDownloadProtection(video);
       
       // Load video and hide placeholder
       video.load();
       video.addEventListener('loadeddata', () => {
         placeholder.style.display = 'none';
         video.style.display = 'block';
       });
      
      // Handle video errors
      video.addEventListener('error', () => {
        placeholder.style.display = 'flex';
        video.style.display = 'none';
        placeholder.innerHTML = `
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error loading video</p>
          <button onclick="playLecture('${lectureId}')" class="lecture-error-retry">Retry</button>
        `;
      });
      
    } catch (error) {
      console.error('Error playing lecture:', error);
      showLectureError(error.message);
    }
  };

  // Show lecture popup
  function showLecturePopup() {
    const popup = document.getElementById('lecturePopup');
    popup.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  // Close lecture popup
  window.closeLecturePopup = function() {
    const popup = document.getElementById('lecturePopup');
    const video = document.getElementById('lectureVideoPlayer');
    
    // Stop video playback
    video.pause();
    video.src = '';
    
    // Hide popup
    popup.classList.remove('active');
    document.body.style.overflow = ''; // Restore background scrolling
  };

  // Show lecture error
  function showLectureError(message) {
    const popup = document.getElementById('lecturePopup');
    const content = popup.querySelector('.lecture-popup-content');
    
    content.innerHTML = `
      <div class="lecture-error">
        <i class="fas fa-exclamation-triangle"></i>
        <div class="lecture-error-message">Error Loading Lecture</div>
        <div class="lecture-error-details">${message}</div>
        <button class="lecture-error-retry" onclick="closeLecturePopup()">Close</button>
      </div>
    `;
    
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Content protection notice - Download and sharing disabled for security
  // All download and share functionality has been removed to protect content
  
  // Comprehensive anti-download protection system
  function implementAntiDownloadProtection(videoElement) {
    // Disable right-click context menu
    videoElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showProtectionAlert('Right-click is disabled for content protection');
      return false;
    });
    
    // Disable keyboard shortcuts
    videoElement.addEventListener('keydown', (e) => {
      // Block common download shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's' || e.key === 'S') { // Ctrl+S
          e.preventDefault();
          showProtectionAlert('Save functionality is disabled for content protection');
          return false;
        }
        if (e.key === 'u' || e.key === 'U') { // Ctrl+U (View Source)
          e.preventDefault();
          showProtectionAlert('Source viewing is disabled for content protection');
          return false;
        }
        if (e.key === 'c' || e.key === 'C') { // Ctrl+C
          e.preventDefault();
          showProtectionAlert('Copy functionality is disabled for content protection');
          return false;
        }
      }
      
      // Block F12 and other developer tools
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        showProtectionAlert('Developer tools are disabled for content protection');
        return false;
      }
      
      // Block Print Screen
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        showProtectionAlert('Print Screen is disabled for content protection');
        return false;
      }
    });
    
    // Disable drag and drop
    videoElement.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    });
    
    // Disable selection
    videoElement.addEventListener('selectstart', (e) => {
      e.preventDefault();
      return false;
    });
    
    // Disable copy events
    videoElement.addEventListener('copy', (e) => {
      e.preventDefault();
      showProtectionAlert('Copy functionality is disabled for content protection');
      return false;
    });
    
    // Disable cut events
    videoElement.addEventListener('cut', (e) => {
      e.preventDefault();
      showProtectionAlert('Cut functionality is disabled for content protection');
      return false;
    });
    
    // Disable paste events
    videoElement.addEventListener('paste', (e) => {
      e.preventDefault();
      showProtectionAlert('Paste functionality is disabled for content protection');
      return false;
    });
    
    // Monitor for download attempts
    videoElement.addEventListener('loadstart', () => {
      // Disable download attribute
      videoElement.removeAttribute('download');
      
      // Remove any download-related properties
      if (videoElement.download !== undefined) {
        delete videoElement.download;
      }
    });
    
    // Additional protection: monitor for blob URL creation
    const originalCreateObjectURL = window.URL.createObjectURL;
    window.URL.createObjectURL = function(blob) {
      // Block blob URL creation for video blobs
      if (blob && blob.type && blob.type.startsWith('video/')) {
        showProtectionAlert('Video download is not allowed');
        return '';
      }
      return originalCreateObjectURL.call(this, blob);
    };
    
    // Block fetch requests to video URLs for download purposes
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string' && url.includes('/api/lectures/') && url.includes('/stream')) {
        // Check if this is a download attempt
        if (options && options.method === 'GET') {
          // Allow streaming but block download attempts
          const headers = options.headers || {};
          if (headers['Accept'] && headers['Accept'].includes('application/octet-stream')) {
            showProtectionAlert('Direct download is not allowed');
            return Promise.reject(new Error('Download not allowed'));
          }
        }
      }
      return originalFetch.call(this, url, options);
    };
    
    // Disable video element download capabilities
    Object.defineProperty(videoElement, 'download', {
      get: () => undefined,
      set: () => {},
      configurable: false
    });
    
    // Block video element methods that could be used for downloading
    const originalPause = videoElement.pause;
    videoElement.pause = function() {
      // Allow normal pause functionality
      return originalPause.call(this);
    };
    
    // Monitor for any attempt to access video data
    let protectionInterval = setInterval(() => {
      // Check if video element still has protection
      if (!videoElement.parentNode) {
        clearInterval(protectionInterval);
        return;
      }
      
      // Ensure download attribute is always removed
      videoElement.removeAttribute('download');
      
      // Block any new event listeners that might bypass protection
      const eventListeners = videoElement._eventListeners || [];
      eventListeners.forEach(listener => {
        if (listener.type === 'contextmenu' || listener.type === 'keydown') {
          // Re-apply protection if removed
          implementAntiDownloadProtection(videoElement);
        }
      });
    }, 1000);
  }
  
  // Show protection alert
  function showProtectionAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      z-index: 10000;
      font-weight: 500;
      max-width: 300px;
      text-align: center;
    `;
    alertDiv.innerHTML = `
      <i class="fas fa-shield-alt" style="margin-right: 0.5rem;"></i>
      ${message}
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 3000);
  }

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Global anti-download protection
  function implementGlobalProtection() {
    // Disable right-click on entire page
    document.addEventListener('contextmenu', (e) => {
      // Allow right-click on non-video elements
      if (e.target.tagName === 'VIDEO' || e.target.closest('video')) {
        e.preventDefault();
        showProtectionAlert('Right-click is disabled for video content');
        return false;
      }
    });
    
    // Disable keyboard shortcuts globally
    document.addEventListener('keydown', (e) => {
      // Block common download and developer shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's' || e.key === 'S') { // Ctrl+S
          e.preventDefault();
          showProtectionAlert('Save functionality is disabled for content protection');
          return false;
        }
        if (e.key === 'u' || e.key === 'U') { // Ctrl+U
          e.preventDefault();
          showProtectionAlert('Source viewing is disabled for content protection');
          return false;
        }
        if (e.key === 'i' || e.key === 'I') { // Ctrl+I
          e.preventDefault();
          showProtectionAlert('Inspect element is disabled for content protection');
          return false;
        }
        if (e.key === 'j' || e.key === 'J') { // Ctrl+J
          e.preventDefault();
          showProtectionAlert('Console access is disabled for content protection');
          return false;
        }
      }
      
      // Block F12 and other developer tools
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        showProtectionAlert('Developer tools are disabled for content protection');
        return false;
      }
      
      // Block Print Screen
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        showProtectionAlert('Print Screen is disabled for content protection');
        return false;
      }
    });
    
    // Block developer tools detection
    let devtools = { open: false, orientation: null };
    
    setInterval(() => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devtools.open) {
          devtools.open = true;
          showProtectionAlert('Developer tools detected - content protection activated');
        }
      } else {
        devtools.open = false;
      }
    }, 500);
    
    // Block console access
    const originalConsole = window.console;
    window.console = {
      ...originalConsole,
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {},
      debug: () => {}
    };
    
    // Block eval and Function constructor
    window.eval = () => {
      showProtectionAlert('Code execution is disabled for content protection');
      return undefined;
    };
    
    window.Function = () => {
      showProtectionAlert('Code execution is disabled for content protection');
      return () => {};
    };
  }
  
  // Initialize global protection
  implementGlobalProtection();

  // Add popup event listeners
  document.addEventListener('click', (e) => {
    const popup = document.getElementById('lecturePopup');
    if (e.target === popup) {
      closeLecturePopup();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const popup = document.getElementById('lecturePopup');
      if (popup.classList.contains('active')) {
        closeLecturePopup();
      }
    }
  });
  
  // Search and Filter Functions
  let allLectures = [];
  let filteredLectures = [];
  
  function initializeSearchAndFilters() {
    // Populate category filter
    populateCategoryFilter();
    
    // Add event listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(filterLectures, 300));
    }
  }
  
  function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    const categories = [...new Set(allLectures.map(lecture => lecture.category).filter(Boolean))];
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }
  
  function searchLectures() {
    filterLectures();
  }
  
  async function filterLectures() {
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const qualityFilter = document.getElementById('qualityFilter')?.value || '';
    
    try {
      // Use advanced search API for better performance
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (qualityFilter) params.append('quality', qualityFilter);
      
      const token = localStorage.getItem('userToken');
      const response = await fetch(`/api/lectures/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const searchResults = await response.json();
        filteredLectures = searchResults;
        displayLectures(filteredLectures);
        updateStats(filteredLectures);
      } else {
        // Fallback to client-side filtering
        performClientSideFiltering(searchTerm, categoryFilter, qualityFilter);
      }
    } catch (error) {
      console.error('Error with advanced search:', error);
      // Fallback to client-side filtering
      performClientSideFiltering(searchTerm, categoryFilter, qualityFilter);
    }
  }
  
  function performClientSideFiltering(searchTerm, categoryFilter, qualityFilter) {
    const term = searchTerm.toLowerCase();
    
    filteredLectures = allLectures.filter(lecture => {
      const matchesSearch = !term || 
        lecture.title.toLowerCase().includes(term) ||
        (lecture.description && lecture.description.toLowerCase().includes(term)) ||
        (lecture.category && lecture.category.toLowerCase().includes(term));
      
      const matchesCategory = !categoryFilter || lecture.category === categoryFilter;
      const matchesQuality = !qualityFilter || lecture.quality === qualityFilter;
      
      return matchesSearch && matchesCategory && matchesQuality;
    });
    
    displayLectures(filteredLectures);
    updateStats(filteredLectures);
  }
  
  function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const qualityFilter = document.getElementById('qualityFilter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (qualityFilter) qualityFilter.value = '';
    
    filteredLectures = [...allLectures];
    displayLectures(filteredLectures);
    updateStats(filteredLectures);
  }
  
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
})();
