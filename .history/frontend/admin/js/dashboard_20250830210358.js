            const token = localStorage.getItem('adminToken');
const apiBase = 'http://localhost:3000/api/admin';
let allUsers = []; // global to store users

const headers = {
  Authorization: `Bearer ${token}`
};
document.getElementById('logoutBtn').addEventListener('click', () => {
                localStorage.removeItem('adminToken');
  window.location.href = 'login.html';
});

function handleResponse(res) {
  return res.json().then(data => {
    if (!res.ok) throw new Error(data.message || 'Error occurred');
    return data;
  });
}

function loadUsers() {
  fetch(`${apiBase}/users`, { headers })
    .then(handleResponse)
    .then(users => {
      allUsers = users; // ✅ Store globally
      renderUsers(allUsers); // ✅ Call the reusable rendering function
    })
    .catch(err => {
      document.getElementById('adminContent').innerHTML = `<p style="color:red;">${err.message}</p>`;
    });
}


let currentPage = 1;
const usersPerPage = 10;

function renderUsers(users) {
  const container = document.getElementById('adminContent');
  container.innerHTML = '<h2>Registered Users</h2>';
container.innerHTML += `
  <div class="filter-bar">
    <label>🔍 Course:
      <input type="text" id="filterCourse" placeholder="e.g. Arbitration" oninput="applyFilters()" />
    </label>
    <label>🎓 Level:
      <input type="text" id="filterLevel" placeholder="e.g. Beginner" oninput="applyFilters()" />
    </label>
    <button id="clearFiltersBtn" onclick="clearFilters()">❌ Clear Filters</button>
            </div>
        `;
  const totalPages = Math.ceil(users.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);

  if (paginatedUsers.length === 0) {
    container.innerHTML += '<p>No users found.</p>';
        return;
      }

  paginatedUsers.forEach(user => {
    const badge = user.level ? `<span class="badge">${user.level}</span>` : '';
    const certImages = Array.isArray(user.certificates) && user.certificates.length
      ? `<div class="certificates">` +
          user.certificates.map((cert, i) => `
            <div class="cert">
              <img src="/certs/${cert.image}" alt="${cert.name}" />
              <p>${cert.name} <button onclick="deleteCertificate('${user._id}', ${i})" style="color:red; font-size: 12px;">🗑</button></p>
            </div>
          `).join('') +
        `</div>`
      : '<p>No certificates</p>';

    container.innerHTML += `
      <div class="card user-card">
        <h3>${user.name || '—'} ${badge}</h3>
        <p><strong>Phone:</strong> ${user.phone}</p>
        <p><strong>Email:</strong> ${user.email || '—'}</p>
        <p><strong>Civil ID:</strong> ${user.civilId || '—'}</p>
        <p><strong>Passport:</strong> ${user.passportNumber || '—'}</p>
        <p><strong>DOB:</strong> ${user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '—'}</p>
        <p><strong>Courses:</strong> ${user.courses?.join(', ') || '—'}</p>
        <div><strong>Certificates:</strong><br>${certImages}</div>

        <div class="admin-controls">
        <button onclick="showEditUserForm('${user._id}', '${user.name || ''}', '${user.phone || ''}', '${user.civilId || ''}', '${user.passportNumber || ''}', '${user.dateOfBirth || ''}')">
  ✏️ Edit Info
                        </button>
          <label>Update Level:</label>
          <input type="text" id="level-${user._id}" placeholder="e.g. Beginner" />
          <button onclick="updateLevel('${user._id}')">Save Level</button>

          <label>Add Certificate:</label>
          <input type="text" id="certName-${user._id}" placeholder="Certificate Name" />
          <input type="file" id="certImage-${user._id}" accept="image/*" />
          <button onclick="uploadCertificate('${user._id}')">Add Certificate</button>

          <hr>
          <button onclick="deleteUser('${user._id}')" style="color:red;">Delete User</button>
        </div>

            </div>
        `;
    });

  renderPaginationControls(users.length);
}
function applyFilters() {
  const courseValue = document.getElementById('filterCourse')?.value.toLowerCase() || '';
  const levelValue = document.getElementById('filterLevel')?.value.toLowerCase() || '';

  const filtered = allUsers.filter(user => {
    const userCourses = (user.courses || []).join(', ').toLowerCase();
    const userLevel = (user.level || '').toLowerCase();

    return userCourses.includes(courseValue) && userLevel.includes(levelValue);
  });

  currentPage = 1; // Reset to first page on filter
  renderUsers(filtered);
}
function showEditUserForm(id, name, phone, civilId, passportNumber, dateOfBirth) {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <h2>Edit User Info</h2>
    <form id="editUserForm">
      <input type="text" id="editName" value="${name}" placeholder="Name" required />
      <input type="text" id="editPhone" value="${phone}" placeholder="Phone" />
      <input type="text" id="editCivilId" value="${civilId}" placeholder="Civil ID" />
      <input type="text" id="editPassport" value="${passportNumber}" placeholder="Passport Number" />
      <input type="date" id="editDOB" value="${dateOfBirth ? new Date(dateOfBirth).toISOString().split('T')[0] : ''}" />
      <button type="submit">Save Changes</button>
    </form>
  `;

  document.getElementById('editUserForm').addEventListener('submit', e => {
    e.preventDefault();
    const updatedUser = {
      name: document.getElementById('editName').value.trim(),
      phone: document.getElementById('editPhone').value.trim(),
      civilId: document.getElementById('editCivilId').value.trim(),
      passportNumber: document.getElementById('editPassport').value.trim(),
      dateOfBirth: document.getElementById('editDOB').value
    };

    fetch(`${apiBase}/users/${id}/info`, {
        method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    })
      .then(handleResponse)
      .then(() => {
        alert('User info updated!');
        loadUsers();
      })
      .catch(err => alert(err.message));
  });
}

function clearFilters() {
  document.getElementById('filterCourse').value = '';
  document.getElementById('filterLevel').value = '';
  currentPage = 1;
  renderUsers(allUsers);
}

function renderPaginationControls(totalUsers) {
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  if (totalPages <= 1) return; // No need for pagination

  const paginationDiv = document.createElement('div');
  paginationDiv.className = 'pagination';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPage) btn.classList.add('active');
    btn.onclick = () => {
      currentPage = i;
      renderUsers(allUsers);
    };
    paginationDiv.appendChild(btn);
  }

  document.getElementById('adminContent').appendChild(paginationDiv);
}

function updateLevel(userId) {
  const levelInput = document.getElementById(`level-${userId}`);
  const newLevel = levelInput.value.trim();
  if (!newLevel) return alert('Level cannot be empty.');

  fetch(`${apiBase}/users/${userId}/level`, {
        method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: newLevel })
  })
    .then(handleResponse)
    .then(() => {
      alert('Level updated');
      loadUsers();
    })
    .catch(err => alert(err.message));
}

function uploadCertificate(userId) {
  const nameInput = document.getElementById(`certName-${userId}`);
  const fileInput = document.getElementById(`certImage-${userId}`);
  const certName = nameInput.value.trim();
  const file = fileInput.files[0];

  if (!certName || !file) {
    alert('Please provide both certificate name and image.');
        return;
    }
    
    const formData = new FormData();
  formData.append('name', certName);   // ✅ backend expects this
  formData.append('image', file);      // ✅ backend expects this
    
  fetch(`${apiBase}/users/${userId}/certificate`, {
        method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // ✅ don't set Content-Type for FormData
        body: formData
    })
    .then(handleResponse)
    .then(() => {
      alert('Certificate added!');
      loadUsers();
    })
    .catch(err => alert(err.message));
}

function showCreateUserForm() {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <h2>Create New Student</h2>
    <form id="createUserForm">
      <input type="text" id="newUserName" placeholder="Full Name" required />
      <input type="text" id="newUserPhone" placeholder="Phone" required />
      <input type="text" id="newUserCivilId" placeholder="Civil ID" />
      <input type="text" id="newUserPassport" placeholder="Passport Number" />
      <input type="date" id="newUserDOB" placeholder="Date of Birth" />
      <input type="password" id="newUserPassword" placeholder="Password" required />
      <input type="text" id="newUserLevel" placeholder="Level (optional)" />
      <input type="text" id="newUserCourses" placeholder="Courses (comma-separated)" />
      <button type="submit">Create Student</button>
    </form>
  `;

  document.getElementById('createUserForm').addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById('newUserName').value.trim();
    const phone = document.getElementById('newUserPhone').value.trim();
    const civilId = document.getElementById('newUserCivilId').value.trim();
    const passportNumber = document.getElementById('newUserPassport').value.trim();
    const dateOfBirth = document.getElementById('newUserDOB').value;
    const password = document.getElementById('newUserPassword').value.trim();
    const level = document.getElementById('newUserLevel').value.trim();
    const courses = document.getElementById('newUserCourses').value.trim().split(',').map(c => c.trim()).filter(c => c);

    if (!name || !phone || !password) {
      alert('Name, phone, and password are required.');
        return;
    }

    fetch(`${apiBase}/users`, {
        method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, civilId, passportNumber, dateOfBirth, password, level, courses })
    })
      .then(handleResponse)
      .then(() => {
        alert('Student created successfully!');
        loadUsers(); // optional reload
      })
      .catch(err => alert(err.message));
  });
}

