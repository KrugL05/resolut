/* ═══════════════════════════════════════
   RESOLUTE — Node/Express сервер для VPS
   Раздаёт API /api/submit-form и (как fallback) статику из public/.
   На проде статику обычно отдаёт Nginx, а сюда проксируется только /api/*.
   ═══════════════════════════════════════ */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import submitForm from './api/submit-form.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Парсинг JSON-тела → даёт req.body, который ожидает хендлер
app.use(express.json());

// ── API ───────────────────────────────────────────────────────────────────
app.post('/api/submit-form', submitForm);

// ── Статика (fallback, если Nginx не используется) ─────────────────────────
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// SPA-fallback: любые прочие GET-маршруты → index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
    console.log(`RESOLUTE server listening on http://${HOST}:${PORT}`);
});
