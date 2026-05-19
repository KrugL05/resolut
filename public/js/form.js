/* ═══════════════════════════════════════
   RESOLUTE — Form Submission
   Токены хранятся в Netlify Environment Variables,
   а не здесь. Этот файл полностью публичен — секретов нет.
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  const form        = document.getElementById('signupForm');
  const submitBtn   = document.getElementById('submitBtn');
  const btnText     = submitBtn.querySelector('.btn-text');
  const btnLoading  = submitBtn.querySelector('.btn-loading');
  const formSuccess = document.getElementById('formSuccess');

  // ── Валидация ─────────────────────────
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
      validateField('childName',  'childNameErr',  v => v.length >= 2,             'Введите имя ребёнка'),
      validateField('childAge',   'childAgeErr',   v => v >= 4 && v <= 18,         'Возраст от 4 до 18 лет'),
      validateField('parentName', 'parentNameErr', v => v.length >= 2,             'Введите ваше имя'),
      validateField('phone',      'phoneErr',      v => /^[\d\s\+\-\(\)]{7,}$/.test(v), 'Введите корректный телефон'),
    ].every(Boolean);
  }

  ['childName','childAge','parentName','phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      el.classList.remove('error');
      const err = document.getElementById(id + 'Err');
      if (err) err.textContent = '';
    });
  });

  // ── Сбор данных ───────────────────────
  function getFormData() {
    return {
      childName:  document.getElementById('childName').value.trim(),
      childAge:   document.getElementById('childAge').value.trim(),
      parentName: document.getElementById('parentName').value.trim(),
      phone:      document.getElementById('phone').value.trim(),
      timeSlot:   document.getElementById('timeSlot').value,
      comment:    document.getElementById('comment').value.trim(),
    };
  }

  // ── Mailto fallback ───────────────────
  function openMailto(data) {
    const subject = encodeURIComponent(`Заявка — ${data.childName}, ${data.childAge} лет`);
    const body = encodeURIComponent(
      `Имя ребёнка: ${data.childName}\nВозраст: ${data.childAge} лет\n` +
      `Имя родителя: ${data.parentName}\nТелефон: ${data.phone}\n` +
      `Время: ${data.timeSlot || '—'}\nКомментарий: ${data.comment || '—'}`
    );
    window.open(`mailto:resolute.cheer@gmail.com?subject=${subject}&body=${body}`);
  }

  // ── Submit ────────────────────────────
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
      // POST на Netlify Function — токены на сервере, здесь их нет
      const res = await fetch('/api/submit-form', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      form.hidden = true;
      formSuccess.removeAttribute('hidden');
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
      console.error('Submit error:', err);
      const fallback = confirm(
        'Не удалось отправить автоматически.\nОткрыть почту для ручной отправки?'
      );
      if (fallback) openMailto(data);

      submitBtn.disabled = false;
      btnText.hidden     = false;
      btnLoading.hidden  = true;
    }
  });

})();
