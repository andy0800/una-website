document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const civilId = document.getElementById('civilId')?.value.trim();
    const passportNumber = document.getElementById('passportNumber')?.value.trim();
    const dateOfBirth = document.getElementById('dateOfBirth')?.value;
    const password = document.getElementById('password')?.value;

    if (!name || !phone || !password) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          civilId,
          passportNumber,
          dateOfBirth,
          password
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert('Registered successfully! Redirecting to login...');
      window.location.href = 'login.html';
    } catch (err) {
      alert(err.message);
    }
  });
});