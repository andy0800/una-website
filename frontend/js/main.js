const menuToggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('.main-nav');

menuToggle.addEventListener('click', () => {
  nav.classList.toggle('open');
});