<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>International Arbitration Authority</title>
  <link rel="stylesheet" href="assets/css/styles.css" />
  <style>
    /* Basic Reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    img { max-width: 100%; display: block; }

    /* Container */
    .container { width: 90%; max-width: 1200px; margin: auto; padding: 20px 0; }

    /* Navbar */
    .navbar { background: #222; padding: 15px 0; color: #fff; }
    .navbar .logo { height: 50px; }
    .nav-links { list-style: none; display: flex; gap: 20px; }
    .nav-links a { color: #fff; text-decoration: none; font-weight: bold; }

    /* Hero */
    .hero { background: #004aad; color: #fff; padding: 80px 0; text-align: center; }
    .hero h1 { font-size: 2.5rem; margin-bottom: 15px; }
    .hero p { font-size: 1.2rem; }

    /* Features */
    .features { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 60px 0; background: #f9f9f9; text-align: center; }
    .feature { flex: 1 1 300px; padding: 20px; }

    /* Programs */
    .programs h2 { text-align: center; margin-bottom: 30px; }
    .program-list { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
    .program { background: #fff; border: 1px solid #ddd; padding: 15px; max-width: 300px; text-align: center; }

    /* Testimonials */
    .testimonials { background: #f0f0f0; padding: 60px 0; text-align: center; }
    .testimonial { max-width: 600px; margin: auto; font-style: italic; }
    .testimonial span { display: block; margin-top: 10px; font-weight: bold; }

    /* Team */
    .team { padding: 60px 0; text-align: center; background: #fff; }

    /* Events */
    .events { padding: 60px 0; background: #f9f9f9; }
    .events ul { list-style: none; padding-left: 0; text-align: center; }
    .events li { margin-bottom: 10px; font-size: 1.1rem; }

    /* Footer */
    footer { background: #222; color: #fff; padding: 20px 0; text-align: center; }

    /* Responsive */
    @media (max-width: 768px) {
      .nav-links { flex-direction: column; gap: 10px; }
      .features, .program-list { flex-direction: column; align-items: center; }
    }
  </style>
</head>
<body>
  <!-- Navbar -->
  <header class="navbar">
    <div class="container">
      <img src="assets/images/logo.png" alt="Logo" class="logo" />
      <nav>
        <ul class="nav-links">
          <li><a href="index.html">Home</a></li>
          <li><a href="courses.html">Courses</a></li>
          <li><a href="arbitrators.html">Arbitrators</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <h1>More than 42,500 students in the Arab world</h1>
      <p>15 years in the field of legal and political management sciences…</p>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features">
    <div class="container">
      <div class="feature">
        <h2>18+ Diplomas & Workshops</h2>
        <p>Covering legal, commercial, and arbitration fields.</p>
      </div>
      <div class="feature">
        <h2>Top Arab Experts</h2>
        <p>All our courses are taught by real professionals and arbitrators.</p>
      </div>
      <div class="feature">
        <h2>International Certification</h2>
        <p>Globally recognized and accepted certificates.</p>
      </div>
    </div>
  </section>

  <!-- Latest Programs -->
  <section class="programs">
    <div class="container">
      <h2>Our Latest Programs</h2>
      <div class="program-list">
        <div class="program">
          <img src="assets/images/diploma1.jpg" alt="Diploma 1" />
          <h3>International Commercial Arbitration Diploma</h3>
          <p>$650 – 3 months – Certified</p>
        </div>
        <div class="program">
          <img src="assets/images/diploma2.jpg" alt="Diploma 2" />
          <h3>Cybercrime & Digital Evidence Diploma</h3>
          <p>$550 – 2 months – Certified</p>
        </div>
        <div class="program">
          <img src="assets/images/diploma3.jpg" alt="Diploma 3" />
          <h3>Engineering Arbitration Diploma</h3>
          <p>$600 – 2.5 months – Certified</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section class="testimonials">
    <div class="container">
      <h2>What Our Students Say</h2>
      <div class="testimonial">
        <p>“Very professional content and top-notch lecturers. I became an official arbitrator after graduation!”</p>
        <span>- Dr. Ahmad, Graduate</span>
      </div>
    </div>
  </section>

  <!-- Team Section -->
  <section class="team">
    <div class="container">
      <h2>Meet Our Experts</h2>
      <p>Our team includes former ministers, judges, and university professors.</p>
    </div>
  </section>

  <!-- Events and Articles -->
  <section class="events">
    <div class="container">
      <h2>Events & Publications</h2>
      <ul>
        <li>📘 Book Launch: Egyptian Arbitration Guide</li>
        <li>🎤 Upcoming: Legal Tech in Arbitration Webinar</li>
      </ul>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="container">
      <p>&copy; 2025 International Arbitration Authority</p>
      <p>Email: info@egyarbitration.com | Phone: +20 111 234 5678</p>
    </div>
  </footer>

  <script src="assets/js/script.js"></script>
</body>
</html>
