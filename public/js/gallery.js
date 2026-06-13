/* ═══════════════════════════════════════
   RESOLUTE — Gallery & Lightbox
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // ── Photo list ────────────────────────────
  // Add or remove filenames here to manage gallery
  const GALLERY_PHOTOS = [
    'assets/images/gallery/photo1.jpg',
    'assets/images/gallery/photo2.jpg',
    'assets/images/gallery/photo3.jpg',
    'assets/images/gallery/photo4.jpg',
    'assets/images/gallery/photo5.jpg',
    'assets/images/gallery/photo6.jpg',
    'assets/images/gallery/photo7.jpg',
    'assets/images/gallery/photo8.jpg',
    'assets/images/gallery/photo9.jpg',
    'assets/images/gallery/photo10.jpg',
    'assets/images/gallery/photo11.jpg',
    'assets/images/gallery/photo12.jpg',
    'assets/images/gallery/photo13.jpg',
    'assets/images/gallery/photo14.jpg',
    'assets/images/gallery/photo15.jpg',
    'assets/images/gallery/photo16.jpg',
    'assets/images/gallery/photo17.jpg',
    'assets/images/gallery/photo18.jpg',
    'assets/images/gallery/photo19.jpg',
    'assets/images/gallery/photo20.jpg',
    'assets/images/gallery/photo21.jpg',
    'assets/images/gallery/photo22.jpg',
    'assets/images/gallery/photo23.jpg',
  ];

  const galleryGrid  = document.getElementById('galleryGrid');
  const lightbox     = document.getElementById('lightbox');
  const lightboxImg  = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  let currentIdx = 0;

  // ── Build gallery grid ────────────────────
  GALLERY_PHOTOS.forEach((src, i) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Фото ${i + 1}`);

    const img = document.createElement('img');
    img.src = src;
    img.alt = `Клуб Resolute — фото ${i + 1}`;
    img.loading = 'lazy';
    img.decoding = 'async';

    const overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';
    overlay.innerHTML = '<div class="gallery-overlay-icon">⊕</div>';

    item.appendChild(img);
    item.appendChild(overlay);

    item.addEventListener('click', () => openLightbox(i));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openLightbox(i);
    });

    galleryGrid.appendChild(item);
  });

  // ── Lightbox ──────────────────────────────
  function openLightbox(idx) {
    currentIdx = idx;
    lightboxImg.src = GALLERY_PHOTOS[idx];
    lightboxImg.alt = `Фото ${idx + 1} из ${GALLERY_PHOTOS.length}`;
    lightbox.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
    updateCounter();
  }

  function closeLightbox() {
    lightbox.setAttribute('hidden', '');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }

  function navigate(dir) {
    currentIdx = (currentIdx + dir + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length;
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = GALLERY_PHOTOS[currentIdx];
      lightboxImg.style.opacity = '1';
      updateCounter();
    }, 150);
  }

  function updateCounter() {
    let counter = document.querySelector('.lightbox-counter');
    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'lightbox-counter';
      lightbox.appendChild(counter);
    }
    counter.textContent = `${currentIdx + 1} / ${GALLERY_PHOTOS.length}`;
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => navigate(-1));
  lightboxNext.addEventListener('click', () => navigate(1));

  // Click backdrop to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (lightbox.hasAttribute('hidden')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   navigate(-1);
    if (e.key === 'ArrowRight')  navigate(1);
  });

  // Touch/swipe support
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
  });
})();
