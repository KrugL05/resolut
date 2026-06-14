# Деплой RESOLUTE на VPS (Beget / Timeweb)

Проект — статический сайт (`public/`) + Node-API (`/api/submit-form`, отправка
заявки в Telegram и на email). На VPS статику раздаёт **Nginx**, API крутится в
**Node (Express)** под **PM2**, Nginx проксирует на него `/api/`.

## Что лежит в репозитории
- `server.js` — Express-сервер (API + fallback-раздача статики)
- `ecosystem.config.cjs` — конфиг PM2
- `deploy/nginx.conf` — пример конфига Nginx
- `.env.example` — шаблон секретов (Telegram / SMTP)

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

## 4. Запуск под PM2

```bash
cd /var/www/resolute
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup        # выполнить выведенную команду — автозапуск после ребута
pm2 status
```

## 5. Nginx

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/resolute
ln -s /etc/nginx/sites-available/resolute /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default   # убрать дефолтный сайт
nginx -t
systemctl reload nginx
```

## 6. Проверка

```bash
# API напрямую
curl -X POST http://127.0.0.1:3000/api/submit-form \
  -H "Content-Type: application/json" \
  -d '{"childName":"Тест","childAge":"10","parentName":"Родитель","phone":"+79991234567"}'
```
Затем открыть `http://<IP_СЕРВЕРА>/` в браузере и отправить форму — заявка должна
прийти в Telegram.

## 7. SSL (когда появится домен)

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
pm2 restart resolute
```
