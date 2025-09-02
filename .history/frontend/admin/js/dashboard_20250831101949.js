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
  const container = document.getElementById('usersContent');
  if (!container) {
    console.error('usersContent container not found');
    return;
  }
  
  fetch(`${apiBase}/users`, { headers })
    .then(handleResponse)
    .then(users => {
      allUsers = users; // ✅ Store globally
      renderUsers(allUsers); // ✅ Call the reusable rendering function
      // Update connection status on successful API call
      updateConnectionStatus('connected');
    })
    .catch(err => {
      console.error('Error loading users:', err);
      if (container) {
        container.innerHTML = `<p style="color:red;">${err.message}</p>`;
      }
      // Update connection status on API error
      updateConnectionStatus('error');
    });
}


let currentPage = 1;
const usersPerPage = 10;

function renderUsers(users) {
  const container = document.getElementById('usersContent');
  if (!container) {
    console.error('usersContent container not found');
            return;
        }
        
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

// Removed duplicate loadCourses function - using enhanced version below

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

// Removed duplicate showCreateCourseForm function - using enhanced version below
function loadStats() {
  const statsContainer = document.getElementById('adminStats');
  if (!statsContainer) {
    console.error('adminStats container not found');
    return;
  }
  
  fetch(`${apiBase}/stats`, { headers })
    .then(handleResponse)
    .then(stats => {
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="stat-card">👥 Users: <strong>${stats.users}</strong></div>
          <div class="stat-card">📘 Courses: <strong>${stats.courses}</strong></div>
          <div class="stat-card">📝 Forms: <strong>${stats.forms}</strong></div>
          <div class="stat-card">🎓 Certificates: <strong>${stats.certificates}</strong></div>
        `;
      }
      // Update connection status on successful API call
      updateConnectionStatus('connected');
    })
    .catch(err => {
      console.error('Stats error:', err.message);
      if (statsContainer) {
        statsContainer.innerHTML = `<p style="color:red;">Error loading stats: ${err.message}</p>`;
      }
      // Update connection status on API error
      updateConnectionStatus('error');
    });
}
// Removed duplicate showEditCourseForm function - using enhanced version below
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
  
  console.log('Initializing tab system...');
  console.log('Found nav items:', navItems.length);
  console.log('Found tab contents:', tabContents.length);
  
  navItems.forEach((item, index) => {
    const targetTab = item.getAttribute('data-tab');
    console.log(`Nav item ${index}: ${targetTab}`);
    
    item.addEventListener('click', () => {
      console.log(`Tab clicked: ${targetTab}`);
      
      // Remove active class from all nav items and tab contents
      navItems.forEach(nav => nav.classList.remove('active'));
      tabContents.forEach(tab => tab.classList.remove('active'));
      
      // Add active class to clicked nav item and corresponding tab
      item.classList.add('active');
      const targetTabContent = document.getElementById(targetTab);
      if (targetTabContent) {
        targetTabContent.classList.add('active');
        console.log(`Tab content activated: ${targetTab}`);
            } else {
        console.warn(`Tab content not found: ${targetTab}`);
      }
      
      // Load content based on tab
      switch(targetTab) {
        case 'dashboard':
          console.log('Loading dashboard content...');
          loadDashboardContent();
          break;
        case 'users':
          console.log('Loading users...');
          loadUsers();
          break;
        case 'courses':
          console.log('Loading courses...');
          loadCourses();
          break;

        case 'stats':
          console.log('Loading stats...');
          loadStats();
          break;
        case 'forms':
          console.log('Loading forms...');
          loadForms();
          break;
        case 'recorded-lectures':
          console.log('Loading recorded lectures...');
          loadRecordedLectures();
          // Force scrolling to work for this tab
          setTimeout(forceScrolling, 100);
          break;
          
        case 'analytics':
          console.log('Loading analytics...');
          loadAnalytics();
          // Set up real-time updates
          startAnalyticsUpdates();
          break;
        default:
          console.warn(`Unknown tab: ${targetTab}`);
      }
    });
  });
  
  console.log('Tab system initialized successfully');
}

function loadDashboardContent() {
  // Dashboard content is already loaded in HTML
  // Just ensure stats are loaded
  loadStats();
}

// Ensure DOM is fully loaded before initializing
function initializeDashboard() {
  // Check if all required elements exist
  const requiredElements = [
    'adminContent',
    'usersContent', 
    'coursesContent',
    'formsContent',
    'adminStats'
  ];
  
  const missingElements = requiredElements.filter(id => !document.getElementById(id));
  
  if (missingElements.length > 0) {
    console.error('Missing required elements:', missingElements);
    // Wait a bit more and try again
    setTimeout(initializeDashboard, 100);
    return;
  }
  
  console.log('Dashboard initialized successfully');
  console.log('All required elements found:', requiredElements);
  
  try {
    initializeTabSystem();
    loadUsers();
    startConnectionMonitoring(); // Start connection monitoring
    console.log('Dashboard functions initialized successfully');
    } catch (error) {
    console.error('Error initializing dashboard functions:', error);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Give a small delay to ensure all elements are rendered
  setTimeout(initializeDashboard, 50);
});
// Content editing functionality removed

// Content editing functionality removed

// Connection Status Management
function updateConnectionStatus(status, message = '') {
  const statusElement = document.getElementById('connectionStatus');
  if (!statusElement) return;
  
  // Remove all status classes
  statusElement.className = 'connection-status';
  
  // Add appropriate status class and update content
  switch (status) {
    case 'connected':
      statusElement.className = 'connection-status status-connected';
      statusElement.innerHTML = '🟢 Connected';
      break;
    case 'connecting':
      statusElement.className = 'connection-status status-connecting';
      statusElement.innerHTML = '🟡 Connecting...';
      break;
    case 'reconnecting':
      statusElement.className = 'connection-status status-reconnecting';
      statusElement.innerHTML = '🟡 Reconnecting...';
      break;
    case 'error':
      statusElement.className = 'connection-status status-error';
      statusElement.innerHTML = '🔴 Connection Error';
      break;
    case 'disconnected':
      statusElement.className = 'connection-status status-disconnected';
      statusElement.innerHTML = '⚫ Disconnected';
      break;
    default:
      statusElement.className = 'connection-status status-connecting';
      statusElement.innerHTML = '🟡 Connecting...';
  }
}

async function testConnection() {
  try {
    updateConnectionStatus('connecting');
    
    const response = await fetch(`${apiBase}/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (response.ok) {
      updateConnectionStatus('connected');
      return true;
        } else {
      updateConnectionStatus('error');
      return false;
    }
    } catch (error) {
    console.error('Connection test failed:', error);
    updateConnectionStatus('error');
    return false;
  }
}

function startConnectionMonitoring() {
  // Test connection immediately
  testConnection();
  
  // Set up periodic connection monitoring (every 30 seconds)
  setInterval(async () => {
    const isConnected = await testConnection();
    
    // If connection failed, try to reconnect
    if (!isConnected) {
      updateConnectionStatus('reconnecting');
      setTimeout(() => {
        testConnection();
      }, 2000); // Wait 2 seconds before retry
    }
  }, 30000); // Check every 30 seconds
}

// Manual connection test function (can be called from console or other functions)
function manualConnectionTest() {
  console.log('Manual connection test initiated...');
  testConnection();
}

// Make connection functions available globally for debugging
window.testConnection = testConnection;
window.updateConnectionStatus = updateConnectionStatus;
window.manualConnectionTest = manualConnectionTest;

// Force scrolling to work
function forceScrolling() {
  // Reset any CSS that might be blocking scroll
  document.body.style.overflow = 'visible';
  document.body.style.height = 'auto';
  document.body.style.minHeight = '100vh';
  document.body.style.maxHeight = 'none';
  
  // Reset main content area
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.overflow = 'visible';
    mainContent.style.height = 'auto';
    mainContent.style.minHeight = '100vh';
    mainContent.style.maxHeight = 'none';
  }
  
  // Reset content area
  const contentArea = document.querySelector('.content-area');
  if (contentArea) {
    contentArea.style.overflow = 'visible';
    contentArea.style.height = 'auto';
    contentArea.style.minHeight = 'auto';
    contentArea.style.maxHeight = 'none';
  }
  
  // Reset recorded lectures tab
  const recordedLecturesTab = document.getElementById('recorded-lectures');
  if (recordedLecturesTab) {
    recordedLecturesTab.style.overflow = 'visible';
    recordedLecturesTab.style.height = 'auto';
    recordedLecturesTab.style.minHeight = 'auto';
    recordedLecturesTab.style.maxHeight = 'none';
    recordedLecturesTab.style.position = 'relative';
  }
  
  console.log('Scrolling forced to work');
}

// Make it available globally
window.forceScrolling = forceScrolling;

// Recorded Lectures Functions
function showCreateLectureForm() {
  const container = document.getElementById('recordedLecturesContent');
  if (!container) {
    console.error('recordedLecturesContent container not found');
    return;
  }
  
  container.innerHTML = `
    <div class="lecture-form-container">
      <h2><i class="fas fa-plus"></i> Create New Lecture</h2>
      
      <form id="createLectureForm">
        <div class="form-row">
          <div class="form-group">
            <label for="lectureTitle">Lecture Title *</label>
            <input type="text" id="lectureTitle" required placeholder="Enter lecture title" />
          </div>
          <div class="form-group">
            <label for="lectureCategory">Category</label>
            <select id="lectureCategory">
              <option value="">Select Category</option>
              <option value="Arbitration">Arbitration</option>
              <option value="Mediation">Mediation</option>
              <option value="Legal Procedures">Legal Procedures</option>
              <option value="Contract Law">Contract Law</option>
              <option value="Corporate Law">Corporate Law</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>
        
        <div class="form-row full-width">
          <div class="form-group">
            <label for="lectureDescription">Description</label>
            <textarea id="lectureDescription" placeholder="Enter a detailed description of the lecture content..." rows="4"></textarea>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="lectureQuality">Video Quality</label>
            <select id="lectureQuality">
              <option value="720p">720p HD</option>
              <option value="1080p" selected>1080p Full HD</option>
              <option value="4K">4K Ultra HD</option>
            </select>
          </div>
          <div class="form-group">
            <label for="lecturePublic">Public Access</label>
            <select id="lecturePublic">
              <option value="false">Private (Admin Only)</option>
              <option value="true">Public (All Users)</option>
            </select>
          </div>
        </div>
        
        <div class="form-row full-width">
          <div class="form-group">
            <label for="lectureVideo">Video File *</label>
            <div class="file-upload-area" id="fileUploadArea">
              <div class="file-upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
              </div>
              <div class="file-upload-text">Click to select or drag & drop video file</div>
              <div class="file-upload-hint">Supports: MP4, AVI, MOV, WMV (Max: 500MB)</div>
              <input type="file" id="lectureVideo" accept="video/*" required style="display: none;" />
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn-cancel" onclick="loadRecordedLectures()">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button type="submit" class="btn-submit">
            <i class="fas fa-plus"></i> Create Lecture
          </button>
        </div>
      </form>
    </div>
  `;
  
  // Add file upload functionality
  setupFileUpload();
  
  // Add form submission handler
  setupFormSubmission();
}

  }

