/* ═══════════════════════════════════════
   RESOLUTE — Navigation Logic
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  const navbar     = document.getElementById('navbar');
  const burgerBtn  = document.getElementById('burgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  // ── Burger toggle ────────────────────────
  function openMenu() {
    mobileMenu.classList.add('open');
    burgerBtn.classList.add('open');
    burgerBtn.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    burgerBtn.classList.remove('open');
    burgerBtn.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  burgerBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close menu on any mobile link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
      closeMenu();
    }
  });

  // ── Scroll: shadow + active link ─────────
  let lastScrollY = 0;

  function onScroll() {
    const scrollY = window.scrollY;

    // Add shadow on scroll
    navbar.classList.toggle('scrolled', scrollY > 20);

    // Highlight active section link
    const sections = document.querySelectorAll('section[id]');
    let current = '';

    sections.forEach(section => {
      const top = section.offsetTop - 80;
      if (scrollY >= top) current = section.id;
    });

    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href') === `#${current}`) {
        a.classList.add('active');
      }
    });

    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Run once on load
})();