function deleteCertificate(userId, certIndex) {
  if (!confirm('Delete this certificate?')) return;

  fetch(`${apiBase}/users/${userId}/certificates/${certIndex}`, {
    method: 'DELETE',
    headers
  })
    .then(handleResponse)
    .then(() => {
      alert('Certificate deleted.');
      loadUsers();
    })
    .catch(err => alert(err.message));
}

function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;

  fetch(`${apiBase}/users/${userId}`, {
        method: 'DELETE',
    headers
  })
    .then(handleResponse)
    .then(() => {
      alert('User deleted.');
      loadUsers();
    })
    .catch(err => alert(err.message));
}

function loadForms() {
  fetch(`${apiBase}/forms`, { headers })
    .then(handleResponse)
    .then(forms => {
      const container = document.getElementById('adminContent');
      container.innerHTML = '<h2>Submitted Enrollment Forms</h2>';
      if (!Array.isArray(forms) || forms.length === 0) {
        container.innerHTML += '<p>No forms submitted yet.</p>';
        return;
    }
    
      forms.forEach(form => {
        container.innerHTML += `
          <div class="card">
            <strong>Name:</strong> ${form.name}<br>
            <strong>Phone:</strong> ${form.phone}<br>
            <strong>Course:</strong> ${form.course}
        </div>
    `;
      });
    })
    .catch(err => {
      document.getElementById('adminContent').innerHTML = `<p style="color:red;">${err.message}</p>`;
    });
}

