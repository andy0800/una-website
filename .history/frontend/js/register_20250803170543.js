document.getElementById('registerForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const data = {
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    civilId: document.getElementById('civilId').value,
    passportNumber: document.getElementById('passportNumber').value,
    dateOfBirth: document.getElementById('dateOfBirth').value,
    password: document.getElementById('password').value
  };

  fetch('http://localhost:5000/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(response => {
      if (response.message === 'Registration successful!') {
        alert('Registered successfully. Redirecting to login...');
        window.location.href = 'login.html';
      } else {
        alert(response.message);
      }
    })
    .catch(err => alert('Error: ' + err.message));
});