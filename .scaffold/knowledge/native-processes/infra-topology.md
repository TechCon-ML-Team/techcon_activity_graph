# Топология инфраструктуры — TechCon Activity Graph

> Последнее обновление: 2026-06-25.

## Развёртывание

Сервис развёрнут на **Vercel** (serverless, без собственных ВМ TechCon).

| Платформа | Роль | Тип |
|---|---|---|
| Vercel | Serverless hosting (Node.js функции) | serverless / edge |

Серверная инфраструктура TechCon (yc-*) этим сервисом не используется.

## Runtime

| Компонент | Значение |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Точка входа | `src/main.ts` → Vercel build |
| Порт (локально) | 5100 (или `PORT` env var) |
| Vercel config | `vercel.json` — routes `src/main.ts` через `@vercel/node` |
| CI | `.github/workflows/node.js.yml` (Node.js CI) |

## Стек

| Компонент | Значение |
|---|---|
| Runtime | Node.js |
| Язык | TypeScript |
| Web-framework | Express.js |
| Деплой | Vercel (автоматически из main) |
| Сборка | `npm run build` |
| Мониторинг | ☐ не настроен (inaccessible — нет внешнего мониторинга) |

## Публичная поверхность

| Точка | URL | Примечание |
|---|---|---|
| Продакшн | ☐ Vercel-assigned domain (уточнить в Vercel dashboard) | |
| API `/graph` | `<vercel-url>/graph` | GitHub activity graph endpoint |
| API `/data` | `<vercel-url>/data` | Data endpoint |

> Точный Vercel production URL уточняется в Vercel dashboard (проект привязан к этому репо).

## Внешние зависимости

| Сервис | Назначение |
|---|---|
| Vercel | Hosting + деплой |
| GitHub API | Источник данных об активности |

## Классификация

Репозиторий классифицирован как **SUPPORT + LOW-TOUCH**: вспомогательный сервис с низкой изменчивостью. Изменения вносятся только при подтверждённой продуктовой необходимости.
