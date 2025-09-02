// frontend/js/profile.js
(() => {
  async function init() {
    const token = localStorage.getItem('userToken');
    if (!token) {
      window.location.href = '/login.html';
      return;
    }

    const container = document.getElementById('profileContainer');
    container.innerHTML = '<p>Loading profile...</p>';

    try {
      const res = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to load profile');
      }

      const user = await res.json();
      if (!res.ok) throw new Error(user.message || 'Failed to load user');

      // Get courses data for colored badges
      let courseBadges = '';
      if (user.courses && user.courses.length > 0) {
        try {
          const coursesRes = await fetch('http://localhost:3000/api/courses', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (coursesRes.ok) {
            const courses = await coursesRes.json();
            const courseMap = {};
            courses.forEach(course => {
              courseMap[course._id] = course;
            });
            
            courseBadges = user.courses.map(courseId => {
              // Fixed: Convert ObjectId to string for comparison
              const course = courseMap[courseId.toString()];
              if (course) {
                return `<span style="background-color: ${course.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 2px; display: inline-block; border: 2px solid ${course.color}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${course.name}</span>`;
              }
              return '';
            }).join('');
          }
        } catch (error) {
          console.error('Error loading courses:', error);
          courseBadges = user.courses.join(', '); // Fallback
        }
      } else {
        courseBadges = '<span style="color: #666; font-style: italic;">No courses assigned</span>';
      }

      // Load certificates
      let certHTML = '<p>No certificates uploaded yet.</p>';
      if (user.certificates && user.certificates.length > 0) {
        certHTML = '<div class="certificates-grid">';
        user.certificates.forEach(cert => {
          certHTML += `
            <div class="certificate-item">
              <img src="/certs/${cert.image}" alt="${cert.name}" style="max-width: 200px; height: auto;">
              <p>${cert.name}</p>
            </div>
          `;
        });
        certHTML += '</div>';
      }

      container.innerHTML = `
        <div class="profile-card">
          <h2>${user.name || '—'}</h2>
          <p><strong>Phone:</strong> ${user.phone || '—'}</p>
          <p><strong>Email:</strong> ${user.email || '—'}</p>
          <p><strong>Civil ID:</strong> ${user.civilId || '—'}</p>
          <p><strong>Passport No:</strong> ${user.passportNumber || '—'}</p>
          <p><strong>Date of Birth:</strong> ${user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '—'}</p>
          <div style="margin: 15px 0;">
            <strong>Assigned Courses:</strong><br>
            <div style="margin-top: 8px;">
              ${courseBadges}
            </div>
          </div>
          <h3>Certificates</h3>
          ${certHTML}
        </div>
      `;
    } catch (error) {
      console.error('Error:', error);
      container.innerHTML = `
        <div class="error-message">
          <p>Error loading profile: ${error.message}</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }
  }

  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();