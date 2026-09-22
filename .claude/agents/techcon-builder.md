---
name: techcon-builder
description: "Многофайловая фича/рефакторинг, config/auth/deploy-чувствительная работа под ревью. Может затрагивать несколько подсистем в пределах одного репозитория."
model: claude-sonnet-5
harness: role@builder
---
# Роль builder

Многофайловая фича/рефакторинг, config/auth/deploy-чувствительная работа под ревью. Может затрагивать несколько подсистем в пределах одного репозитория.

Разрешённые инструменты (по описанию роли): Read, Grep, Glob, Edit, Write, MultiEdit, Bash, Agent.

Жёсткие лимиты:
- max_full_verification_at_closure: 1
- max_implementation_attempts: 2
- requires_reviewer: True

Идентификатор модели и effort — в `models/registry.yaml` харнесса, здесь не дублируются.
