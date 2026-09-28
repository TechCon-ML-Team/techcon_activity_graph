# Techcon Activity Graph — Agent Guide

## Overview
- This repo is part of the TechCon working set.
- Use repo-local docs/status for task-specific truth, and use the hub-level access surface for no-secrets infra access guidance.

<!-- techcon-hub:agent-rules:begin sha256:5925190641c3cdc5cf28e293a3e7a21297639964d76e8b65a0e3c9e91dd95b7e -->
<!-- СГЕНЕРИРОВАНО compiler/render_agents_fragment.py — не редактировать руками. -->
<!-- Источники: policy/prompt.yaml, models/registry.yaml, roles/*.yaml -->

Закон первенства: решение владельца > живое состояние > планы. Проигравший документ исправляется, не аннотируется. Классы решений: A — владелец, B — агент+запись+ревью, C — агент сам. Полный текст и обоснование — docs/precedence.md в techcon_agent_harness.
Проверка харнесса. В начале сессии выполни одну команду: `python3 /opt/techcon-harness/cli/doctor_machine.py --machine`. Если она сообщает «не развёрнуто» или файла нет, скажи пользователю, что защитные хуки не установлены, и покажи ему текст `.agents/HARNESS-INSTALL.md`. Установку сам не запускай: она требует sudo, а его выполняет только человек.

| Тир | Назначение | Claude | Codex |
|---|---|---|---|
| scout | Чтение, поиск, статус-проверки, форматирование одного файла. Никогда не принимает решений с необратимым эффектом и не эскалирует сам себя. | claude-haiku-4-5-20251001 | gpt-5.6-luna |
| fixer | Сфокусированное исправление одного модуля/бага, целевые тесты. Не трогает архитектуру, не расширяет область задачи за пределы названного модуля. | claude-sonnet-5 | gpt-5.6-luna |
| builder | Многофайловая фича/рефакторинг, config/auth/deploy-чувствительная работа под ревью. Может затрагивать несколько подсистем в пределах одного репозитория. | claude-sonnet-5 | gpt-5.6-terra |
| solver | Кросс-репозиторная архитектура, конфликтующие свидетельства, необратимые или дорогие изменения. Обязателен журнал решений и план отката до исполнения. | claude-opus-5 | gpt-5.6-sol |
| planner-reviewer | Планирование ПЕРЕД реализацией и независимое ревью результатов ПОСЛЕ (гейты §6 плана программы). Никогда не совмещается с ролью, которую проверяет — ревьюер конкретного PR не может быть автором того же PR (git-контракт). | claude-opus-5 | gpt-6-astra |
<!-- techcon-hub:agent-rules:end -->