// Setup file upload functionality
function setupFileUpload() {
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileInput = document.getElementById('lectureVideo');
  
  if (!fileUploadArea || !fileInput) return;
  
  // Click to select file
  fileUploadArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  // File selected
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      updateFileUploadDisplay(file);
    }
  });
  
  // Drag and drop
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
  });
  
  fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('dragover');
  });
  
  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      updateFileUploadDisplay(files[0]);
    }
  });
}

// Update file upload display
function updateFileUploadDisplay(file) {
  const fileUploadArea = document.getElementById('fileUploadArea');
  if (!fileUploadArea) return;
  
  const fileSize = (file.size / (1024 * 1024)).toFixed(2);
  
  fileUploadArea.innerHTML = `
    <div class="file-upload-icon">
      <i class="fas fa-check-circle" style="color: #28a745;"></i>
    </div>
    <div class="file-upload-text">${file.name}</div>
    <div class="file-upload-hint">Size: ${fileSize} MB</div>
    <button type="button" class="btn-cancel" onclick="resetFileUpload()" style="margin-top: 1rem;">
      <i class="fas fa-times"></i> Remove File
    </button>
  `;
}

// Reset file upload
function resetFileUpload() {
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileInput = document.getElementById('lectureVideo');
  
  if (!fileUploadArea || !fileInput) return;
  
  fileInput.value = '';
  fileUploadArea.innerHTML = `
    <div class="file-upload-icon">
      <i class="fas fa-cloud-upload-alt"></i>
    </div>
    <div class="file-upload-text">Click to select or drag & drop video file</div>
    <div class="file-upload-hint">Supports: MP4, AVI, MOV, WMV (Max: 500MB)</div>
  `;
}

