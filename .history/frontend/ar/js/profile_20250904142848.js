// frontend/ar/js/profile.js - Arabic version
(() => {
  async function init() {
    const token = localStorage.getItem('userToken');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    try {
      // Fetch user data
      const response = await fetch(window.config.USER_API.PROFILE, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('فشل في تحميل بيانات المستخدم');
      }

      const user = await response.json();

      // Update profile header
      document.getElementById('profileName').textContent = user.name || 'المستخدم';
      
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
      console.error('خطأ في تحميل الملف الشخصي:', error);
      document.getElementById('profileName').textContent = 'خطأ في تحميل الملف الشخصي';
    }
  }

  function loadPersonalInfo(user) {
    const personalInfoContainer = document.getElementById('personalInfo');
    
    const infoItems = [
      { label: 'الاسم الكامل', value: user.name || 'غير محدد', icon: 'fas fa-user' },
      { label: 'رقم الهاتف', value: user.phone || 'غير محدد', icon: 'fas fa-phone' },
      { label: 'البريد الإلكتروني', value: user.email || 'غير محدد', icon: 'fas fa-envelope' },
      { label: 'الرقم المدني', value: user.civilId || 'غير محدد', icon: 'fas fa-id-card' },
      { label: 'رقم الجواز', value: user.passportNumber || 'غير محدد', icon: 'fas fa-passport' },
      { label: 'تاريخ الميلاد', value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('ar-SA') : 'غير محدد', icon: 'fas fa-calendar' }
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
          <p>لم يتم التسجيل في أي دورات بعد</p>
          <a href="courses.html" class="btn btn-primary" style="margin-top: 1rem;">
            <i class="fas fa-plus"></i> تصفح الدورات
          </a>
        </div>
      `;
      return;
    }

    try {
      // Fetch course details from public endpoint
      const response = await fetch(window.config.USER_API.COURSES);
      if (!response.ok) {
        throw new Error('فشل في تحميل الدورات');
      }
      
      const allCourses = await response.json();
      
      // Filter courses that the user is enrolled in
      const enrolledCourses = allCourses.filter(course => 
        courseIds.some(id => id.toString() === course._id.toString())
      );

      if (enrolledCourses.length === 0) {
        coursesContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--dark-gray);">
            <i class="fas fa-graduation-cap" style="font-size: 3rem; color: var(--border-gray); margin-bottom: 1rem;"></i>
            <p>لم يتم العثور على الدورات المسجلة</p>
          </div>
        `;
        return;
      }

      coursesContainer.innerHTML = enrolledCourses.map(course => `
        <div class="profile-course-badge" style="background-color: ${course.color || '#0066cc'}; color: white; border-color: ${course.color || '#0066cc'};">
          <i class="fas fa-graduation-cap"></i>
          <span>${course.name}</span>
        </div>
      `).join('');

    } catch (error) {
      console.error('خطأ في تحميل الدورات:', error);
      coursesContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--accent-red);">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
          <p>خطأ في تحميل الدورات</p>
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
          <p>لا توجد شهادات مرفوعة</p>
        </div>
      `;
      return;
    }

    certificatesContainer.innerHTML = certificates.map((cert, index) => `
      <div class="profile-certificate">
        <div class="profile-certificate-image">
          ${cert.image ? `<img src="/certs/${cert.image}" alt="${cert.name}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i class="fas fa-certificate"></i>'}
        </div>
        <div class="profile-certificate-content">
          <div class="profile-certificate-name">${cert.name}</div>
          <div class="profile-certificate-date">تم الرفع في ${new Date().toLocaleDateString('ar-SA')}</div>
        </div>
      </div>
    `).join('');
  }

  function loadRecentActivity(user) {
    const activityContainer = document.getElementById('recentActivity');
    
    // Mock recent activity data
    const activities = [
      {
        type: 'course',
        title: 'تم التسجيل في دورة جديدة',
        description: 'تم التسجيل في دورة التحكيم التجاري',
        date: 'منذ يومين',
        icon: 'fas fa-graduation-cap'
      },
      {
        type: 'certificate',
        title: 'تم رفع شهادة جديدة',
        description: 'تم رفع شهادة إتمام الدورة التمهيدية',
        date: 'منذ أسبوع',
        icon: 'fas fa-certificate'
      },
      {
        type: 'profile',
        title: 'تم تحديث الملف الشخصي',
        description: 'تم تحديث معلومات الاتصال',
        date: 'منذ أسبوعين',
        icon: 'fas fa-user-edit'
      }
    ];

    activityContainer.innerHTML = activities.map(activity => `
      <div class="profile-activity-item">
        <div class="profile-activity-icon">
          <i class="${activity.icon}"></i>
        </div>
        <div class="profile-activity-content">
          <div class="profile-activity-title">${activity.title}</div>
          <div class="profile-activity-description">${activity.description}</div>
          <div class="profile-activity-date">${activity.date}</div>
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