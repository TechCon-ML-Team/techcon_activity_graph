# Карта доступа — TechCon Activity Graph

> Только публичные URL и точки доступа. Без ключей и токенов.
> Последнее обновление: 2026-06-25.

## SSH-алиасы

Сервис развёрнут на Vercel — SSH-доступ к серверам не требуется.
Для управления деплоем используется Vercel CLI или Vercel dashboard.

## Публичные URL

| Среда | URL | Примечание |
|---|---|---|
| Продакшн | `https://techcon-activity-graph.vercel.app` | автоматически из `main`; стабильный алиас, проверено живьём 2026-08-26 (`200`) |
| Preview | адрес развёртывания вида `…-<hash>-<owner>.vercel.app` | генерируется при PR/push, меняется каждый раз; закреплять в документации нельзя |
| API `/graph` | `<vercel-url>/graph` | основной endpoint; ветка `?username=…` деградирована с 2026-08-26 — см. `infra-topology.md` |
| API `/data` | `<vercel-url>/data` | data endpoint |

> Canonical URL — стабильный алиас выше; он и есть точка входа продакшна.
> В Vercel dashboard уточнять больше нечего.

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