// Setup form submission
function setupFormSubmission() {
  const form = document.getElementById('createLectureForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('lectureTitle').value.trim();
    const description = document.getElementById('lectureDescription').value.trim();
    const category = document.getElementById('lectureCategory').value;
    const quality = document.getElementById('lectureQuality').value;
    const isPublic = document.getElementById('lecturePublic').value === 'true';
    const videoFile = document.getElementById('lectureVideo').files[0];
    
    if (!title) {
      alert('Please enter a lecture title');
      return;
    }
    
    if (!videoFile) {
      alert('Please select a video file');
      return;
    }
    
    try {
      // Step 1: Create lecture metadata
      const lectureData = {
        title: title,
        description: description,
        category: category,
        quality: quality,
        isPublic: isPublic,
        duration: 0
      };
      
      const createResponse = await fetch(`${apiBase}/lectures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lectureData)
      });
      
      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.message || 'Failed to create lecture');
      }
      
      const newLecture = await createResponse.json();
      console.log('Lecture created:', newLecture);
      
      // Step 2: Upload video file
      if (videoFile) {
        const videoFormData = new FormData();
        videoFormData.append('video', videoFile);
        
        const uploadResponse = await fetch(`${apiBase}/lectures/${newLecture._id}/video`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: videoFormData
        });
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(`Video upload failed: ${error.message}`);
        }
        
        console.log('Video uploaded successfully');
      }
      
      alert('Lecture created and video uploaded successfully!');
      loadRecordedLectures(); // Refresh the list
      
    } catch (error) {
      console.error('Error creating lecture:', error);
      alert(`Error: ${error.message}`);
    }
  });
}
}

async function loadRecordedLectures() {
  const container = document.getElementById('recordedLecturesContent');
  if (!container) {
    console.error('recordedLecturesContent container not found');
    return;
  }
  
  container.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <h3>Loading Lectures...</h3>
      <p>Please wait while we fetch your recorded lectures.</p>
    </div>
  `;
  
  try {
    const response = await fetch(`${apiBase}/lectures`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (response.ok) {
      const lectures = await response.json();
      console.log('API Response received:', lectures);
      console.log('Response type:', typeof lectures);
      console.log('Is Array?', Array.isArray(lectures));
      
      displayLecturesList(lectures);
      // Update connection status on successful API call
      updateConnectionStatus('connected');
    } else {
      const errorData = await response.json().catch(() => null);
      console.error('API Error Response:', errorData);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorData?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error loading lectures:', error);
    const lecturesList = document.getElementById('lecturesList');
    if (lecturesList) {
      lecturesList.innerHTML = `
        <div style="color: #dc3545; padding: 15px; background: #f8d7da; border-radius: 6px;">
          <i class="fas fa-exclamation-circle"></i> Error loading lectures: ${error.message}
        </div>
      `;
    }
    // Update connection status on API error
    updateConnectionStatus('error');
  }
}

function displayLecturesList(lectures) {
  const container = document.getElementById('recordedLecturesContent');
  if (!container) return;
  
  // Debug logging to see what we received
  console.log('displayLecturesList called with:', lectures);
  console.log('Type of lectures:', typeof lectures);
  console.log('Is Array?', Array.isArray(lectures));
  
  // Validate that lectures is an array
  if (!Array.isArray(lectures)) {
    console.error('Invalid lectures data received:', lectures);
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Data Error</h3>
        <p>Expected array but received ${typeof lectures}.</p>
        <p><strong>Value:</strong> ${JSON.stringify(lectures, null, 2)}</p>
        <button onclick="loadRecordedLectures()" class="btn-submit">
          <i class="fas fa-refresh"></i> Retry
        </button>
      </div>
    `;
    return;
  }
  
  if (lectures.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-video-camera"></i>
        <h3>No Lectures Found</h3>
        <p>You haven't created any recorded lectures yet.</p>
        <button onclick="showCreateLectureForm()" class="action-btn primary">
          <i class="fas fa-plus"></i> Create Your First Lecture
        </button>
      </div>
    `;
    return;
  }
  
  // Update lecture count
  const lectureCountElement = document.getElementById('lectureCountNumber');
  if (lectureCountElement) {
    lectureCountElement.textContent = lectures.length;
  }
  
  container.innerHTML = `
    <div class="lectures-grid">
      ${lectures.map(lecture => `
        <div class="lecture-card">
          <div class="lecture-header">
            <h3>${lecture.title}</h3>
          </div>
          <div class="lecture-body">
            <p class="lecture-description">${lecture.description || 'No description available'}</p>
            <div class="lecture-meta">
              <span class="lecture-category">${lecture.category || 'General'}</span>
              <span class="lecture-quality">${lecture.quality || '1080p'}</span>
            </div>
            <div class="lecture-actions">
              <button onclick="editLecture('${lecture._id}')" class="btn-edit">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button onclick="deleteLecture('${lecture._id}')" class="btn-delete">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function testRecordedLecturesAPI() {
  const statusText = document.getElementById('statusText');
  if (!statusText) {
    console.error('statusText element not found');
        return;
    }
    
  statusText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing API...';
  
  setTimeout(() => {
    if (statusText) {
      statusText.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745;"></i> API test completed successfully!';
    }
  }, 2000);
}

// Lecture Popup Functions
function closeLecturePopup() {
  const popup = document.getElementById('lecturePopup');
  if (popup) {
    popup.style.display = 'none';
  }
}

async function downloadLecture(lectureId) {
  try {
    const response = await fetch(`${apiBase}/lectures/${lectureId}/download`, {
        headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lecture-${lectureId}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      const error = await response.json();
      alert(`Download failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Error downloading lecture:', error);
    alert('Error downloading lecture. Please try again.');
  }
}

function shareLecture(lectureId, title) {
  const shareData = {
    title: title || 'Check out this lecture',
    text: 'I found this interesting lecture on Distinguished Union Institute',
    url: `${window.location.origin}/en/recorded-lectures.html?lecture=${lectureId}`
  };
  
  if (navigator.share && navigator.canShare(shareData)) {
    navigator.share(shareData)
      .then(() => console.log('Shared successfully'))
      .catch((error) => console.log('Error sharing:', error));
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareData.url)
      .then(() => alert('Lecture URL copied to clipboard!'))
      .catch(() => {
        // Final fallback: show URL
        prompt('Copy this URL to share:', shareData.url);
      });
  }
}

async function editLecture(lectureId) {
  try {
    // Fetch lecture data
    const response = await fetch(`${apiBase}/lectures/${lectureId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    });
    
        if (!response.ok) {
      throw new Error('Failed to fetch lecture data');
    }
    
    const lecture = await response.json();
    
    // Show edit form
    const container = document.getElementById('recordedLecturesContent');
    if (!container) return;
    
    container.innerHTML = `
      <div class="content-section">
        <div class="section-header">
          <h2><i class="fas fa-edit"></i> Edit Lecture: ${lecture.title}</h2>
                </div>
        <div class="section-body">
          <form id="editLectureForm">
                    <div class="form-group">
              <label for="editLectureTitle">Lecture Title:</label>
              <input type="text" id="editLectureTitle" value="${lecture.title}" required />
                    </div>
                    <div class="form-group">
              <label for="editLectureDescription">Description:</label>
              <textarea id="editLectureDescription">${lecture.description || ''}</textarea>
                            </div>
            <div class="form-group">
              <label for="editLectureCategory">Category:</label>
              <input type="text" id="editLectureCategory" value="${lecture.category || ''}" />
                        </div>
            <div class="form-group">
              <label for="editLectureQuality">Quality:</label>
              <select id="editLectureQuality">
                <option value="720p" ${lecture.quality === '720p' ? 'selected' : ''}>720p</option>
                <option value="1080p" ${lecture.quality === '1080p' ? 'selected' : ''}>1080p</option>
                <option value="4K" ${lecture.quality === '4K' ? 'selected' : ''}>4K</option>
              </select>
                        </div>
            <div class="form-group">
              <label for="editLecturePublic">Public Access:</label>
              <input type="checkbox" id="editLecturePublic" ${lecture.isPublic ? 'checked' : ''} />
                    </div>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
              <button type="submit" class="save-btn">Update Lecture</button>
              <button type="button" onclick="loadRecordedLectures()" class="save-btn" style="background: #6c757d;">Cancel</button>
                    </div>
          </form>
            </div>
        </div>
    `;
    
    // Handle form submission
    const form = document.getElementById('editLectureForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updateData = {
          title: document.getElementById('editLectureTitle').value,
          description: document.getElementById('editLectureDescription').value,
          category: document.getElementById('editLectureCategory').value,
          quality: document.getElementById('editLectureQuality').value,
          isPublic: document.getElementById('editLecturePublic').checked
        };
        
        try {
          const updateResponse = await fetch(`${apiBase}/lectures/${lectureId}`, {
            method: 'PUT',
        headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
          });
          
          if (updateResponse.ok) {
            alert('Lecture updated successfully!');
            loadRecordedLectures();
            } else {
            const error = await updateResponse.json();
            alert(`Failed to update lecture: ${error.message}`);
          }
        } catch (error) {
          console.error('Error updating lecture:', error);
          alert('Error updating lecture. Please try again.');
        }
    });
}

  } catch (error) {
    console.error('Error editing lecture:', error);
    alert('Error loading lecture data. Please try again.');
  }
}

async function deleteLecture(lectureId) {
  if (!confirm('Are you sure you want to delete this lecture? This action cannot be undone.')) {
        return;
    }

  try {
    const response = await fetch(`${apiBase}/lectures/${lectureId}`, {
      method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (response.ok) {
      alert('Lecture deleted successfully!');
      loadRecordedLectures(); // Refresh the list
        } else {
      const error = await response.json();
      alert(`Failed to delete lecture: ${error.message}`);
    }
    } catch (error) {
    console.error('Error deleting lecture:', error);
    alert('Error deleting lecture. Please try again.');
  }
}

async function exportLectures() {
  try {
    const response = await fetch(`${apiBase}/lectures`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (response.ok) {
      const lectures = await response.json();
      
      // Create CSV content
      const csvContent = [
        ['Title', 'Description', 'Category', 'Quality', 'Duration', 'Stream Date', 'Public Access'],
        ...lectures.map(lecture => [
          lecture.title || '',
          lecture.description || '',
          lecture.category || '',
          lecture.quality || '',
          lecture.duration ? `${Math.floor(lecture.duration / 60)}:${(lecture.duration % 60).toString().padStart(2, '0')}` : '',
          lecture.streamDate ? new Date(lecture.streamDate).toLocaleDateString() : lecture.streamDate || '',
          lecture.isPublic ? 'Yes' : 'No'
        ])
      ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `lectures-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Successfully exported ${lectures.length} lectures!`);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    } catch (error) {
    console.error('Error exporting lectures:', error);
    alert('Error exporting lectures. Please try again.');
  }
}

async function loadAnalytics() {
  try {
    const response = await fetch(`${apiBase}/analytics`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (response.ok) {
      const analytics = await response.json();
      displayAnalytics(analytics);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
    displayAnalyticsError(error.message);
  }
}

function displayAnalytics(analytics) {
  // Display lecture statistics
  const lectureStats = document.getElementById('lectureStats');
  if (lectureStats) {
    lectureStats.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total Lectures</span>
        <span class="stat-value">${analytics.data?.totalLectures || 0}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Public Lectures</span>
        <span class="stat-value">${analytics.data?.publicLectures || 0}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Private Lectures</span>
        <span class="stat-value">${analytics.data?.privateLectures || 0}</span>
      </div>
    `;
  }
  
  // Display user engagement
  const userEngagement = document.getElementById('userEngagement');
  if (userEngagement) {
    userEngagement.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total Users</span>
        <span class="stat-value">${analytics.data?.totalUsers || 0}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Courses</span>
        <span class="stat-value">${analytics.data?.totalCourses || 0}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Forms</span>
        <span class="stat-value">${analytics.data?.totalForms || 0}</span>
      </div>
    `;
  }
  
  // Display category performance
  const categoryStats = document.getElementById('categoryStats');
  if (categoryStats) {
    const categoryData = analytics.data?.categoryStats || [];
    if (categoryData.length > 0) {
      categoryStats.innerHTML = categoryData.map(cat => `
        <div class="stat-item">
          <span class="stat-label">${cat._id || 'Unknown'}</span>
          <span class="stat-value">${cat.count}</span>
        </div>
      `).join('');
    } else {
      categoryStats.innerHTML = '<p>No category data available</p>';
    }
  }
  
  // Display quality distribution
  const qualityStats = document.getElementById('qualityStats');
  if (qualityStats) {
    const qualityData = analytics.data?.qualityStats || [];
    if (qualityData.length > 0) {
      qualityStats.innerHTML = qualityData.map(qual => `
        <div class="stat-item">
          <span class="stat-label">${qual._id || 'Unknown'}</span>
          <span class="stat-value">${qual.count}</span>
        </div>
      `).join('');
    } else {
      qualityStats.innerHTML = '<p>No quality data available</p>';
    }
  }
}

function displayAnalyticsError(message) {
  const containers = ['lectureStats', 'userEngagement', 'categoryStats', 'qualityStats'];
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = `
        <div style="color: #dc3545; padding: 15px; background: #f8d7da; border-radius: 6px;">
          <i class="fas fa-exclamation-circle"></i> Error loading data: ${message}
        </div>
      `;
    }
  });
}

function startAnalyticsUpdates() {
  // Update analytics every 30 seconds
  const updateInterval = setInterval(async () => {
    const currentTab = document.querySelector('.nav-item.active')?.getAttribute('data-tab');
    if (currentTab === 'analytics') {
      await loadAnalytics();
    } else {
      clearInterval(updateInterval);
    }
  }, 30000);
  
  // Clean up interval when tab changes
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      clearInterval(updateInterval);
    });
  });
}

// Enhanced Forms Function
function loadForms() {
  const container = document.getElementById('formsContent');
  if (!container) {
    console.error('formsContent container not found');
            return;
        }
        
  container.innerHTML = '<p>Loading forms...</p>';
  
  fetch(`${apiBase}/forms`, { headers })
    .then(handleResponse)
    .then(forms => {
      if (!container) return; // Check again in case container was removed
      
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
      if (container) {
        container.innerHTML = `<p style="color:red;">${err.message}</p>`;
      }
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
  if (!container) {
    console.error('coursesContent container not found');
    return;
  }
  
  container.innerHTML = '<p>Loading courses...</p>';
  
  fetch(`${apiBase}/courses`, { headers })
    .then(handleResponse)
    .then(courses => {
      if (!container) return; // Check again in case container was removed
      
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
      if (container) {
        container.innerHTML = `<p style="color:red;">${err.message}</p>`;
      }
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

// Content editing functionality removed

// Content editing functionality removed

// Content editing functionality removed

// Enhanced Form Handling Functions
function handleCreateUserForm() {
  const form = document.getElementById('createUserForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('userName').value.trim(),
        phone: document.getElementById('userPhone').value.trim(),
        civilId: document.getElementById('userCivilId').value.trim(),
        passportNumber: document.getElementById('userPassport').value.trim(),
        dateOfBirth: document.getElementById('userDOB').value
      };
      
      if (!formData.name || !formData.phone) {
        alert('Name and phone are required fields');
        return;
    }
    
      fetch(`${apiBase}/users`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(handleResponse)
        .then(() => {
          alert('User created successfully!');
          loadUsers();
        })
        .catch(err => alert(err.message));
    });
  }
}

function handleCreateCourseForm() {
  const form = document.getElementById('createCourseForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('courseName').value.trim(),
        description: document.getElementById('courseDescription').value.trim(),
        duration: document.getElementById('courseDuration').value.trim()
      };
      
      if (!formData.name) {
        alert('Course name is required');
        return;
      }
      
      fetch(`${apiBase}/courses`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(handleResponse)
        .then(() => {
          alert('Course created successfully!');
          loadCourses();
        })
        .catch(err => alert(err.message));
    });
  }
}

function handleEditUserForm() {
  const form = document.getElementById('editUserForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('editUserName').value.trim(),
        phone: document.getElementById('editUserPhone').value.trim(),
        civilId: document.getElementById('editUserCivilId').value.trim(),
        passportNumber: document.getElementById('editUserPassport').value.trim(),
        dateOfBirth: document.getElementById('editUserDOB').value
      };
      
      if (!formData.name || !formData.phone) {
        alert('Name and phone are required fields');
        return;
      }
      
      // Get user ID from the form or context
      const userId = form.getAttribute('data-user-id');
      if (!userId) {
        alert('User ID not found');
        return;
      }
      
      fetch(`${apiBase}/users/${userId}/info`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(handleResponse)
        .then(() => {
          alert('User updated successfully!');
          loadUsers();
        })
        .catch(err => alert(err.message));
    });
  }
}

// Initialize form handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  handleCreateUserForm();
  handleCreateCourseForm();
  handleEditUserForm();
});

// Load everything on startup
loadStats();