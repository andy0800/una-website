document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('userToken');
  const container = document.getElementById('profileContainer');

  if (!token) {
    container.innerHTML = '<p>Please log in to view your profile.</p>';
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/users/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const user = await res.json();
    if (!res.ok) throw new Error(user.message || 'Failed to load user');

    const certHTML = (user.certificates && user.certificates.length)
      ? `<div class="cert-list">` + user.certificates.map(cert => `
          <div class="cert-box">
            <img src="/certs/${cert.image}" alt="${cert.name}" />
            <p>${cert.name}</p>
          </div>
        `).join('') + `</div>`
      : '<p>No certificates uploaded</p>';

    container.innerHTML = `
      <div class="profile-card">
        <h2>${user.name || '—'}</h2>
        <p><strong>Phone:</strong> ${user.phone || '—'}</p>
        <p><strong>Email:</strong> ${user.email || '—'}</p>
        <p><strong>Civil ID:</strong> ${user.civilId || '—'}</p>
        <p><strong>Passport No:</strong> ${user.passportNumber || '—'}</p>
        <p><strong>Date of Birth:</strong> ${user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '—'}</p>
        <p><strong>Courses:</strong> ${user.courses?.join(', ') || '—'}</p>
        <p><strong>Level:</strong> ${user.level || '—'}</p>
        <h3>Certificates</h3>
        ${certHTML}
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
});