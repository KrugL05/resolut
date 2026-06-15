// Конфиг PM2 для RESOLUTE.
// Запуск:  pm2 start ecosystem.config.cjs
// Секреты (Telegram/SMTP) держим в файле .env рядом с проектом — НЕ здесь.
module.exports = {
    apps: [
        {
            name: 'resolute',
            script: 'server.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            max_memory_restart: '200M',
            // --env-file: читаем секреты из .env (Telegram/SMTP).
            // --dns-result-order=ipv4first: на РФ-серверах (напр. Beget) у
            // api.telegram.org часто есть только IPv6-маршрут, который не
            // работает → fetch падает. Принудительно ходим по IPv4.
            node_args: '--env-file=.env --dns-result-order=ipv4first',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                HOST: '127.0.0.1',
            },
        },
        {
            // PocketBase — хранилище галереи/статей + админка для заказчика.
            // Бинарник скачивается на сервере в ./pocketbase/ (в git не коммитится),
            // схема коллекций берётся из ./pocketbase/pb_migrations (в git есть).
            name: 'pocketbase',
            script: './pocketbase/pocketbase',
            args: 'serve --http=127.0.0.1:8090 --dir=./pocketbase/pb_data --migrationsDir=./pocketbase/pb_migrations',
            interpreter: 'none',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            max_memory_restart: '200M',
        },
    ],
};
