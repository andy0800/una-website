document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      localStorage.setItem('adminToken', data.token);
      window.location.href = 'dashboard.html';
    } else {
      document.getElementById('loginMessage').textContent = data.message || 'Login failed';
    }
  } catch (err) {
    console.error(err);
    document.getElementById('loginMessage').textContent = 'Error connecting to server';
  }
});