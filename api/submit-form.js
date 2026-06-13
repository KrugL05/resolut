import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { childName, childAge, parentName, phone, timeSlot, comment } = req.body;

    if (!childName || !parentName || !phone) {
        return res.status(422).json({ error: 'Missing required fields' });
    }

    try {
        await sendTelegram({ childName, childAge, parentName, phone, timeSlot, comment });

        // Email — параллельно, ошибка не блокирует ответ
        sendEmail({ childName, childAge, parentName, phone, timeSlot, comment })
            .catch(e => console.error('Email error:', e.message));

        return res.status(200).json({ success: true });

    } catch (e) {
        console.error('Error:', e.message);
        return res.status(500).json({ error: e.message });
    }
}

// ── Telegram ──────────────────────────────────────────────────────────────
async function sendTelegram({ childName, childAge, parentName, phone, timeSlot, comment }) {
    const text = [
        '🏅 <b>НОВАЯ ЗАЯВКА — RESOLUTE</b>',
        '',
        `👤 <b>Ребёнок:</b> ${esc(childName)}, ${Number(childAge)} лет`,
        `👨‍👩‍👧 <b>Родитель:</b> ${esc(parentName)}`,
        `📱 <b>Телефон:</b> ${esc(phone)}`,
        timeSlot ? `🎯 <b>Возрастная категория:</b> ${esc(timeSlot)}` : '',
        comment  ? `💬 <b>Коммент:</b> ${esc(comment)}` : '',
        '',
        `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
    ].filter(Boolean).join('\n');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

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
            signal: controller.signal,
        }
    );
    clearTimeout(timer);

    if (!tgRes.ok) throw new Error(`Telegram error: ${tgRes.status}`);
}

// ── Email ─────────────────────────────────────────────────────────────────
async function sendEmail({ childName, childAge, parentName, phone, timeSlot, comment }) {
    // Пропускаем, если почта не настроена
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

    const transporter = nodemailer.createTransport({
        host:   process.env.EMAIL_HOST || 'smtp.mail.ru',
        port:   Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

    const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;padding:24px;background:#f9f9f9;border-radius:8px">
  <h2 style="color:#0b1f3a;margin-top:0">🏅 Новая заявка — RESOLUTE</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px 0;color:#555;width:160px">Ребёнок</td><td style="padding:8px 0;font-weight:bold">${childName}, ${Number(childAge)} лет</td></tr>
    <tr><td style="padding:8px 0;color:#555">Родитель</td><td style="padding:8px 0">${parentName}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Телефон</td><td style="padding:8px 0">${phone}</td></tr>
    ${timeSlot ? `<tr><td style="padding:8px 0;color:#555">Категория</td><td style="padding:8px 0">${timeSlot}</td></tr>` : ''}
    ${comment  ? `<tr><td style="padding:8px 0;color:#555">Комментарий</td><td style="padding:8px 0">${comment}</td></tr>` : ''}
    <tr><td style="padding:8px 0;color:#555">Время</td><td style="padding:8px 0;color:#888;font-size:13px">${timestamp}</td></tr>
  </table>
</div>`;

    await transporter.sendMail({
        from:    `"RESOLUTE Сайт" <${process.env.EMAIL_USER}>`,
        to:      process.env.EMAIL_TO || 'info@resolute-club.ru',
        subject: `Новая заявка — ${childName}, ${Number(childAge)} лет`,
        html,
    });
}

// ── HTML-эскейп ───────────────────────────────────────────────────────────
function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
