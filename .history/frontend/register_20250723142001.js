document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = e.target;
  const formData = {
    name: form.name.value,
    phone: form.phone.value,
    civilId: form.civilId.value,
    passportNumber: form.passportNumber.value,
    dateOfBirth: form.dateOfBirth.value,
    password: form.password.value
  };

  try {
    const res = await fetch('http://localhost:5000/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await res.json();
    document.getElementById('registerMessage').innerText = result.msg || 'Registered!';
  } catch (err) {
    document.getElementById('registerMessage').innerText = 'An error occurred';
  }
});