document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const formMessage = document.getElementById('formMessage');

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Clear previous message
    formMessage.textContent = '';
    formMessage.style.color = 'red';

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const message = form.message.value.trim();

    if (!name) {
      formMessage.textContent = 'Please enter your full name.';
      return;
    }

    if (!validateEmail(email)) {
      formMessage.textContent = 'Please enter a valid email address.';
      return;
    }

    if (!message) {
      formMessage.textContent = 'Please enter your message.';
      return;
    }

    // Simulate successful submission (replace with real backend integration)
    formMessage.style.color = 'limegreen';
    formMessage.textContent = 'Thank you for contacting us! We will respond shortly.';

    form.reset();
  });

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
});