function loadCourses() {
  fetch(`${apiBase}/courses`, { headers })
    .then(handleResponse)
    .then(courses => {
      const container = document.getElementById('adminContent');
      container.innerHTML = '<h2>All Courses</h2>';
      if (!Array.isArray(courses) || courses.length === 0) {
        container.innerHTML += '<p>No courses available.</p>';
        return;
    }
    
      courses.forEach(course => {
        container.innerHTML += `
          <div class="card">
            <strong>${course.name}</strong><br>
            ${course.description || 'No description'}<br>
            Duration: ${course.duration || '—'}<br>
            <button onclick="showEditCourseForm('${course._id}', '${course.name}', \`${course.description || ''}\`, '${course.duration || ''}')">Edit</button>
            <button onclick="deleteCourse('${course._id}')" style="color:red;">Delete</button>
                        </div>
            `;
        });
    })
    .catch(err => {
      document.getElementById('adminContent').innerHTML = `<p style="color:red;">${err.message}</p>`;
    });
}

function deleteCourse(courseId) {
  if (!confirm('Are you sure you want to delete this course?')) return;

  fetch(`${apiBase}/courses/${courseId}`, {
    method: 'DELETE',
    headers
  })
    .then(handleResponse)
    .then(() => {
      alert('Course deleted.');
      loadCourses();
    })
    .catch(err => alert(err.message));
}

