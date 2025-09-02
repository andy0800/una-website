document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = document.getElementById('phone')?.value.trim();
    const password = document.getElementById('password')?.value;

    if (!phone || !password) {
      alert('Please enter phone and password.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // ✅ Store the token and redirect
      localStorage.setItem('userToken', data.token);
      window.location.href = '/../en/index.html'; // or your homepage
    } catch (err) {
      alert(err.message);
    }
  });
});