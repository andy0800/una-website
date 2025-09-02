document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();

  const phone = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!phone || !password) return alert('Please fill all fields.');

  fetch('http://localhost:5000/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('userToken', data.token);
        window.location.href = '/en/index.html'; // or wherever the main page is
      } else {
        alert(data.message || 'Login failed');
      }
    })
    .catch(err => {
      alert('Network error');
      console.error(err);
    });
});
localStorage.setItem('userToken', token);
window.location.href = 'index.html';