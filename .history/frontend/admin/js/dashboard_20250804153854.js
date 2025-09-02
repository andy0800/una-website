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
window.addEventListener('DOMContentLoaded', () => {
  loadUsers();
});
function loadEditor(page, lang) {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <h2>Editing Content: ${page} (${lang.toUpperCase()})</h2>
    <div id="editor" style="height: 400px;"></div>
    <button id="saveContentBtn">💾 Save Content</button>
    <button onclick="loadEditorTabs()">← Back</button>
  `;

  setTimeout(() => {
    const quill = new Quill('#editor', { theme: 'snow' });

    fetch(`${apiBase}/content/${lang}/${page}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load HTML file');
        return res.text();
      })
      .then(html => {
  console.log('📄 Loaded HTML:', html); // Add this
  //         const doc = new DOMParser().parseFromString(html, 'text/html');
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
// ===== ADMIN LIVE STREAM LOGIC =====
const startLiveBtn = document.getElementById('startLiveBtn');
const endLiveBtn = document.getElementById('endLiveBtn');
const localVideo = document.getElementById('localVideo');
const micRequestList = document.getElementById('micRequestList');
const adminMessages = document.getElementById('adminMessages');
const adminChatInput = document.getElementById('adminChatInput');
const sendAdminChat = document.getElementById('sendAdminChat');
const streamStatus = document.getElementById('streamStatus');
const viewerCount = document.getElementById('viewerCount');

const socket = io(window.location.origin);
let adminStream = null;
const adminPCs = {};
let viewerCountNum = 0;
let userMicPCs = {}; // Store peer connections for user mic streams

// Tab functionality
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    const tabName = button.getAttribute('data-tab');
    showTab(tabName);
  });
});

function showTab(tabName) {
  // Hide all content sections
  document.getElementById('adminContent').style.display = 'none';
  document.getElementById('contentEditorSection').style.display = 'none';
  document.getElementById('livestreamTab').style.display = 'none';
  
  // Show selected tab
  if (tabName === 'livestreamTab') {
    document.getElementById('livestreamTab').style.display = 'block';
  } else {
    document.getElementById('adminContent').style.display = 'block';
  }
}

// Start live streaming
startLiveBtn.addEventListener('click', async () => {
  try {
    console.log('🎥 Starting live stream...');
    
    // Get screen capture with audio
    adminStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'monitor'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    });

    // Display local preview
    localVideo.srcObject = adminStream;
    
    // Update stream status
    streamStatus.textContent = 'LIVE';
    streamStatus.style.background = 'rgba(220, 53, 69, 0.9)';
    
    // Notify server that stream has started
    socket.emit('admin-start');
    
    // Update UI
    startLiveBtn.disabled = true;
    endLiveBtn.disabled = false;
    
    console.log('✅ Live stream started successfully');
    
    // Handle stream end
    adminStream.getVideoTracks()[0].onended = () => {
      console.log('🛑 Stream ended by user');
      endLiveBtn.click();
    };
    
  } catch (error) {
    console.error('❌ Error starting stream:', error);
    alert('Failed to start stream: ' + error.message);
  }
});

// End live streaming
endLiveBtn.addEventListener('click', () => {
  console.log('⏹️ Stopping live stream...');
  
  // Notify server
  socket.emit('admin-end');
  
  // Close all peer connections
  Object.values(adminPCs).forEach(pc => {
    if (pc) pc.close();
  });
  adminPCs = {};
  
  // Stop all tracks
  if (adminStream) {
    adminStream.getTracks().forEach(track => track.stop());
    adminStream = null;
  }
  
  // Clear video
  localVideo.srcObject = null;
  
  // Update stream status
  streamStatus.textContent = 'OFFLINE';
  streamStatus.style.background = 'rgba(0,0,0,0.7)';
  
  // Reset viewer count
  viewerCountNum = 0;
  updateViewerCount();
  
  // Clear mic requests
  micRequestList.innerHTML = '';
  
  // Update UI
  startLiveBtn.disabled = false;
  endLiveBtn.disabled = true;
  
  console.log('✅ Live stream stopped');
});

