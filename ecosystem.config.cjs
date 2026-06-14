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
            // Node 20+ сам читает .env через --env-file; для совместимости
            // оставляем только PORT здесь, остальное — из .env.
            node_args: '--env-file=.env',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                HOST: '127.0.0.1',
            },
        },
    ],
};
