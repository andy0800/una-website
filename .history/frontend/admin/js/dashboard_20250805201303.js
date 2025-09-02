const token = localStorage.getItem('adminToken');
const apiBase = 'http://localhost:5000/api/admin';
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

  // Fetch content from backend
  fetch(`${apiBase}/content/${page}/${lang}`, { headers })
    .then(handleResponse)
    .then(data => {
      const quill = new Quill('#editor', {
        theme: 'snow'
      });
      quill.setContents(quill.clipboard.convert(data.content || ''));

      document.getElementById('saveContentBtn').addEventListener('click', () => {
        const htmlContent = quill.root.innerHTML;
        fetch(`${apiBase}/content/${page}/${lang}`, {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: htmlContent })
        })
          .then(handleResponse)
          .then(() => alert('Content saved!'))
          .catch(err => alert(err.message));
      });
    })
    .catch(err => {
      document.getElementById('adminContent').innerHTML = `<p style="color:red;">${err.message}</p>`;
    });
}

function loadEditorTabs() {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <h2>📝 Content Editor</h2>
    <p>Select a page and language to edit:</p>
    <div class="card">
      <h3>🏠 Home Page</h3>
      <button onclick="loadEditor('index', 'en')">Edit English</button>
      <button onclick="loadEditor('index', 'ar')">Edit Arabic</button>
    </div>
    <div class="card">
      <h3>📄 Courses Page</h3>
      <button onclick="loadEditor('courses', 'en')">Edit English</button>
      <button onclick="loadEditor('courses', 'ar')">Edit Arabic</button>
    </div>
    <div class="card">
      <h3>👤 About Page</h3>
      <button onclick="loadEditor('about', 'en')">Edit English</button>
      <button onclick="loadEditor('about', 'ar')">Edit Arabic</button>
    </div>
  `;
}
// Load everything on startup
loadStats();