// ✅ Add this directly after:
function exportUsersExcel() {
  fetch(`${apiBase}/export/users/excel`, {
        method: 'GET',
        headers: {
      Authorization: `Bearer ${token}` // ✅ explicitly include token
        }
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to download Excel');
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => alert(err.message));
}

function showCreateCourseForm() {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <h2>Create New Course</h2>
    <form id="createCourseForm">
      <input type="text" id="courseName" placeholder="Course Name" required />
      <input type="text" id="courseDescription" placeholder="Description" />
      <input type="text" id="courseDuration" placeholder="Duration (e.g. 2 months)" />
      <button type="submit">Create Course</button>
      <button onclick="showCreateUserForm()">➕ Create Student</button>
    </form>
  `;

  document.getElementById('createCourseForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('courseName').value.trim();
    const description = document.getElementById('courseDescription').value.trim();
    const duration = document.getElementById('courseDuration').value.trim();

    fetch(`${apiBase}/courses`, {
        method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, duration })
    })
      .then(handleResponse)
      .then(() => {
        alert('Course created successfully!');
        loadCourses();
      })
      .catch(err => alert(err.message));
  });
}
function loadStats() {
  fetch(`${apiBase}/stats`, { headers })
    .then(handleResponse)
    .then(stats => {
      const statsContainer = document.getElementById('adminStats');
      statsContainer.innerHTML = `
        <div class="stat-card">👥 Users: <strong>${stats.users}</strong></div>
        <div class="stat-card">📘 Courses: <strong>${stats.courses}</strong></div>
        <div class="stat-card">📝 Forms: <strong>${stats.forms}</strong></div>
        <div class="stat-card">🎓 Certificates: <strong>${stats.certificates}</strong></div>
      `;
    })
    .catch(err => {
      console.error('Stats error:', err.message);
    });
}
function showEditCourseForm(id, name, description, duration) {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <h2>Edit Course</h2>
    <form id="editCourseForm">
      <input type="text" id="editCourseName" value="${name}" placeholder="Course Name" required />
      <input type="text" id="editCourseDescription" value="${description}" placeholder="Description" />
      <input type="text" id="editCourseDuration" value="${duration}" placeholder="Duration" />
      <button type="submit">Save Changes</button>
    </form>
  `;

  document.getElementById('editCourseForm').addEventListener('submit', e => {
    e.preventDefault();
    const updatedName = document.getElementById('editCourseName').value.trim();
    const updatedDesc = document.getElementById('editCourseDescription').value.trim();
    const updatedDur = document.getElementById('editCourseDuration').value.trim();

    fetch(`${apiBase}/courses/${id}`, {
        method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: updatedName, description: updatedDesc, duration: updatedDur })
    })
      .then(handleResponse)
      .then(() => {
        alert('Course updated successfully!');
        loadCourses();
      })
      .catch(err => alert(err.message));
  });
}
function filterUsers() {
  const query = document.getElementById('searchInput').value.toLowerCase();

  const filtered = allUsers.filter(user => {
    return (
      (user.name || '').toLowerCase().includes(query) ||
      (user.phone || '').toLowerCase().includes(query) ||
      (user.civilId || '').toLowerCase().includes(query) ||
      (user.passportNumber || '').toLowerCase().includes(query) ||
      (user.courses?.join(', ') || '').toLowerCase().includes(query) ||
      (user.level || '').toLowerCase().includes(query)
    );
  });

  renderUsers(filtered);
}
// Tab switching system
function initializeTabSystem() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      
      // Remove active class from all nav items and tab contents
      navItems.forEach(nav => nav.classList.remove('active'));
      tabContents.forEach(tab => tab.classList.remove('active'));
      
      // Add active class to clicked nav item and corresponding tab
      item.classList.add('active');
      const targetTabContent = document.getElementById(targetTab);
      if (targetTabContent) {
        targetTabContent.classList.add('active');
      }
      
      // Load content based on tab
      switch(targetTab) {
        case 'dashboard':
          loadDashboardContent();
          break;
        case 'users':
          loadUsers();
          break;
        case 'courses':
          loadCourses();
          break;
        case 'content':
          loadEditorTabs();
          break;
        case 'stats':
          loadStats();
          break;
        case 'forms':
          loadForms();
          break;
        case 'recorded-lectures':
          loadRecordedLectures();
          break;
      }
    });
  });
}

function loadDashboardContent() {
  // Dashboard content is already loaded in HTML
  // Just ensure stats are loaded
  loadStats();
}

window.addEventListener('DOMContentLoaded', () => {
  initializeTabSystem();
  loadUsers();
});
function loadEditor(page, lang) {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <div class="content-section">
      <div class="section-header">
        <h2><i class="fas fa-edit"></i> Editing Content: ${page} (${lang.toUpperCase()})</h2>
      </div>
      <div class="section-body">
        <div id="editor" style="height: 400px;"></div>
        <div style="margin-top: 20px;">
          <button id="saveContentBtn" class="save-btn">
            <i class="fas fa-save"></i> Save Content
          </button>
          <button onclick="loadEditorTabs()" class="save-btn" style="background: #6c757d;">
            <i class="fas fa-arrow-left"></i> Back
          </button>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const quill = new Quill('#editor', { theme: 'snow' });

    fetch(`${apiBase}/content/${lang}/${page}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load HTML file');
        return res.text();
      })
      .then(html => {
        console.log('📄 Loaded HTML:', html);
        // Parse the HTML and extract content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const section = doc.querySelector('section.container') || doc.body;
        quill.root.innerHTML = section.innerHTML;
      })
            .catch(err => {
        container.innerHTML += `<p style="color:red;">${err.message}</p>`;
      });

    document.getElementById('saveContentBtn').addEventListener('click', () => {
      const content = quill.root.innerHTML;

      // Wrap content inside full HTML structure
      const fullHtml = `
<!DOCTYPE html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${page}</title>
  <link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  ${content}
</body>
</html>
`.trim();

      fetch(`${apiBase}/content/${lang}/${page}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: fullHtml })
      })
        .then(handleResponse)
        .then(() => alert('Page saved successfully!'))
        .catch(err => alert(err.message));
    });
  }, 100);
}

