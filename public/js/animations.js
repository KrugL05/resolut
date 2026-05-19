/* ═══════════════════════════════════════
   RESOLUTE — Scroll Animations
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // Intersection Observer для плавного появления секций
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Небольшая задержка для cascade-эффекта
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, i * 60);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Карточки внутри grid-контейнеров
  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cards = entry.target.querySelectorAll(
            '.achievement-card, .coach-card, .day-card, .award-card, .pillar'
          );
          cards.forEach((card, i) => {
            card.style.transitionDelay = `${i * 55}ms`;
            card.classList.add('visible');
          });
          cardObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05 }
  );

  // Добавляем reveal на все карточки
  document.querySelectorAll(
    '.achievements-grid, .coaches-grid, .schedule-grid, .awards-grid, .about-pillars'
  ).forEach(grid => {
    grid.querySelectorAll(
      '.achievement-card, .coach-card, .day-card, .award-card, .pillar'
    ).forEach(card => {
      card.classList.add('reveal');
    });
    cardObserver.observe(grid);
  });

})();
