document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = e.target;

  try {
    const res = await fetch('http://localhost:5000/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: form.phone.value,
        password: form.password.value
      })
    });

    const result = await res.json();
    if (res.ok) {
      localStorage.setItem('token', result.token);
      window.location.href = 'dashboard.html';
    } else {
      document.getElementById('loginMessage').innerText = result.msg;
    }
  } catch (err) {
    document.getElementById('loginMessage').innerText = 'Login failed';
  }
});