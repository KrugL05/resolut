# Деплой RESOLUTE на VPS (Beget / Timeweb)

Проект состоит из трёх частей:
- статический сайт (`public/`) — раздаёт **Nginx**;
- Node-API (`/api/submit-form`, заявка в Telegram/email) — **Express** под **PM2**;
- **PocketBase** — хранилище галереи (и в будущем статей) + админка, в которой
  заказчик сам управляет контентом. Тоже под **PM2**.

Nginx проксирует: `/api/submit-form` → Express, остальной `/api/` и `/_/` →
PocketBase. Подробнее — в `deploy/nginx.conf`.

## Что лежит в репозитории
- `server.js` — Express-сервер (API + fallback-раздача статики)
- `ecosystem.config.cjs` — конфиг PM2 (Express + PocketBase)
- `deploy/nginx.conf` — пример конфига Nginx
- `.env.example` — шаблон секретов (Telegram / SMTP)
- `pocketbase/pb_migrations/` — схема коллекций PocketBase (применяется автоматически).
  Сам бинарник PocketBase и данные (`pb_data`) в git **не** хранятся — скачиваются
  и наполняются на сервере.

---

## 1. Подготовка сервера (root по SSH)

```bash
apt update && apt upgrade -y
apt install -y nginx git

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm i -g pm2

# Firewall (опционально)
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## 2. Код и зависимости

```bash
mkdir -p /var/www
git clone <URL_РЕПОЗИТОРИЯ> /var/www/resolute
cd /var/www/resolute
npm install --omit=dev
```

## 3. Секреты (.env)

```bash
cp .env.example .env
nano .env   # вставить реальные TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SMTP-данные
```
Значения берутся из настроек проекта на Vercel (Environment Variables).

## 4. PocketBase (галерея / контент)

Скачать бинарник под Linux в папку `pocketbase/` (рядом уже лежат миграции схемы):

```bash
cd /var/www/resolute/pocketbase
PB_VER=0.39.4
curl -L -o pb.zip https://github.com/pocketbase/pocketbase/releases/download/v${PB_VER}/pocketbase_${PB_VER}_linux_amd64.zip
unzip -o pb.zip pocketbase && rm pb.zip
chmod +x pocketbase
cd /var/www/resolute
```

Создать админ-аккаунт (под ним заказчик заходит в админку — выдайте ему эти данные):

```bash
cd /var/www/resolute
./pocketbase/pocketbase superuser create ВАШ_EMAIL 'НАДЁЖНЫЙ_ПАРОЛЬ' \
  --dir=./pocketbase/pb_data
```

Коллекция `gallery` создастся автоматически при первом запуске (из `pb_migrations`).

## 5. Запуск под PM2 (Express + PocketBase)

```bash
cd /var/www/resolute
pm2 start ecosystem.config.cjs   # поднимет оба процесса: resolute + pocketbase
pm2 save
pm2 startup        # выполнить выведенную команду — автозапуск после ребута
pm2 status
```

## 6. Nginx

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/resolute
ln -s /etc/nginx/sites-available/resolute /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default   # убрать дефолтный сайт
nginx -t
systemctl reload nginx
```

## 7. Проверка

```bash
# Форма заявки → Express
curl -X POST http://127.0.0.1:3000/api/submit-form \
  -H "Content-Type: application/json" \
  -d '{"childName":"Тест","childAge":"10","parentName":"Родитель","phone":"+79991234567"}'

# Галерея → PocketBase (должен вернуть JSON со списком, даже пустым)
curl http://127.0.0.1:8090/api/collections/gallery/records
```
Затем открыть в браузере:
- `http://<IP_СЕРВЕРА>/` — сайт грузится, форма отправляется (приходит в Telegram);
- `http://<IP_СЕРВЕРА>/_/` — админка PocketBase (вход под созданным аккаунтом),
  загрузить фото в коллекцию `gallery` → они появятся в галерее на сайте.

> ⚠️ Админка PocketBase отдаёт логин/пароль по сети — заходить в неё стоит уже по
> HTTPS (см. шаг 8). До выпуска SSL пользуйтесь ей аккуратно.

## 8. SSL (когда появится домен)

```bash
# направить A-запись домена на IP, затем:
apt install -y certbot python3-certbot-nginx
certbot --nginx -d example.ru -d www.example.ru
```
Certbot сам пропишет 443 и редирект, настроит автопродление. После этого в
`deploy/nginx.conf` заменить `server_name _;` на домен.

---

## Обновление кода в будущем

```bash
cd /var/www/resolute
git pull
npm install --omit=dev
pm2 restart resolute      # перезапустить сайт/API
# при изменении схемы PocketBase (новые миграции): pm2 restart pocketbase
```

## Бэкап контента

Все фото и данные галереи лежат в `pocketbase/pb_data/`. Для резервной копии
достаточно сохранить эту папку:

```bash
tar czf pb_backup_$(date +%F).tar.gz -C /var/www/resolute pocketbase/pb_data
```