function loadEditorTabs() {
  const container = document.getElementById('adminContent');
  container.innerHTML = `<h2>📝 Content Editor</h2>`;

  ['en', 'ar'].forEach(lang => {
    fetch(`${apiBase}/pages/${lang}`, { headers })
      .then(handleResponse)
    .then(data => {
        if (!Array.isArray(data.pages)) return;
        const section = document.createElement('div');
        section.classList.add('card');
        section.innerHTML = `<h3>${lang === 'en' ? '🇬🇧 English' : '🇸🇦 Arabic'} Pages</h3>`;
        data.pages.forEach(p => {
          const btn = document.createElement('button');
          btn.textContent = `Edit ${p}`;
          btn.onclick = () => loadEditor(p, lang);
          section.appendChild(btn);
        });
        container.appendChild(section);
      })
      .catch(err => {
        container.innerHTML += `<p style="color:red;">${err.message}</p>`;
        });
    });
}

// Recorded Lectures Functions
function showCreateLectureForm() {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <div class="content-section">
      <div class="section-header">
        <h2><i class="fas fa-plus"></i> Create New Lecture</h2>
      </div>
      <div class="section-body">
        <form id="createLectureForm">
          <div class="form-group">
            <label for="lectureTitle">Lecture Title:</label>
            <input type="text" id="lectureTitle" required placeholder="Enter lecture title" />
          </div>
          <div class="form-group">
            <label for="lectureDescription">Description:</label>
            <textarea id="lectureDescription" placeholder="Enter lecture description"></textarea>
          </div>
          <div class="form-group">
            <label for="lectureVideo">Video File:</label>
            <input type="file" id="lectureVideo" accept="video/*" required />
          </div>
          <div class="form-group">
            <label for="lectureCategory">Category:</label>
            <input type="text" id="lectureCategory" placeholder="e.g., Arbitration, Mediation" />
          </div>
          <button type="submit" class="save-btn">Create Lecture</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('createLectureForm').addEventListener('submit', (e) => {
    e.preventDefault();
    // Implementation for creating lecture
    alert('Lecture creation functionality will be implemented');
  });
}

function loadRecordedLectures() {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <div class="content-section">
      <div class="section-header">
        <h2><i class="fas fa-video-camera"></i> Recorded Lectures</h2>
      </div>
      <div class="section-body">
        <p>Loading recorded lectures...</p>
        <div id="lecturesList"></div>
      </div>
    </div>
  `;
  
  // Simulate loading lectures
  setTimeout(() => {
    document.getElementById('lecturesList').innerHTML = `
      <p>No recorded lectures found. Use the "Create New Lecture" button to add lectures.</p>
    `;
  }, 1000);
}

function testRecordedLecturesAPI() {
  const statusText = document.getElementById('statusText');
  statusText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing API...';
  
  setTimeout(() => {
    statusText.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745;"></i> API test completed successfully!';
  }, 2000);
}

// Lecture Popup Functions
function closeLecturePopup() {
  const popup = document.getElementById('lecturePopup');
  if (popup) {
    popup.style.display = 'none';
  }
}

function downloadLecture() {
  alert('Download functionality will be implemented');
}

function shareLecture() {
  alert('Share functionality will be implemented');
}

function editLecture() {
  alert('Edit functionality will be implemented');
}

// Enhanced Forms Function
function loadForms() {
  const container = document.getElementById('formsContent');
  container.innerHTML = '<p>Loading forms...</p>';
  
  fetch(`${apiBase}/forms`, { headers })
    .then(handleResponse)
    .then(forms => {
      if (forms.length === 0) {
        container.innerHTML = '<p>No forms submitted yet.</p>';
        return;
      }
      
      let formsHtml = '<h3>Submitted Forms</h3>';
      forms.forEach(form => {
        formsHtml += `
          <div class="user-card">
            <h4>${form.name}</h4>
            <p><strong>Phone:</strong> ${form.phone}</p>
            <p><strong>Course:</strong> ${form.course}</p>
            <p><strong>Date:</strong> ${new Date(form.createdAt).toLocaleDateString()}</p>
          </div>
        `;
      });
      container.innerHTML = formsHtml;
    })
    .catch(err => {
      container.innerHTML = `<p style="color:red;">${err.message}</p>`;
    });
}

// Enhanced Export Function
function exportUsersExcel() {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <div class="content-section">
      <div class="section-header">
        <h2><i class="fas fa-download"></i> Export Users</h2>
      </div>
      <div class="section-body">
        <p>Exporting users to Excel...</p>
        <div id="exportStatus"></div>
      </div>
    </div>
  `;
  
  fetch(`${apiBase}/export/users/excel`, { headers })
    .then(handleResponse)
    .then(data => {
      document.getElementById('exportStatus').innerHTML = `
        <div style="color: #28a745; padding: 15px; background: #d4edda; border-radius: 6px;">
          <i class="fas fa-check-circle"></i> Export completed successfully!
          <br><br>
          <a href="${data.downloadUrl}" class="save-btn" download>
            <i class="fas fa-download"></i> Download Excel File
          </a>
        </div>
      `;
    })
    .catch(err => {
      document.getElementById('exportStatus').innerHTML = `
        <div style="color: #dc3545; padding: 15px; background: #f8d7da; border-radius: 6px;">
          <i class="fas fa-exclamation-circle"></i> Export failed: ${err.message}
        </div>
      `;
    });
}

