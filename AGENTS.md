# Techcon Activity Graph — Agent Guide

## Overview
- This repo is part of the TechCon working set.
- Use repo-local docs/status for task-specific truth, and use the hub-level access surface for no-secrets infra access guidance.

<!-- techcon-hub:agent-rules:begin sha256:869ed2cfca36144370c28ea7cbbdce34e034dd37093e331eb35d9c3e6bb0eff2 -->
<!-- СГЕНЕРИРОВАНО compiler/render_agents_fragment.py — не редактировать руками. -->
<!-- Источники: policy/prompt.yaml, models/registry.yaml, roles/*.yaml -->

Закон первенства: решение владельца > живое состояние > планы. Проигравший документ исправляется, не аннотируется. Классы решений: A — владелец, B — агент+запись+ревью, C — агент сам. Полный текст и обоснование — docs/precedence.md в techcon_agent_harness.

| Тир | Назначение | Claude | Codex |
|---|---|---|---|
| scout | Чтение, поиск, статус-проверки, форматирование одного файла. Никогда не принимает решений с необратимым эффектом и не эскалирует сам себя. | claude-haiku-4-5-20251001 | gpt-5.6-luna |
| fixer | Сфокусированное исправление одного модуля/бага, целевые тесты. Не трогает архитектуру, не расширяет область задачи за пределы названного модуля. | claude-sonnet-5 | gpt-5.6-luna |
| builder | Многофайловая фича/рефакторинг, config/auth/deploy-чувствительная работа под ревью. Может затрагивать несколько подсистем в пределах одного репозитория. | claude-sonnet-5 | gpt-5.6-terra |
| solver | Кросс-репозиторная архитектура, конфликтующие свидетельства, необратимые или дорогие изменения. Обязателен журнал решений и план отката до исполнения. | claude-opus-5 | gpt-5.6-sol |
| planner-reviewer | Планирование ПЕРЕД реализацией и независимое ревью результатов ПОСЛЕ (гейты §6 плана программы). Никогда не совмещается с ролью, которую проверяет — ревьюер конкретного PR не может быть автором того же PR (git-контракт). | claude-opus-5 | gpt-6-astra |
<!-- techcon-hub:agent-rules:end -->
