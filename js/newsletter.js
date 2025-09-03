document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('newsletterForm');
  const emailInput = document.getElementById('newsletterEmail');
  const messageEl = document.getElementById('newsletterMessage');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!validateEmail(email)) {
      messageEl.style.color = 'red';
      messageEl.textContent = 'Please enter a valid email address.';
      return;
    }

    // Simulate subscription success (replace with real backend/API integration)
    messageEl.style.color = 'limegreen';
    messageEl.textContent = 'Thank you for subscribing!';

    form.reset();
  });

  function validateEmail(email) {
    // Simple email regex validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
});