// Enhanced User Management Functions
function showCreateUserForm() {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <div class="content-section">
      <div class="section-header">
        <h2><i class="fas fa-user-plus"></i> Create New User</h2>
      </div>
      <div class="section-body">
        <form id="createUserForm">
          <div class="form-group">
            <label for="userName">Full Name:</label>
            <input type="text" id="userName" placeholder="Enter full name" required />
          </div>
          <div class="form-group">
            <label for="userPhone">Phone Number:</label>
            <input type="tel" id="userPhone" placeholder="Enter phone number" required />
          </div>
          <div class="form-group">
            <label for="userCivilId">Civil ID:</label>
            <input type="text" id="userCivilId" placeholder="Enter civil ID (optional)" />
          </div>
          <div class="form-group">
            <label for="userPassport">Passport Number:</label>
            <input type="text" id="userPassport" placeholder="Enter passport number (optional)" />
          </div>
          <div class="form-group">
            <label for="userDOB">Date of Birth:</label>
            <input type="date" id="userDOB" />
          </div>
          <button type="submit" class="save-btn">
            <i class="fas fa-user-plus"></i> Create User
          </button>
        </form>
      </div>
    </div>
  `;
}

// Enhanced Course Management Functions
function showCreateCourseForm() {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <div class="content-section">
      <div class="section-header">
        <h2><i class="fas fa-plus"></i> Create New Course</h2>
      </div>
      <div class="section-body">
        <form id="createCourseForm">
          <div class="form-group">
            <label for="courseName">Course Name:</label>
            <input type="text" id="courseName" placeholder="Enter course name" required />
          </div>
          <div class="form-group">
            <label for="courseDescription">Description:</label>
            <textarea id="courseDescription" placeholder="Enter course description" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label for="courseDuration">Duration:</label>
            <input type="text" id="courseDuration" placeholder="e.g., 8 weeks, 40 hours" />
          </div>
          <button type="submit" class="save-btn">
            <i class="fas fa-plus"></i> Create Course
          </button>
        </form>
      </div>
    </div>
  `;
}

function deleteCourse(courseId) {
  if (confirm('Are you sure you want to delete this course?')) {
    fetch(`${apiBase}/courses/${courseId}`, {
      method: 'DELETE',
      headers
    })
      .then(handleResponse)
      .then(() => {
        alert('Course deleted successfully!');
        loadCourses();
      })
      .catch(err => alert(err.message));
  }
}

