// netlify/functions/submit-form.js
// Только Telegram — Sheets теперь вызывается напрямую из браузера

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { childName, childAge, parentName, phone } = data;
  if (!childName || !parentName || !phone) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'Missing required fields' }),
    };
  }

  const results = {};

  // ── Telegram ─────────────────────────────────────────────
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const text = [
        '🏅 <b>НОВАЯ ЗАЯВКА — RESOLUTE</b>',
        '',
        `👤 <b>Ребёнок:</b> ${esc(childName)}, ${Number(childAge)} лет`,
        `👨‍👩‍👧 <b>Родитель:</b> ${esc(parentName)}`,
        `📱 <b>Телефон:</b> ${esc(phone)}`,
        data.timeSlot ? `⏰ <b>Время:</b> ${esc(data.timeSlot)}` : '',
        data.comment  ? `💬 <b>Коммент:</b> ${esc(data.comment)}` : '',
        '',
        `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
      ].filter(Boolean).join('\n');

      const tgRes = await fetchWithTimeout(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id:    process.env.TELEGRAM_CHAT_ID,
              text,
              parse_mode: 'HTML',
            }),
          },
          5000  // 5 секунд таймаут
      );

      results.telegram = tgRes.ok ? 'ok' : `error ${tgRes.status}`;
    } catch (e) {
      results.telegram = `error: ${e.message}`;
    }
  } else {
    results.telegram = 'skipped (no env vars)';
  }

  // ── Google Sheets ─────────────────────────────────────────
  if (process.env.SHEETS_WEBHOOK_URL) {
    try {
      const sheetsRes = await fetchWithTimeout(
          process.env.SHEETS_WEBHOOK_URL,
          {
            method:   'POST',
            redirect: 'follow',         // ← FIX: следуем за редиректом Apps Script
            headers:  { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              timestamp: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
            }),
          },
          7000  // 7 секунд таймаут
      );

      results.sheets = sheetsRes.ok ? 'ok' : `error ${sheetsRes.status}`;
    } catch (e) {
      results.sheets = `error: ${e.message}`;
    }
  } else {
    results.sheets = 'skipped (no SHEETS_WEBHOOK_URL)';
  }

  console.log('Submit results:', JSON.stringify(results));

  const success = results.telegram === 'ok' || results.sheets === 'ok';

  return {
    statusCode: success ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success, results }),
  };
};

// ── Helpers ───────────────────────────────────────────────────

function esc(str) {
  return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
}

// fetch с таймаутом через AbortController
async function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error(`Timeout after ${ms}ms`);
    throw e;
  }
}