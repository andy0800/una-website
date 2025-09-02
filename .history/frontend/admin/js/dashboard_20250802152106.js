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
        allUsers = users; // ✅ Save users globally
      renderUsers(allUsers); // ✅ Call a new function to render UI
      const container = document.getElementById('adminContent');
      container.innerHTML = '<h2>Registered Users</h2>';
      if (!Array.isArray(users) || users.length === 0) {
        container.innerHTML += '<p>No users found.</p>';
        return;
      }
      
    function renderUsers(users) {
  const container = document.getElementById('adminContent');
  container.innerHTML = '<h2>Registered Users</h2>';

  if (!Array.isArray(users) || users.length === 0) {
    container.innerHTML += '<p>No users found.</p>';
    return;
  }
      users.forEach(user => {
        const badge = user.level ? `<span class="badge">${user.level}</span>` : '';
        const certImages = Array.isArray(user.certificates) && user.certificates.length
          ? `<div class="certificates">` +
              user.certificates.map((cert, i) => `
                <div class="cert">
                  <img src="/certs/${cert.image}" alt="${cert.name}" />
                  <p>
  ${cert.name}
  <button onclick="deleteCertificate('${user._id}', ${i})" style="color:red; font-size: 12px;">🗑</button>
</p>
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
    })
    .catch(err => {
      document.getElementById('adminContent').innerHTML = `<p style="color:red;">${err.message}</p>`;
    });
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
// Load everything on startup
loadStats();