// Viewer joined → create peer connection for them
socket.on('viewer-join', async (data) => {
  const watcherId = data.socketId || data; // Handle both new and old format
  const userInfo = data.userInfo;
  
  console.log('👤 Viewer joined:', watcherId, 'User:', userInfo?.name || 'Anonymous');
  viewerCountNum++;
  updateViewerCount();
  
  if (!adminStream) {
    console.warn('⚠️ No admin stream available');
    return;
  }
  
  try {
    // Create new peer connection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    adminPCs[watcherId] = pc;
    
    // Add all tracks to this peer
    adminStream.getTracks().forEach(track => {
      pc.addTrack(track, adminStream);
    });
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          target: watcherId,
          candidate: event.candidate
        });
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state with ${watcherId}:`, pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log(`✅ Connected to viewer ${watcherId}`);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log(`❌ Disconnected from viewer ${watcherId}`);
        delete adminPCs[watcherId];
        viewerCountNum = Math.max(0, viewerCountNum - 1);
        updateViewerCount();
      }
    };
    
    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socket.emit('offer', { 
      target: watcherId, 
      offer: offer 
    });
    
    console.log(`📤 Sent offer to viewer ${watcherId}`);
    
  } catch (error) {
    console.error('❌ Error creating peer connection:', error);
  }
});

// Handle viewer disconnection
socket.on('disconnectPeer', (socketId) => {
  if (adminPCs[socketId]) {
    delete adminPCs[socketId];
    viewerCountNum = Math.max(0, viewerCountNum - 1);
    updateViewerCount();
    console.log(`👤 Viewer ${socketId} disconnected`);
  }
});

function updateViewerCount() {
  if (viewerCount) {
    viewerCount.textContent = `${viewerCountNum} viewer${viewerCountNum !== 1 ? 's' : ''}`;
  }
}

// Receive answer from viewer
socket.on('answer', ({ socketId, answer }) => {
  // Check if it's for admin stream or user mic
  let pc = adminPCs[socketId];
  if (pc && pc.signalingState !== 'closed') {
    pc.setRemoteDescription(new RTCSessionDescription(answer))
      .then(() => console.log(`✅ Set remote description for ${socketId} (admin stream)`))
      .catch(error => console.error(`❌ Error setting remote description:`, error));
  } else {
    // Check user mic peer connections
    pc = userMicPCs[socketId];
    if (pc && pc.signalingState !== 'closed') {
      pc.setRemoteDescription(new RTCSessionDescription(answer))
        .then(() => console.log(`✅ Set remote description for ${socketId} (user mic)`))
        .catch(error => console.error(`❌ Error setting remote description:`, error));
    }
  }
});

// Handle ICE candidates from viewer
socket.on('ice-candidate', ({ socketId, candidate }) => {
  // Check if it's for admin stream or user mic
  let pc = adminPCs[socketId];
  if (pc && pc.remoteDescription) {
    pc.addIceCandidate(new RTCIceCandidate(candidate))
      .then(() => console.log(`✅ Added ICE candidate from ${socketId} (admin stream)`))
      .catch(error => console.error(`❌ Error adding ICE candidate:`, error));
  } else {
    // Check user mic peer connections
    pc = userMicPCs[socketId];
    if (pc && pc.remoteDescription) {
      pc.addIceCandidate(new RTCIceCandidate(candidate))
        .then(() => console.log(`✅ Added ICE candidate from ${socketId} (user mic)`))
        .catch(error => console.error(`❌ Error adding ICE candidate:`, error));
    }
  }
});

// Handle chat messages from viewers
socket.on('chat-message', (data) => {
  const div = document.createElement('div');
  div.className = 'chat-message';
  div.innerHTML = `<strong>${data.sender}:</strong> ${data.message}`;
  adminMessages.appendChild(div);
  adminMessages.scrollTop = adminMessages.scrollHeight;
});

// Send chat message
sendAdminChat.addEventListener('click', () => {
  const msg = adminChatInput.value.trim();
  if (msg) {
    socket.emit('chat-message', { 
      sender: 'Admin', 
      message: msg 
    });
    adminChatInput.value = '';
  }
});

// Handle Enter key in chat
adminChatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendAdminChat.click();
  }
});

// Handle mic requests from viewers
socket.on('mic-request', ({ socketId, user, userInfo }) => {
  console.log(`🎤 Mic request from ${user} (${socketId})`);
  
  const li = document.createElement('li');
  li.innerHTML = `
    <span><strong>${user}</strong>${userInfo?.phone ? ` (${userInfo.phone})` : ''}</span>
    <button onclick="approveMic('${socketId}')" class="approve-btn">✅ Approve</button>
    <button onclick="rejectMic('${socketId}')" class="reject-btn">❌ Reject</button>
  `;
  li.id = `mic-request-${socketId}`;
  micRequestList.appendChild(li);
});

// Handle user mic stream offers (separate from admin stream offers)
socket.on('user-mic-offer', async ({ socketId, offer }) => {
  console.log(`📤 Received user mic offer from ${socketId}`);
  
  try {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    userMicPCs[socketId] = pc;
    
    // Handle incoming mic stream
    pc.ontrack = (event) => {
      console.log(`🎤 Received mic stream from ${socketId}`);
      // Create audio element to play the user's mic
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play().catch(e => console.warn('Could not auto-play audio:', e));
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          target: socketId,
          candidate: event.candidate
        });
      }
    };
    
    // Set remote description and create answer
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socket.emit('answer', {
      target: socketId,
      answer: answer
    });
    
    console.log(`✅ Created answer for user mic from ${socketId}`);
  } catch (error) {
    console.error('❌ Error handling user mic offer:', error);
  }
});

// Approve mic request
window.approveMic = (socketId) => {
  socket.emit('mic-approved', { target: socketId });
  const li = document.getElementById(`mic-request-${socketId}`);
  if (li) {
    li.innerHTML = '<span>✅ Approved</span>';
    setTimeout(() => li.remove(), 3000);
  }
};

// Reject mic request
window.rejectMic = (socketId) => {
  const li = document.getElementById(`mic-request-${socketId}`);
  if (li) {
    li.innerHTML = '<span>❌ Rejected</span>';
    setTimeout(() => li.remove(), 3000);
  }
};
// Load everything on startup
loadStats();