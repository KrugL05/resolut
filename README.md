# RESOLUTE — Клуб Спортивного Чирлидинга
### Сайт-визитка с формой заявок

---

## Структура проекта

```
resolute/
├── public/                        ← Веб-корень (выкладывается на хостинг)
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
│   │   ├── form.js                ← Валидация, отправка (Telegram + Sheets)
│   │   └── animations.js          ← Появление элементов при скролле
│   └── assets/
│       └── images/
│           ├── hero/              ← hero.jpg, hero2.jpg
│           ├── coaches/           ← coach1.jpg, coach2.jpg, coach3.jpg
│           └── gallery/           ← photo1.jpg … photo20.jpg
│
├── backend/
│   ├── google-apps-script.gs      ← Скрипт для Google Sheets (вставить в Apps Script)
│   └── README.md                  ← Полная инструкция по настройке и деплою
│
└── README.md                      ← Этот файл
```

---

## Быстрый старт

### 1. Настройте форму
Читайте `backend/README.md` — там пошаговые инструкции по Telegram Bot и Google Sheets.

### 2. Локальная проверка
Откройте `public/index.html` в браузере — сайт работает без сервера.

> ⚠️ Для тестирования формы используйте Live Server (VS Code) или локальный сервер,
> чтобы CORS не блокировал fetch-запросы к Telegram и Sheets.

```bash
# Python (встроен в macOS/Linux)
cd public && python3 -m http.server 8080

# Node.js
npx serve public

# VS Code: установите расширение "Live Server", нажмите Go Live
```

### 3. Деплой
Содержимое папки `public/` → на хостинг.
Подробности в `backend/README.md` раздел "Деплой фронтенда".

---

## Технологии
- **HTML5, CSS3, Vanilla JS** — без фреймворков, без сборки
- **Google Fonts** — Oswald + Raleway
- **Telegram Bot API** — уведомления о заявках
- **Google Apps Script** — бесплатное хранение заявок в Google Sheets

---

## Добавление фотографий в галерею
1. Добавьте фото в `public/assets/images/gallery/` (photo21.jpg и т.д.)
2. Откройте `public/js/gallery.js`
3. Добавьте путь в массив `GALLERY_PHOTOS`
