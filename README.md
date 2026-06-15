# RESOLUTE — Клуб Спортивного Чирлидинга
### Сайт-визитка с формой заявок

Статический сайт (vanilla JS, без сборки) + лёгкий Node-API для приёма заявок
(Telegram + email). Развёрнут на **VPS** под Nginx + Node (Express) + PM2.

> 📘 Пошаговая инструкция по развёртыванию на сервере — в [DEPLOY.md](DEPLOY.md).

---

## Структура проекта

```
resolute/
├── public/                        ← Веб-корень (Nginx отдаёт статику отсюда)
│   ├── index.html                 ← Единственная страница (SPA)
│   ├── css/
│   │   ├── variables.css          ← Цвета, шрифты, токены
│   │   ├── base.css               ← Сброс стилей, кнопки, утилиты
│   │   ├── nav.css                ← Шапка и мобильное меню
│   │   ├── hero.css               ← Главный экран
│   │   ├── sections.css           ← О нас, Достижения, Тренеры, Расписание
│   │   ├── gallery.css            ← Фотогалерея и лайтбокс
│   │   ├── form.css               ← Форма заявки
│   │   └── footer.css             ← Подвал
│   ├── js/
│   │   ├── nav.js                 ← Бургер, скролл, активный пункт меню
│   │   ├── gallery.js             ← Генерация галереи, лайтбокс, свайп
│   │   ├── form.js                ← Валидация и отправка заявки на /api
│   │   └── animations.js          ← Появление элементов при скролле
│   └── assets/
│       └── images/
│           ├── hero/              ← hero.jpg, hero2.jpg
│           ├── coaches/           ← coach1.jpg, coach2.jpg, coach3.jpg
│           └── gallery/           ← photo1.jpg … photo23.jpg
│
├── api/
│   └── submit-form.js             ← Обработчик заявки: Telegram + email (nodemailer)
│
├── server.js                      ← Express-сервер: монтирует /api/submit-form + раздаёт статику
├── ecosystem.config.cjs           ← Конфиг PM2 (постоянный Node-процесс)
├── deploy/
│   └── nginx.conf                 ← Пример конфига Nginx (статика + прокси /api/)
├── .env.example                   ← Шаблон переменных окружения (секреты)
├── DEPLOY.md                      ← Инструкция по деплою на VPS
└── README.md                      ← Этот файл
```

---

## Архитектура на VPS

```
                 ┌──────────────────────────────┐
   Браузер  ───▶ │            Nginx :80          │
                 │  • статика из public/         │
                 │  • SPA-fallback → index.html  │
                 └──────────────┬───────────────┘
                                │  /api/*  (proxy_pass)
                                ▼
                 ┌──────────────────────────────┐
                 │   Node + Express  :3000       │  ← под управлением PM2
                 │     server.js → api/submit-form.js
                 └──────────────┬───────────────┘
                                ▼
                     Telegram Bot API  +  SMTP (nodemailer)
```

- **Nginx** раздаёт статику напрямую и проксирует только `/api/*` на Node.
- **Express** (`server.js`) переиспользует обработчик `api/submit-form.js`.
- **PM2** держит Node-процесс живым и поднимает его после перезагрузки сервера.
- Секреты (Telegram/SMTP) лежат в `.env` на сервере — не в коде и не в репозитории.

---

## Как работает форма заявки

```
Пользователь заполняет форму
         │
         ▼
   public/js/form.js
         │
         ▼
   POST /api/submit-form   ──(Nginx proxy)──▶  Node/Express → api/submit-form.js
         │
         ├──▶ Telegram Bot API  (мгновенное уведомление администратору)
         └──▶ SMTP / nodemailer (письмо на корпоративную почту, опционально)
```

Токены Telegram и SMTP хранятся в переменных окружения сервера (`.env`) —
не в коде фронтенда.

---

## Локальная разработка

Зависимости и запуск:
```bash
npm install
cp .env.example .env      # заполнить TELEGRAM_* (и при желании EMAIL_*)
npm start                 # node server.js → http://localhost:3000
```
`server.js` сам раздаёт статику из `public/` и обслуживает `/api/submit-form`,
так что форму можно тестировать локально без Nginx.

> Для быстрого просмотра вёрстки без API можно просто открыть `public/index.html`
> в браузере, но тогда отправка формы работать не будет.

### Галерея (PocketBase) локально

Фото галереи хранятся в PocketBase. Чтобы тестировать галерею с реальными
данными, поднимите его рядом (бинарник скачивается в `pocketbase/`, в git не
коммитится):

```bash
cd pocketbase
./pocketbase serve --http=127.0.0.1:8090   # на Windows: pocketbase.exe
```

