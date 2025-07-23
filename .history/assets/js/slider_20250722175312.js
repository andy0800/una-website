// Slider for Featured Courses
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('featuredCoursesSlider');
  const slidesWrapper = slider.querySelector('.slides-wrapper');
  const slides = slider.querySelectorAll('.slide');
  const prevBtn = slider.querySelector('.prev-btn');
  const nextBtn = slider.querySelector('.next-btn');

  let currentIndex = 0;
  const totalSlides = slides.length;

  function updateSliderPosition() {
    slidesWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
  }

  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateSliderPosition();
  });

  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateSliderPosition();
  });

  // Optional: Auto-slide every 5 seconds
  setInterval(() => {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateSliderPosition();
  }, 5000);
});