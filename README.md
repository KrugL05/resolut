# RESOLUTE — Клуб Спортивного Чирлидинга
### Сайт-визитка с формой заявок

---

## Структура проекта

```
resolute/
├── public/                        ← Веб-корень (Vercel отдаёт отсюда)
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
│   │   ├── form.js                ← Валидация и отправка заявки в Telegram
│   │   └── animations.js          ← Появление элементов при скролле
│   └── assets/
│       └── images/
│           ├── hero/              ← hero.jpg, hero2.jpg
│           ├── coaches/           ← coach1.jpg, coach2.jpg, coach3.jpg
│           └── gallery/           ← photo1.jpg … photo23.jpg
│
├── api/
│   └── submit-form.js             ← Vercel Serverless Function: отправка в Telegram
│
├── vercel.json                    ← Роутинг: всё из public/, /api/* — функции
└── README.md                      ← Этот файл
```

---

## Как работает форма заявки

```
Пользователь заполняет форму
         │
         ▼
   public/js/form.js
         │
         ▼
   POST /api/submit-form
  (Vercel Serverless Function)
         │
         ▼
   Telegram Bot API
  (уведомление администратору)
```

Токены Telegram хранятся в переменных окружения Vercel — не в коде фронтенда.

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

### Шаг 3 — Прописать переменные окружения в Vercel
В панели Vercel → Settings → Environment Variables:

| Переменная | Значение |
|---|---|
| `TELEGRAM_BOT_TOKEN` | токен от BotFather |
| `TELEGRAM_CHAT_ID` | chat_id куда приходят заявки |

### Проверка
```
https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>&text=Тест
```
Должно прийти сообщение «Тест».

---

## Локальная разработка

Сайт работает без сервера — откройте `public/index.html` в браузере.

Для тестирования формы (вызов `/api/submit-form`) нужен Vercel CLI:
```bash
npm i -g vercel
vercel dev
```
Это поднимает локальный сервер на `http://localhost:3000` с работающими функциями.

---

## Деплой

Проект задеплоен на **Vercel**. Каждый push в `master` → автоматический деплой.

Ручной деплой через CLI:
```bash
vercel --prod
```

---

## Технологии
- **HTML5, CSS3, Vanilla JS** — без фреймворков, без сборки
- **Google Fonts** — Oswald + Raleway
- **Vercel Serverless Functions** — безопасная отправка токенов на сервере
- **Telegram Bot API** — мгновенные уведомления о заявках
- **Nodemailer** — отправка заявок на корпоративную почту

---

## Настройка Email (корпоративная почта)

Когда почта будет готова, добавьте в Vercel Environment Variables:

| Переменная | Пример | Описание |
|---|---|---|
| `EMAIL_HOST` | `smtp.mail.ru` | SMTP-сервер провайдера |
| `EMAIL_PORT` | `587` | Порт (587 = STARTTLS) |
| `EMAIL_USER` | `info@resolute-club.ru` | Логин/адрес отправителя |
| `EMAIL_PASS` | `••••••••` | Пароль или app-password |
| `EMAIL_TO` | `info@resolute-club.ru` | Куда приходят заявки |

Пока переменные не заданы — email молча пропускается, Telegram работает в штатном режиме.

---

## Добавление фотографий в галерею
1. Добавьте фото в `public/assets/images/gallery/` (photo24.jpg и т.д.)
2. Откройте `public/js/gallery.js`
3. Добавьте путь в массив `GALLERY_PHOTOS`

---

## Чеклист перед деплоем
- [ ] Задать `TELEGRAM_BOT_TOKEN` в Vercel Environment Variables
- [ ] Задать `TELEGRAM_CHAT_ID` в Vercel Environment Variables
- [ ] Задать `EMAIL_*` переменные когда корпоративная почта будет готова
- [ ] Проверить форму: заявка приходит в Telegram
- [ ] Обновить телефон в `index.html` (футер)
- [ ] Обновить Telegram-ссылку в `index.html` (`@resolute_cheer` → реальная)
- [ ] Уточнить расписание в `index.html`
- [ ] Заменить фото тренеров (`assets/images/coaches/`)