Админка — http://127.0.0.1:8090/_/, коллекция `gallery` создастся из миграций
автоматически. Если PocketBase **не** запущен — галерея показывает статичные фото
из `FALLBACK_PHOTOS` в [public/js/gallery.js](public/js/gallery.js) (тот же
механизм работает и на демо GitHub Pages).

---

## Переменные окружения

Все переменные читает обработчик `api/submit-form.js`. Шаблон — в [.env.example](.env.example).

| Переменная | Пример | Описание |
|---|---|---|
| `PORT` | `3000` | Порт Node-сервера (Nginx проксирует сюда) |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC...` | Токен бота от BotFather |
| `TELEGRAM_CHAT_ID` | `-100123456789` | Куда приходят заявки |
| `EMAIL_HOST` | `smtp.mail.ru` | SMTP-сервер (опционально) |
| `EMAIL_PORT` | `587` | Порт (587 = STARTTLS) |
| `EMAIL_USER` | `info@resolute-club.ru` | Логин/адрес отправителя |
| `EMAIL_PASS` | `••••••••` | Пароль или app-password |
| `EMAIL_TO` | `info@resolute-club.ru` | Получатель писем |

Если `EMAIL_*` не заданы — отправка email молча пропускается, Telegram работает
в штатном режиме.

---

## Настройка Telegram Bot

### Шаг 1 — Создать бота
1. Напишите в Telegram: `@BotFather`
2. Отправьте команду: `/newbot`
3. Скопируйте **Bot Token** (формат: `цифры:буквы_и_цифры`)

### Шаг 2 — Получить Chat ID
1. Напишите боту любое сообщение
2. Откройте в браузере:
   ```
   https://api.telegram.org/bot<ВАШ_TOKEN>/getUpdates
   ```
3. В ответе найдите `"chat":{"id": XXXXXXXXX}`

Для группы/канала: добавьте бота, сделайте его администратором — Chat ID будет отрицательным.

### Шаг 3 — Прописать в `.env` на сервере
```
TELEGRAM_BOT_TOKEN=токен_от_BotFather
TELEGRAM_CHAT_ID=chat_id_куда_приходят_заявки
```
После изменения `.env`: `pm2 restart resolute`.

### Проверка
```
https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>&text=Тест
```
Должно прийти сообщение «Тест».

---

## Деплой на VPS (кратко)

Полная инструкция — в [DEPLOY.md](DEPLOY.md). Вкратце:

```bash
# на сервере
git clone <URL_РЕПОЗИТОРИЯ> /var/www/resolute
cd /var/www/resolute
npm install --omit=dev
cp .env.example .env && nano .env        # вписать секреты

pm2 start ecosystem.config.cjs
pm2 save && pm2 startup

cp deploy/nginx.conf /etc/nginx/sites-available/resolute
ln -s /etc/nginx/sites-available/resolute /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### Обновление кода
```bash
cd /var/www/resolute
git pull
npm install --omit=dev
pm2 restart resolute
```

### SSL
Когда домен будет направлен на VPS — выпускается бесплатный сертификат Let's Encrypt
через `certbot --nginx` (подробнее в [DEPLOY.md](DEPLOY.md)).

---

## Технологии
- **HTML5, CSS3, Vanilla JS** — без фреймворков, без сборки
- **Google Fonts** — Oswald + Raleway
- **Node.js + Express** — лёгкий API-сервер
- **PM2** — менеджер процессов (автозапуск, рестарты)
- **Nginx** — раздача статики и обратный прокси для `/api/`
- **Telegram Bot API** — мгновенные уведомления о заявках
- **Nodemailer** — отправка заявок на корпоративную почту

---

## Добавление фотографий в галерею
1. Добавьте фото в `public/assets/images/gallery/` (photo24.jpg и т.д.)
2. Откройте `public/js/gallery.js`
3. Добавьте путь в массив `GALLERY_PHOTOS`

---

## Чеклист перед запуском
- [ ] Создать `.env` на сервере из `.env.example`
- [ ] Задать `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`
- [ ] Задать `EMAIL_*` переменные, когда корпоративная почта будет готова
- [ ] Запустить под PM2 (`pm2 start ecosystem.config.cjs`, `pm2 save`)
- [ ] Настроить Nginx (`deploy/nginx.conf`) и перезагрузить его
- [ ] Проверить форму: заявка приходит в Telegram
- [ ] Выпустить SSL-сертификат, когда домен будет привязан
- [ ] Обновить телефон в `index.html` (футер)
- [ ] Обновить Telegram-ссылку в `index.html` на реальную
- [ ] Уточнить расписание в `index.html`
- [ ] Заменить фото тренеров (`assets/images/coaches/`)
