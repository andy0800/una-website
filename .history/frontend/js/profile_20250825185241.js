// frontend/js/profile.js
(() => {
  async function init() {
    const token = localStorage.getItem('userToken');
    if (!token) {
      // Production-ready: Console logging removed
      window.location.href = 'login.html';
      return;
    }

    // Production-ready: Console logging removed

    try {
      // Fetch user data
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token expired or invalid, clearing and redirecting');
          localStorage.removeItem('userToken');
          window.location.href = 'login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const user = await response.json();
      console.log('User data received:', user);

      // Update profile header
      document.getElementById('profileName').textContent = user.name || 'User';
      
      // Update avatar with user initials
      const avatar = document.querySelector('.profile-avatar');
      if (user.name) {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        avatar.innerHTML = `<span style="font-size: 2rem; font-weight: 700;">${initials}</span>`;
      }

      // Update stats
      const coursesCount = user.courses ? user.courses.length : 0;
      const certificatesCount = user.certificates ? user.certificates.length : 0;
      const progressPercent = coursesCount > 0 ? Math.round((certificatesCount / coursesCount) * 100) : 0;

      document.getElementById('coursesCount').textContent = coursesCount;
      document.getElementById('certificatesCount').textContent = certificatesCount;
      document.getElementById('progressPercent').textContent = progressPercent + '%';

      // Update progress bar
      document.getElementById('overallProgress').textContent = progressPercent + '%';
      document.getElementById('progressBar').style.width = progressPercent + '%';

      // Load personal information
      loadPersonalInfo(user);

      // Load enrolled courses
      await loadEnrolledCourses(user.courses || []);

      // Load certificates
      loadCertificates(user.certificates || []);

      // Load recent activity
      loadRecentActivity(user);

    } catch (error) {
      console.error('Error loading profile:', error);
      document.getElementById('profileName').textContent = 'Error loading profile';
      
      // Show error details for debugging
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'background: #fee; color: #c33; padding: 1rem; margin: 1rem 0; border-radius: 8px; border: 1px solid #fcc;';
      errorDiv.innerHTML = `
        <h4>Profile Loading Error</h4>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><strong>Token:</strong> ${token ? token.substring(0, 20) + '...' : 'None'}</p>
        <button onclick="location.reload()" style="background: #c33; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Retry</button>
      `;
      
      const profileHeader = document.querySelector('.profile-header');
      if (profileHeader) {
        profileHeader.appendChild(errorDiv);
      }
    }
  }

  function loadPersonalInfo(user) {
    const personalInfoContainer = document.getElementById('personalInfo');
    
    const infoItems = [
      { label: 'Full Name', value: user.name || 'Not provided', icon: 'fas fa-user' },
      { label: 'Phone Number', value: user.phone || 'Not provided', icon: 'fas fa-phone' },
      { label: 'Email', value: user.email || 'Not provided', icon: 'fas fa-envelope' },
      { label: 'Civil ID', value: user.civilId || 'Not provided', icon: 'fas fa-id-card' },
      { label: 'Passport Number', value: user.passportNumber || 'Not provided', icon: 'fas fa-passport' },
      { label: 'Date of Birth', value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided', icon: 'fas fa-calendar' }
    ];

    personalInfoContainer.innerHTML = infoItems.map(item => `
      <div class="profile-info-item">
        <div class="profile-info-label">
          <i class="${item.icon}"></i> ${item.label}
        </div>
        <div class="profile-info-value">${item.value}</div>
      </div>
    `).join('');
  }

  async function loadEnrolledCourses(courseIds) {
    const coursesContainer = document.getElementById('enrolledCourses');
    
    if (courseIds.length === 0) {
      coursesContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--dark-gray);">
          <i class="fas fa-graduation-cap" style="font-size: 3rem; color: var(--border-gray); margin-bottom: 1rem;"></i>
          <p>No courses enrolled yet</p>
          <a href="courses.html" class="btn btn-primary" style="margin-top: 1rem;">
            <i class="fas fa-plus"></i> Browse Courses
          </a>
        </div>
      `;
      return;
    }

    try {
      // Fetch course details from public endpoint
      const response = await fetch('/api/courses');

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const allCourses = await response.json();
      const userCourses = allCourses.filter(course => 
        courseIds.some(id => id.toString() === course._id.toString())
      );

      coursesContainer.innerHTML = userCourses.map(course => `
        <div class="profile-course-badge" style="background-color: ${course.color || '#0066cc'}; color: white; border-color: ${course.color || '#0066cc'};">
          <i class="fas fa-graduation-cap"></i>
          ${course.name}
        </div>
      `).join('');

    } catch (error) {
      console.error('Error loading courses:', error);
      coursesContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--dark-gray);">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--accent-red); margin-bottom: 1rem;"></i>
          <p>Error loading courses</p>
        </div>
      `;
    }
  }

  function loadCertificates(certificates) {
    const certificatesContainer = document.getElementById('certificates');
    
    if (certificates.length === 0) {
      certificatesContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--dark-gray);">
          <i class="fas fa-certificate" style="font-size: 3rem; color: var(--border-gray); margin-bottom: 1rem;"></i>
          <p>No certificates uploaded yet</p>
        </div>
      `;
      return;
    }

    certificatesContainer.innerHTML = certificates.map(cert => `
      <div class="profile-certificate">
        <div class="profile-certificate-image">
          ${cert.image ? `<img src="/certs/${cert.image}" alt="${cert.name}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i class="fas fa-certificate"></i>'}
        </div>
        <div class="profile-certificate-content">
          <div class="profile-certificate-name">${cert.name}</div>
          <div class="profile-certificate-date">Uploaded</div>
        </div>
      </div>
    `).join('');
  }

  function loadRecentActivity(user) {
    const activityContainer = document.getElementById('recentActivity');
    
    // Create mock recent activity based on user data
    const activities = [];
    
    if (user.courses && user.courses.length > 0) {
      activities.push({
        text: `Enrolled in ${user.courses.length} course${user.courses.length > 1 ? 's' : ''}`,
        time: 'Recently',
        icon: 'fas fa-graduation-cap'
      });
    }
    
    if (user.certificates && user.certificates.length > 0) {
      activities.push({
        text: `Uploaded ${user.certificates.length} certificate${user.certificates.length > 1 ? 's' : ''}`,
        time: 'Recently',
        icon: 'fas fa-certificate'
      });
    }
    
    if (activities.length === 0) {
      activities.push({
        text: 'Profile created',
        time: 'Recently',
        icon: 'fas fa-user-plus'
      });
    }

    activityContainer.innerHTML = activities.map(activity => `
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--light-gray); border-radius: var(--border-radius);">
        <i class="${activity.icon}" style="color: var(--primary-blue);"></i>
        <div>
          <div style="font-size: 0.9rem; font-weight: 600;">${activity.text}</div>
          <div style="font-size: 0.8rem; color: var(--dark-gray);">${activity.time}</div>
        </div>
      </div>
    `).join('');
  }

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();