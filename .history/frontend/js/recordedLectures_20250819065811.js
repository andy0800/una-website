// frontend/js/recordedLectures.js
(() => {
  async function init() {
    const token = localStorage.getItem('userToken');
    if (!token) {
      console.log('No token found, redirecting to login');
      window.location.href = 'login.html';
      return;
    }

    console.log('Token found, initializing recorded lectures...');

    try {
      // Load accessible lectures
      await loadLectures();
      
      // Initialize logout button
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('userToken');
          window.location.href = 'index.html';
        });
      }

    } catch (error) {
      console.error('Error initializing recorded lectures:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('Authentication failed, redirecting to login');
        localStorage.removeItem('userToken');
        window.location.href = 'login.html';
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

  async function loadLectures() {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token');
      }

      console.log('Fetching lectures with token...');
      
      const response = await fetch('/api/lectures/user/lectures', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Lectures response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please login again');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const lectures = await response.json();
      console.log('Lectures received:', lectures);
      
      displayLectures(lectures);
      updateStats(lectures);
    } catch (error) {
      console.error('Error loading lectures:', error);
      throw error;
    }
  }

  function displayLectures(lectures) {
    const grid = document.getElementById('lecturesGrid');
    
    console.log('📋 Displaying lectures:', lectures);
    
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

    // Log each lecture to check structure
    lectures.forEach((lecture, index) => {
      console.log(`📚 Lecture ${index + 1}:`, {
        id: lecture._id,
        title: lecture.title,
        hasId: !!lecture._id,
        hasTitle: !!lecture.title
      });
    });

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
    console.log('🎬 playLecture called with ID:', lectureId);
    
    if (!lectureId) {
      console.error('❌ No lecture ID provided');
      alert('Error: No lecture ID provided');
      return;
    }
    
    try {
      // Show popup with loading state
      showLecturePopup();
      
      console.log('🔍 Fetching lecture details for ID:', lectureId);
      
      const response = await fetch(`/api/lectures/user/lectures/${lectureId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      console.log('📡 Lecture details response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch lecture details');
      }

      const lecture = await response.json();
      console.log('✅ Lecture details received:', lecture);
      
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

  // Download lecture function
  window.downloadLecture = function() {
    const video = document.getElementById('lectureVideoPlayer');
    if (video.src) {
      const link = document.createElement('a');
      link.href = video.src;
      link.download = 'lecture.mp4';
      link.click();
    } else {
      alert('No video available for download');
    }
  };

  // Share lecture function
  window.shareLecture = function() {
    if (navigator.share) {
      navigator.share({
        title: document.getElementById('popupLectureTitle').textContent,
        text: document.getElementById('popupLectureDescription').textContent,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        alert('Lecture URL copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy URL. Please copy manually: ' + url);
      });
    }
  };

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

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
})();
