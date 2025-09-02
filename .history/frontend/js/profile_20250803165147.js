const token = localStorage.getItem('userToken');
if (!token) {
  window.location.href = 'login.html';
}

const headers = { Authorization: `Bearer ${token}` };

fetch('http://localhost:5000/api/user/me', { headers })
  .then(res => res.json())
  .then(user => {
    const container = document.getElementById('profileContent');
    container.innerHTML = `
      <h2>${user.name}</h2>
      <p><strong>Phone:</strong> ${user.phone}</p>
      <p><strong>Civil ID:</strong> ${user.civilId}</p>
      <p><strong>Passport:</strong> ${user.passportNumber}</p>
      <p><strong>Date of Birth:</strong> ${new Date(user.dateOfBirth).toLocaleDateString()}</p>
      <p><strong>Level:</strong> <span class="badge">${user.level}</span></p>
      <p><strong>Courses:</strong> ${user.courses?.join(', ') || '—'}</p>
      <h3>Certificates:</h3>
      <div class="certificates">
        ${
          user.certificates.length > 0
            ? user.certificates
                .map(cert => `<div><img src="/certs/${cert.image}" alt="" /><p>${cert.name}</p></div>`)
                .join('')
            : 'No certificates.'
        }
      </div>
    `;
  })
  .catch(err => {
    document.getElementById('profileContent').innerHTML = `<p style="color:red;">${err.message}</p>`;
  });