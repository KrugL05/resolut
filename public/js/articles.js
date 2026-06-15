/* ═══════════════════════════════════════
   RESOLUTE — Articles (новости клуба)
   Статьи подгружаются из PocketBase (заказчик управляет ими сам через админку).
   Если PocketBase недоступен (демо на GitHub Pages / нет сети) —
   показываются примеры из FALLBACK_ARTICLES.
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // ── Адрес PocketBase (как в gallery.js) ───
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const PB_URL  = (isLocal && location.port !== '8090') ? 'http://127.0.0.1:8090' : '';

  // ── Фолбэк (демо / нет PocketBase) ────────
  const FALLBACK_ARTICLES = [
    {
      image:   'assets/images/gallery/photo5.jpg',
      title:   'Победа на Первенстве России',
      excerpt: 'Наша команда снова взяла золото — рассказываем, как это было.',
      body:    '<p>В этом сезоне команда <b>RESOLUTE</b> в четвёртый раз стала победителем Первенства России по чир спорту.</p><p>Месяцы упорных тренировок и поддержка родителей привели нас к заслуженной победе. Поздравляем спортсменов и тренеров!</p>',
    },
    {
      image:   'assets/images/gallery/photo12.jpg',
      title:   'Набор в новую группу',
      excerpt: 'Открываем набор детей от 6 лет. Первая тренировка — бесплатно!',
      body:    '<p>Клуб RESOLUTE объявляет набор в новую группу для детей от 6 лет.</p><p>Мы научим базовым элементам, дисциплине и работе в команде. <b>Первая тренировка бесплатная</b> — приходите познакомиться!</p>',
    },
    {
      image:   'assets/images/gallery/photo18.jpg',
      title:   'Как проходят наши сборы',
      excerpt: 'Закулисье летних сборов: тренировки, дружба и новые рекорды.',
      body:    '<p>Летние сборы — это не только интенсивные тренировки, но и настоящая командная атмосфера.</p><p>Спортсмены отрабатывают сложные элементы и просто отлично проводят время вместе.</p>',
    },
  ];

  const track     = document.getElementById('articlesTrack');
  const prevBtn   = document.getElementById('articlesPrev');
  const nextBtn   = document.getElementById('articlesNext');
  const modal     = document.getElementById('articleModal');
  const modalImg  = document.getElementById('articleModalImg');
  const modalTitle = document.getElementById('articleModalTitle');
  const modalBody = document.getElementById('articleModalBody');
  const modalClose = document.getElementById('articleModalClose');

  if (!track) return;

  let articles = [];

  // ── Загрузка статей ───────────────────────
  async function loadArticles() {
    try {
      const res = await fetch(`${PB_URL}/api/collections/articles/records?sort=sort,created&perPage=50`);
      if (!res.ok) throw new Error(`PocketBase ${res.status}`);
      const data = await res.json();
      if (!data.items || !data.items.length) throw new Error('PocketBase: нет статей');

      return data.items.map(r => {
        const base = r.image
          ? `${PB_URL}/api/files/${r.collectionId}/${r.id}/${encodeURIComponent(r.image)}`
          : '';
        return {
          image:   base ? `${base}?thumb=640x400` : '',
          full:    base,
          title:   r.title || '',
          excerpt: r.excerpt || '',
          body:    r.body || '',
        };
      });
    } catch (e) {
      console.warn('[articles] Использую примеры статей:', e.message);
      return FALLBACK_ARTICLES.map(a => ({ ...a, full: a.image }));
    }
  }

  // ── Построение карточек ───────────────────
  function buildCards() {
    track.innerHTML = '';

    articles.forEach((a, i) => {
      const card = document.createElement('article');
      card.className = 'article-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', a.title);

      const imgHtml = a.image
        ? `<img class="article-card-img" src="${a.image}" alt="${escapeAttr(a.title)}" loading="lazy" decoding="async">`
        : '';

      card.innerHTML = `
        ${imgHtml}
        <div class="article-card-body">
          <h3 class="article-card-title">${escapeHtml(a.title)}</h3>
          <p class="article-card-excerpt">${escapeHtml(a.excerpt)}</p>
          <span class="article-card-more">Читать →</span>
        </div>`;

      card.addEventListener('click', () => { if (!dragged) openArticle(i); });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openArticle(i); }
      });

      track.appendChild(card);
    });

    requestAnimationFrame(updateArrows);
  }

  // ── Модалка статьи ────────────────────────
  function openArticle(idx) {
    const a = articles[idx];
    if (a.full) { modalImg.src = a.full; modalImg.alt = a.title; }
    else        { modalImg.removeAttribute('src'); modalImg.alt = ''; }
    modalTitle.textContent = a.title;
    modalBody.innerHTML = a.body;   // HTML из админ-поля (доверенный контент)
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeArticle() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    modalImg.removeAttribute('src');
    modalBody.innerHTML = '';
  }

  modalClose.addEventListener('click', closeArticle);
  modal.addEventListener('click', e => { if (e.target === modal) closeArticle(); });
  document.addEventListener('keydown', e => {
    if (!modal.hasAttribute('hidden') && e.key === 'Escape') closeArticle();
  });

  // ── Стрелки + прокрутка ───────────────────
  function cardStep() {
    const card = track.querySelector('.article-card');
    if (!card) return track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 20;
    return card.offsetWidth + gap;
  }

  function updateArrows() {
    if (!prevBtn || !nextBtn) return;
    const maxScroll = track.scrollWidth - track.clientWidth - 1;
    prevBtn.disabled = track.scrollLeft <= 0;
    nextBtn.disabled = track.scrollLeft >= maxScroll;
  }

  if (prevBtn) prevBtn.addEventListener('click', () => track.scrollBy({ left: -cardStep(), behavior: 'smooth' }));
  if (nextBtn) nextBtn.addEventListener('click', () => track.scrollBy({ left:  cardStep(), behavior: 'smooth' }));
  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);

  // ── Drag-to-scroll мышью (десктоп) ────────
  let isDown = false, startX = 0, startScroll = 0, dragged = false;

  track.addEventListener('mousedown', e => {
    isDown = true; dragged = false;
    startX = e.pageX;
    startScroll = track.scrollLeft;
  });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 6) dragged = true;
    track.scrollLeft = startScroll - dx;
  });
  ['mouseup', 'mouseleave'].forEach(ev =>
    track.addEventListener(ev, () => { isDown = false; })
  );
  // Сбрасываем флаг чуть позже, чтобы клик после драга не открыл статью
  track.addEventListener('click', e => { if (dragged) { e.stopPropagation(); } }, true);

  // ── Экранирование ─────────────────────────
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  // ── Старт ─────────────────────────────────
  loadArticles().then(list => {
    articles = list;
    buildCards();
  });
})();
