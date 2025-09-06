document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const civilId = document.getElementById('civilId')?.value.trim();
    const passportNumber = document.getElementById('passportNumber')?.value.trim();
    const dateOfBirth = document.getElementById('dateOfBirth')?.value;
    const password = document.getElementById('password')?.value;

    if (!name || !phone || !password) {
      alert('Please fill all required fields.');
      return;
    }

    // Only include fields that have values
    const formData = {
      name,
      phone,
      password
    };

    if (civilId) formData.civilId = civilId;
    if (passportNumber) formData.passportNumber = passportNumber;
    if (dateOfBirth) formData.dateOfBirth = dateOfBirth;

    try {
      const res = await fetch(window.config.USER_API.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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