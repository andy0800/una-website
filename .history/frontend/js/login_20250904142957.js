document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 DEBUG: Login script loaded');
  
  const form = document.getElementById('loginForm');
  console.log('🔍 DEBUG: Form found:', form);

  if (!form) {
    console.error('❌ Login form not found!');
    return;
  }

  console.log('🔍 DEBUG: Adding submit event listener');
  form.addEventListener('submit', async (e) => {
    console.log('🔍 DEBUG: Form submit event triggered');
    e.preventDefault();
    console.log('🔍 DEBUG: Default form submission prevented');

    const phone = document.getElementById('phone')?.value.trim();
    const password = document.getElementById('password')?.value;
    console.log('🔍 DEBUG: Phone:', phone, 'Password length:', password?.length);

    if (!phone || !password) {
      alert('Please enter phone and password.');
      return;
    }

    try {
      console.log('🔍 DEBUG: Making POST request to:', window.config.USER_API.LOGIN);
      const res = await fetch(window.config.USER_API.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });

      console.log('🔍 DEBUG: Response status:', res.status);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // ✅ Store the token and redirect
      localStorage.setItem('userToken', data.token);
      window.location.href = '/../en/index.html'; // or your homepage
    } catch (err) {
      console.error('❌ Login error:', err);
      alert(err.message);
    }
  });
});