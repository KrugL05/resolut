// api/submit-form.js
// Vercel Serverless Function — аналог netlify/functions/submit-form.js
// Папка api/ должна лежать в КОРНЕ репозитория (рядом с public/)

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { childName, childAge, parentName, phone, timeSlot, comment } = req.body;

    if (!childName || !parentName || !phone) {
        return res.status(422).json({ error: 'Missing required fields' });
    }

    try {
        const text = [
            '🏅 <b>НОВАЯ ЗАЯВКА — RESOLUTE</b>',
            '',
            `👤 <b>Ребёнок:</b> ${esc(childName)}, ${Number(childAge)} лет`,
            `👨‍👩‍👧 <b>Родитель:</b> ${esc(parentName)}`,
            `📱 <b>Телефон:</b> ${esc(phone)}`,
            timeSlot ? `⏰ <b>Время:</b> ${esc(timeSlot)}` : '',
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

        console.log('Telegram:', tgRes.ok ? 'ok' : `error ${tgRes.status}`);

        return res.status(tgRes.ok ? 200 : 500).json({ success: tgRes.ok });

    } catch (e) {
        console.error('Error:', e.message);
        return res.status(500).json({ error: e.message });
    }
}

function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}