// Enhanced User Operation Functions
function showEditUserForm(id, name, phone, civilId, passportNumber, dateOfBirth) {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <div class="content-section">
      <div class="section-header">
        <h2><i class="fas fa-edit"></i> Edit User</h2>
      </div>
      <div class="section-body">
        <form id="editUserForm">
          <div class="form-group">
            <label for="editUserName">Full Name:</label>
            <input type="text" id="editUserName" value="${name || ''}" placeholder="Enter full name" required />
          </div>
          <div class="form-group">
            <label for="editUserPhone">Phone Number:</label>
            <input type="tel" id="editUserPhone" value="${phone || ''}" placeholder="Enter phone number" required />
          </div>
          <div class="form-group">
            <label for="editUserCivilId">Civil ID:</label>
            <input type="text" id="editUserCivilId" value="${civilId || ''}" placeholder="Enter civil ID" />
          </div>
          <div class="form-group">
            <label for="editUserPassport">Passport Number:</label>
            <input type="text" id="editUserPassport" value="${passportNumber || ''}" placeholder="Enter passport number" />
          </div>
          <div class="form-group">
            <label for="editUserDOB">Date of Birth:</label>
            <input type="date" id="editUserDOB" value="${dateOfBirth || ''}" />
          </div>
          <button type="submit" class="save-btn">
            <i class="fas fa-save"></i> Save Changes
          </button>
        </form>
      </div>
    </div>
  `;
}

function updateLevel(userId) {
  const levelInput = document.getElementById(`level-${userId}`);
  const level = levelInput.value.trim();
  
  if (!level) {
    alert('Please enter a level');
    return;
  }
  
  fetch(`${apiBase}/users/${userId}/level`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ level })
  })
    .then(handleResponse)
    .then(() => {
      alert('Level updated successfully!');
      levelInput.value = '';
      loadUsers(); // Refresh the user list
    })
    .catch(err => alert(err.message));
}

function uploadCertificate(userId) {
  const certNameInput = document.getElementById(`certName-${userId}`);
  const certImageInput = document.getElementById(`certImage-${userId}`);
  
  const certName = certNameInput.value.trim();
  const certImage = certImageInput.files[0];
  
  if (!certName || !certImage) {
    alert('Please provide both certificate name and image');
    return;
  }
  
  const formData = new FormData();
  formData.append('name', certName);
  formData.append('image', certImage);
  
  fetch(`${apiBase}/users/${userId}/certificate`, {
    method: 'POST',
    headers: {
      Authorization: headers.Authorization
    },
    body: formData
  })
    .then(handleResponse)
    .then(() => {
      alert('Certificate uploaded successfully!');
      certNameInput.value = '';
      certImageInput.value = '';
      loadUsers(); // Refresh the user list
    })
    .catch(err => alert(err.message));
}

function deleteCertificate(userId, certIndex) {
  if (confirm('Are you sure you want to delete this certificate?')) {
    fetch(`${apiBase}/users/${userId}/certificates/${certIndex}`, {
      method: 'DELETE',
      headers
    })
      .then(handleResponse)
      .then(() => {
        alert('Certificate deleted successfully!');
        loadUsers(); // Refresh the user list
      })
      .catch(err => alert(err.message));
  }
}

function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    fetch(`${apiBase}/users/${userId}`, {
      method: 'DELETE',
      headers
    })
      .then(handleResponse)
      .then(() => {
        alert('User deleted successfully!');
        loadUsers(); // Refresh the user list
      })
      .catch(err => alert(err.message));
  }
}

// Enhanced Filtering and Search Functions
function applyFilters() {
  const courseFilter = document.getElementById('filterCourse').value.toLowerCase();
  const levelFilter = document.getElementById('filterLevel').value.toLowerCase();
  
  const filtered = allUsers.filter(user => {
    const courseMatch = !courseFilter || (user.courses && user.courses.some(course => 
      course.toLowerCase().includes(courseFilter)
    ));
    const levelMatch = !levelFilter || (user.level && user.level.toLowerCase().includes(levelFilter));
    
    return courseMatch && levelMatch;
  });
  
  renderUsers(filtered);
}

function clearFilters() {
  document.getElementById('filterCourse').value = '';
  document.getElementById('filterLevel').value = '';
  renderUsers(allUsers);
}

function filterUsers() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  
  const filtered = allUsers.filter(user => {
    return (
      (user.name || '').toLowerCase().includes(query) ||
      (user.phone || '').toLowerCase().includes(query) ||
      (user.civilId || '').toLowerCase().includes(query) ||
      (user.passportNumber || '').toLowerCase().includes(query) ||
      (user.courses?.join(', ') || '').toLowerCase().includes(query) ||
      (user.level || '').toLowerCase().includes(query)
    );
  });
  
  renderUsers(filtered);
}

// Enhanced Course Management Functions
function loadCourses() {
  const container = document.getElementById('coursesContent');
  container.innerHTML = '<p>Loading courses...</p>';
  
  fetch(`${apiBase}/courses`, { headers })
    .then(handleResponse)
    .then(courses => {
      if (courses.length === 0) {
        container.innerHTML = '<p>No courses found. Create your first course!</p>';
        return;
      }
      
      let coursesHtml = '<h3>Available Courses</h3>';
      courses.forEach(course => {
        coursesHtml += `
          <div class="user-card">
            <h4>${course.name}</h4>
            <p><strong>Description:</strong> ${course.description || 'No description'}</p>
            <p><strong>Duration:</strong> ${course.duration || 'Not specified'}</p>
            <div class="admin-controls">
              <button onclick="showEditCourseForm('${course._id}', '${course.name}', \`${course.description || ''}\`, '${course.duration || ''}')" class="save-btn">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button onclick="deleteCourse('${course._id}')" class="save-btn" style="background: #dc3545;">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        `;
      });
      container.innerHTML = coursesHtml;
    })
    .catch(err => {
      container.innerHTML = `<p style="color:red;">${err.message}</p>`;
    });
}

function showEditCourseForm(id, name, description, duration) {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <div class="content-section">
      <div class="section-header">
        <h2><i class="fas fa-edit"></i> Edit Course</h2>
      </div>
      <div class="section-body">
        <form id="editCourseForm">
          <div class="form-group">
            <label for="editCourseName">Course Name:</label>
            <input type="text" id="editCourseName" value="${name}" placeholder="Course Name" required />
          </div>
          <div class="form-group">
            <label for="editCourseDescription">Description:</label>
            <textarea id="editCourseDescription" placeholder="Description" rows="4">${description || ''}</textarea>
          </div>
          <div class="form-group">
            <label for="editCourseDuration">Duration:</label>
            <input type="text" id="editCourseDuration" value="${duration || ''}" placeholder="Duration" />
          </div>
          <button type="submit" class="save-btn">
            <i class="fas fa-save"></i> Save Changes
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('editCourseForm').addEventListener('submit', e => {
    e.preventDefault();
    const updatedName = document.getElementById('editCourseName').value.trim();
    const updatedDesc = document.getElementById('editCourseDescription').value.trim();
    const updatedDur = document.getElementById('editCourseDuration').value.trim();

    fetch(`${apiBase}/courses/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: updatedName, description: updatedDesc, duration: updatedDur })
    })
      .then(handleResponse)
      .then(() => {
        alert('Course updated successfully!');
        loadCourses();
      })
      .catch(err => alert(err.message));
  });
}

