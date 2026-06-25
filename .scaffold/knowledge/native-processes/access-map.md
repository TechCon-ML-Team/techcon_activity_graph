# Карта доступа — TechCon Activity Graph

> Только публичные URL и точки доступа. Без ключей и токенов.
> Последнее обновление: 2026-06-25.

## SSH-алиасы

Сервис развёрнут на Vercel — SSH-доступ к серверам не требуется.
Для управления деплоем используется Vercel CLI или Vercel dashboard.

## Публичные URL

| Среда | URL | Примечание |
|---|---|---|
| Продакшн | ☐ Vercel production URL (уточнить в Vercel dashboard) | автоматически из `main` |
| Preview | ☐ Vercel preview URL (генерируется при PR/push) | |
| API `/graph` | `<vercel-url>/graph` | основной endpoint |
| API `/data` | `<vercel-url>/data` | data endpoint |

> Canonical URL уточняется в Vercel dashboard проекта `techcon_activity_graph`.

## Локальный запуск

```bash
npm install
npm run dev:start   # порт 5100
```

## Секреты (где искать — не здесь)

| Переменная | Где хранится |
|---|---|
| GitHub token (если используется) | Vercel environment variables (dashboard) |
| Vercel deploy token | GitHub Actions secrets (если есть CI деплой) |
