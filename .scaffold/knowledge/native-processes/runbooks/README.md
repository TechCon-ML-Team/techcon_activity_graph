# Runbook-ы — TechCon Activity Graph

> Последнее обновление: 2026-06-25.
> Сервис классифицирован как SUPPORT + LOW-TOUCH. Vercel-деплой.

## Ключевые runbook-и

- `deploy.md` — деплой на Vercel
  - Автоматически: push в `main` → Vercel production deploy
  - PR → Vercel preview deploy (автоматически)
  - Ручной деплой: `vercel --prod` (Vercel CLI)
  - CI: `.github/workflows/node.js.yml` (lint + build проверка)

- `rollback.md` — откат на Vercel
  - Через Vercel dashboard: Deployments → выбрать предыдущий деплой → Promote to Production
  - Или: откатить коммит в `main` → Vercel автоматически пересоберёт

- `restart.md` — перезапуск
  - Vercel serverless — нет постоянного процесса, перезапуск = redeploy
  - Redeploy: Vercel dashboard → Deployments → Redeploy

- `key-rotation.md` — ротация секретов
  - GitHub token и другие env vars: Vercel dashboard → Settings → Environment Variables
  - После обновления переменных: trigger redeploy

- `incident-response.md` — первые шаги при инциденте
  - Проверить статус Vercel: https://www.vercel-status.com/
  - Логи функций: Vercel dashboard → Deployments → Functions → Logs
  - Проверить GitHub API status (если проблема с данными)
  - Rollback через Vercel dashboard при необходимости

- `local-debug.md` — локальная отладка
  - `npm install && npm run dev:start` — локальный запуск на порту 5100
  - `npm run build` — проверка сборки TypeScript
  - `npx jest` — запуск тестов
