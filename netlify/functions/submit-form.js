// netlify/functions/submit-form.js
// Токен хранится в переменных окружения Netlify — не в коде!
//
// Настройка в Netlify Dashboard:
// Site settings → Environment variables → Add variable:
//   TELEGRAM_BOT_TOKEN = ваш_токен
//   TELEGRAM_CHAT_ID   = 1054823888
//   SHEETS_WEBHOOK_URL = https://script.google.com/...

exports.handler = async (event) => {
  // Только POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Rate limiting простой (по IP) — опционально
  // Netlify не даёт встроенного, но 125k запросов/месяц бесплатно
  // и спам через форму маловероятен

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // Базовая валидация на сервере (не доверяем только фронту)
  const { childName, childAge, parentName, phone } = data;
  if (!childName || !parentName || !phone) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'Missing required fields' }),
    };
  }

  const results = { telegram: null, sheets: null };
  const errors  = [];

  // ── Отправка в Telegram ──────────────────
  try {
    const text = [
      '🏅 <b>НОВАЯ ЗАЯВКА — RESOLUTE</b>',
      '',
      `👤 <b>Ребёнок:</b> ${escapeHtml(childName)}, ${Number(childAge)} лет`,
      `👨‍👩‍👧 <b>Родитель:</b> ${escapeHtml(parentName)}`,
      `📱 <b>Телефон:</b> ${escapeHtml(phone)}`,
      data.timeSlot ? `⏰ <b>Время:</b> ${escapeHtml(data.timeSlot)}` : '',
      data.comment  ? `💬 <b>Коммент:</b> ${escapeHtml(data.comment)}` : '',
      '',
      `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
    ].filter(Boolean).join('\n');

    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    process.env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    );

    results.telegram = tgRes.ok ? 'ok' : 'error';
    if (!tgRes.ok) errors.push('telegram');
  } catch (e) {
    errors.push('telegram');
    results.telegram = 'error';
  }

  // ── Отправка в Google Sheets ─────────────
  if (process.env.SHEETS_WEBHOOK_URL) {
    try {
      await fetch(process.env.SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
        }),
      });
      results.sheets = 'ok';
    } catch (e) {
      errors.push('sheets');
      results.sheets = 'error';
    }
  }

  // Успех если хотя бы Telegram прошёл
  const success = results.telegram === 'ok';

  return {
    statusCode: success ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success, results }),
  };
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