// Enhanced Content Management Functions
function loadEditorTabs() {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <div class="content-section">
      <div class="section-header">
        <h2><i class="fas fa-edit"></i> Content Editor</h2>
      </div>
      <div class="section-body">
        <div class="editor-controls">
          <div>
            <label for="contentLang">Language:</label>
            <select id="contentLang">
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
          <div>
            <label for="contentPage">Page:</label>
            <select id="contentPage">
              <option value="index">Home (index)</option>
              <option value="about">About</option>
              <option value="contact">Contact</option>
            </select>
          </div>
        </div>
        <div class="editor-body">
          <div id="quillEditor"></div>
          <button id="saveContentBtn" class="save-btn">
            <i class="fas fa-save"></i> Save Content
          </button>
          <div id="contentSaveStatus" class="margin-top-15"></div>
        </div>
      </div>
    </div>
  `;

  // Initialize Quill editor
  setTimeout(() => {
    if (typeof Quill !== 'undefined') {
      const quill = new Quill('#quillEditor', { theme: 'snow' });
      
      // Load content when page/language changes
      document.getElementById('contentLang').addEventListener('change', loadContent);
      document.getElementById('contentPage').addEventListener('change', loadContent);
      
      // Load initial content
      loadContent();
      
      // Save content button
      document.getElementById('saveContentBtn').addEventListener('click', () => {
        const content = quill.root.innerHTML;
        const lang = document.getElementById('contentLang').value;
        const page = document.getElementById('contentPage').value;
        
        saveContent(lang, page, content);
      });
    } else {
      container.innerHTML += `
        <div style="color: #dc3545; padding: 15px; background: #f8d7da; border-radius: 6px;">
          <i class="fas fa-exclamation-circle"></i> Quill editor not loaded. Please check your internet connection.
        </div>
      `;
    }
  }, 100);
}

function loadContent() {
  const lang = document.getElementById('contentLang').value;
  const page = document.getElementById('contentPage').value;
  
  fetch(`${apiBase}/content/${lang}/${page}`, { headers })
    .then(res => {
      if (!res.ok) throw new Error('Failed to load HTML file');
      return res.text();
    })
    .then(html => {
      if (typeof Quill !== 'undefined') {
        const quill = Quill.find(document.getElementById('quillEditor'));
        if (quill) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const section = doc.querySelector('section.container') || doc.body;
          quill.root.innerHTML = section.innerHTML;
        }
      }
    })
    .catch(err => {
      document.getElementById('contentSaveStatus').innerHTML = `
        <div style="color: #dc3545; padding: 15px; background: #f8d7da; border-radius: 6px;">
          <i class="fas fa-exclamation-circle"></i> ${err.message}
        </div>
      `;
    });
}

function saveContent(lang, page, content) {
  const statusDiv = document.getElementById('contentSaveStatus');
  statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving content...';
  
  // Wrap content inside full HTML structure
  const fullHtml = `
<!DOCTYPE html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${page}</title>
  <link rel="stylesheet" href="/css/style.css" />
</head>
<body>
  ${content}
</body>
</html>
`.trim();

  fetch(`${apiBase}/content/${lang}/${page}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: fullHtml })
  })
    .then(handleResponse)
    .then(() => {
      statusDiv.innerHTML = `
        <div style="color: #28a745; padding: 15px; background: #d4edda; border-radius: 6px;">
          <i class="fas fa-check-circle"></i> Content saved successfully!
        </div>
      `;
    })
    .catch(err => {
      statusDiv.innerHTML = `
        <div style="color: #dc3545; padding: 15px; background: #f8d7da; border-radius: 6px;">
          <i class="fas fa-exclamation-circle"></i> Save failed: ${err.message}
        </div>
      `;
    });
}

// Load everything on startup
loadStats();