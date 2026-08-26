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
| Продакшн | `https://techcon-activity-graph.vercel.app` | стабильный алиас проекта; проверено живьём 2026-08-26 |
| API `/graph` | `<vercel-url>/graph` | агрегат по `TOKEN_*`; живьём `200`, настоящий график, `cache-control: public, max-age=1800` |
| API `/graph?username=…` | `<vercel-url>/graph?username=<login>` | ⚠ **деградирован** на 2026-08-26, см. ниже |
| API `/data` | `<vercel-url>/data` | Data endpoint |

> Адрес установлен по Deployments API GitHub и проверен живьём (2026-08-26):
> корень отдаёт заголовок приложения, `/graph` без параметров — настоящий SVG-график.
>
> **Не используй адрес конкретного развёртывания** вида
> `…-kb0r5nriw-pyramidheadsharks-projects.vercel.app` — он меняется при каждом
> деплое и отдаёт `302` на аутентификацию Vercel. Публично отвечает (`200`)
> только стабильный алиас выше.
>
> **Известная деградация (замер 2026-08-26).** Однопользовательская ветка
> `/graph?username=<login>` в проде отдаёт `200`, но не график, а карточку ошибки
> `Can't fetch any contribution. Please check your username 😬` с
> `cache-control: no-store, max-age=0`. Проверено на трёх разных логинах
> (`pyramidheadshark`, `ashutosh00710`, `torvalds`) — значит, дело не в логине.
> Эта ветка (`handlers.getGraph` → `new Fetcher(username)`) использует переменную
> окружения `TOKEN`; многопользовательская ветка (`Fetcher.fetchAllContributions`,
> переменные `TOKEN_*`) в том же деплое работает. Вывод (выведено из различия двух
> веток, не подтверждено доступом к панели): прод-значение `TOKEN` в Vercel
> просрочено или отсутствует. Тот же секрет в CI (`secrets.TOKEN`) был невалиден
> до ~2026-08-14 и с тех пор чинён — прод-копия осталась старой.

## Внешние зависимости

| Сервис | Назначение |
|---|---|
| Vercel | Hosting + деплой |
| GitHub API | Источник данных об активности |

## Классификация

Репозиторий классифицирован как **SUPPORT + LOW-TOUCH**: вспомогательный сервис с низкой изменчивостью. Изменения вносятся только при подтверждённой продуктовой необходимости.
