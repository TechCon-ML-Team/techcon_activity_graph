<!-- scaffold:generated — не редактировать вручную. Обновить: scaffold init --force -->

# Scaffold — github-readme-activity-graph

Этот проект управляется через **pi-scaffold** — AI-оболочку с архитектурным агентом prime.

## Запуск

```bash
scaffold          # TUI-режим (интерактивный чат — основной)
scaffold run --agent prime "задача"  # headless / CI
scaffold status   # состояние gates и сессий
```

## Структура .scaffold/

| Файл | Назначение |
|---|---|
| `context.md` | Архитектурные факты — читать ДО изменений |
| `rules.md` | Нормы работы, запреты |
| `constraints.md` | Технические инварианты (нельзя нарушать) |
| `done-criteria.md` | Критерии готовности задачи |
| `roles/*.md` | Агенты (prime, build, explore, review) |
| `pipeline/events.jsonl` | Audit trail — gate события |
| `tasks/` | Текущие диагнозы и планы задач |

## Работа с prime-агентом

Prime — стратегический агент. Не объясняй ему структуру — он сам читает context.md.

**Поток:** задача → clarification → диагностика → план + approval → делегирование build → коммит

**Approval:** после показа плана prime ждёт явного «да» перед реализацией.

**Как давать задачи:** «В {компонент} {что не работает / чего нет}. Разберись.»
Не диктуй конкретные файлы — prime сделает диагностику сам.

## Контекст проекта

> Полная архитектура — в `.scaffold/context.md`.

## Стек (автообнаружено)
- Язык: TypeScript / Express
- Пакеты: npm
- Тесты: Jest (`npx jest`)

## Нативное операционное знание

Следующие файлы содержат данные об инфраструктуре и операционных процедурах проекта
(указатели и алиасы, без секретов). Стандарт: `docs/NATIVE_PROCESS_STANDARD.md` в pi-scaffold.

@.scaffold/knowledge/native-processes/infra-topology.md
@.scaffold/knowledge/native-processes/access-map.md
@.scaffold/knowledge/native-processes/runbooks/README.md
