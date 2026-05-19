/* ═══════════════════════════════════════
   RESOLUTE — Form Submission
   Telegram → через Netlify Function (токен скрыт)
   Sheets   → напрямую из браузера (no-cors, работает надёжно)
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // Вставьте URL вашего Apps Script сюда
  // (Apps Script → Развернуть → URL веб-приложения)
  const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwbS_W3coNhg_T7p2imcHNFIMkNuKAnVzDxpzpcFQMqVND_6odKopbOrGXfH4DEgG48Yg/exec';

  const form        = document.getElementById('signupForm');
  const submitBtn   = document.getElementById('submitBtn');
  const btnText     = submitBtn.querySelector('.btn-text');
  const btnLoading  = submitBtn.querySelector('.btn-loading');
  const formSuccess = document.getElementById('formSuccess');

  // ── Валидация ─────────────────────────────────────────────
  function validateField(id, errorId, check, message) {
    const el  = document.getElementById(id);
    const err = document.getElementById(errorId);
    if (!el || !err) return true;
    if (!check(el.value.trim())) {
      el.classList.add('error');
      err.textContent = message;
      return false;
    }
    el.classList.remove('error');
    err.textContent = '';
    return true;
  }

  function validateForm() {
    return [
      validateField('childName',  'childNameErr',  v => v.length >= 2,                   'Введите имя ребёнка'),
      validateField('childAge',   'childAgeErr',   v => v >= 4 && v <= 18,               'Возраст от 4 до 18 лет'),
      validateField('parentName', 'parentNameErr', v => v.length >= 2,                   'Введите ваше имя'),
      validateField('phone',      'phoneErr',      v => /^[\d\s\+\-\(\)]{7,}$/.test(v), 'Введите корректный телефон'),
    ].every(Boolean);
  }

  ['childName', 'childAge', 'parentName', 'phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      el.classList.remove('error');
      const err = document.getElementById(id + 'Err');
      if (err) err.textContent = '';
    });
  });

  // ── Сбор данных ───────────────────────────────────────────
  function getFormData() {
    return {
      childName:  document.getElementById('childName').value.trim(),
      childAge:   document.getElementById('childAge').value.trim(),
      parentName: document.getElementById('parentName').value.trim(),
      phone:      document.getElementById('phone').value.trim(),
      timeSlot:   document.getElementById('timeSlot').value,
      comment:    document.getElementById('comment').value.trim(),
      timestamp:  new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
    };
  }

  // ── Отправка в Telegram через Netlify Function ────────────
  async function sendTelegram(data) {
    const res = await fetch('/api/submit-form', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Netlify function error: ${res.status}`);
    return res.json();
  }

  // ── Отправка в Google Sheets напрямую из браузера ─────────
  // no-cors mode only allows text/plain — body is still JSON, Apps Script parses it fine
  function sendSheets(data) {
    return fetch(SHEETS_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(data),
    });
  }

  // ── Mailto fallback ───────────────────────────────────────
  function openMailto(data) {
    const subject = encodeURIComponent(`Заявка — ${data.childName}, ${data.childAge} лет`);
    const body = encodeURIComponent(
      `Имя ребёнка: ${data.childName}\nВозраст: ${data.childAge} лет\n` +
      `Имя родителя: ${data.parentName}\nТелефон: ${data.phone}\n` +
      `Время: ${data.timeSlot || '—'}\nКомментарий: ${data.comment || '—'}`
    );
    window.open(`mailto:resolute.cheer@gmail.com?subject=${subject}&body=${body}`);
  }

  // ── Submit ────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErr = form.querySelector('.error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    submitBtn.disabled = true;
    btnText.hidden     = true;
    btnLoading.hidden  = false;

    const data = getFormData();

    try {
      // Отправляем оба запроса параллельно
      await Promise.all([
        sendTelegram(data),
        sendSheets(data),   // no-cors — ошибку не поймаем, но данные придут
      ]);

      // Показываем экран успеха
      form.hidden = true;
      formSuccess.removeAttribute('hidden');
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
      console.error('Submit error:', err);

      // Даже если Telegram упал — Sheets мог записать. Показываем успех.
      // Если хотите строгую проверку — замените на alert + повтор.
      form.hidden = true;
      formSuccess.removeAttribute('hidden');
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

})();
