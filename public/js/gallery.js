/* ═══════════════════════════════════════
   RESOLUTE — Gallery & Lightbox
   Фото подгружаются из PocketBase (заказчик управляет ими сам через админку).
   Если PocketBase недоступен (демо на GitHub Pages / нет сети) —
   показываются статичные фото из FALLBACK_PHOTOS.
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // ── Адрес PocketBase ──────────────────────
  // В проде сайт и PocketBase на одном домене (Nginx проксирует /api/ → PocketBase),
  // поэтому база пустая (запросы относительные). Локально PocketBase на :8090.
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const PB_URL  = (isLocal && location.port !== '8090') ? 'http://127.0.0.1:8090' : '';

  // ── Фолбэк-список (демо / нет PocketBase) ──
  const FALLBACK_PHOTOS = Array.from({ length: 23 }, (_, i) =>
    `assets/images/gallery/photo${i + 1}.jpg`
  );

  const galleryGrid   = document.getElementById('galleryGrid');
  const lightbox      = document.getElementById('lightbox');
  const lightboxImg   = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev  = document.getElementById('lightboxPrev');
  const lightboxNext  = document.getElementById('lightboxNext');

  let photos    = [];   // [{ full, thumb, caption }]
  let currentIdx = 0;

  // ── Загрузка списка фото ──────────────────
  async function loadPhotos() {
    try {
      const res = await fetch(`${PB_URL}/api/collections/gallery/records?sort=sort,created&perPage=200`);
      if (!res.ok) throw new Error(`PocketBase ${res.status}`);
      const data = await res.json();
      if (!data.items || !data.items.length) throw new Error('PocketBase: нет фото');

      return data.items.map(r => {
        const base = `${PB_URL}/api/files/${r.collectionId}/${r.id}/${encodeURIComponent(r.image)}`;
        return {
          full:    base,
          thumb:   `${base}?thumb=800x0`,
          caption: r.caption || '',
        };
      });
    } catch (e) {
      console.warn('[gallery] Использую статичные фото:', e.message);
      return FALLBACK_PHOTOS.map(src => ({ full: src, thumb: src, caption: '' }));
    }
  }

  // ── Построение сетки ──────────────────────
  function buildGrid() {
    galleryGrid.innerHTML = '';

    photos.forEach((photo, i) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', photo.caption || `Фото ${i + 1}`);

      const img = document.createElement('img');
      img.src = photo.thumb;
      img.alt = photo.caption || `Клуб Resolute — фото ${i + 1}`;
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
  }

  // ── Lightbox ──────────────────────────────
  function openLightbox(idx) {
    currentIdx = idx;
    lightboxImg.src = photos[idx].full;
    lightboxImg.alt = `Фото ${idx + 1} из ${photos.length}`;
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
    if (!photos.length) return;
    currentIdx = (currentIdx + dir + photos.length) % photos.length;
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = photos[currentIdx].full;
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
    counter.textContent = `${currentIdx + 1} / ${photos.length}`;
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

  // ── Старт ─────────────────────────────────
  loadPhotos().then(list => {
    photos = list;
    buildGrid();
  });
})();
