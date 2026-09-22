---
name: techcon-billing-protocol
description: Используй для воспроизводимого снятия затрат Yandex Cloud любого репозитория TechCon — baseline-расчёт, прогноз бюджета, сверка свежести или сводка расходов.
harness: org@56a6fcf9f3cd846d7238a9233b40f00eed7f22b0
---
# Протокол снятия затрат TechCon

Используй этот скилл, когда нужно посчитать затраты Yandex Cloud экосистемы TechCon —
baseline-расчёт, прогноз бюджета, сверка свежести или сводка расходов. Протокол
**воспроизводимый**: один и тот же ввод → один и тот же вывод, без эвристик «на глаз».
Применим из любого репозитория TechCon — не завязан на конкретный репозиторий вызова.

Два слоя:
1. **Расчёт** — детерминированная обёртка над `cost_control.py` (Decimal-точность, сценарии).
2. **Свежесть** — независимая сверка с актуальными данными биллинга через REST.

## Источник истины

| Источник | Где | Назначение |
|---------|-----|-----------|
| Калькулятор | `~/Repos/techcon_hub/scripts/cost_control.py` | детерминированный расчёт из billing workbook (xlsx) |
| Тесты калькулятора | `~/Repos/techcon_hub/tests/test_cost_control.py` | контракт расчёта (запускать в репозитории, где лежит скрипт) |
| Billing account | `dn26qcivkuh5q8ov1028` | единственный billing-аккаунт TechCon |
| Свой периметр (folder) | `b1g04ejboauabchemv0f` | folder-allowlist — ТОЛЬКО эти затраты наши |
| VM флот, cloud/folder | `~/Repos/techcon_infra_yac/INFRA.yaml` | сверка какие инстансы в нашем folder |

## 0. ОБЯЗАТЕЛЬНАЯ сегментация своё/чужое (folder-allowlist)

Billing-аккаунт `dn26qcivkuh5q8ov1028` может агрегировать **несколько облаков/folder-ов**, в т.ч.
чужие. Считать «всё что в аккаунте» — ошибка: завысишь бюджет чужими ресурсами.

**Правило:** наши затраты = ТОЛЬКО ресурсы в folder-allowlist `[b1g04ejboauabchemv0f]`.
Любой другой folder/cloud — **чужой**, исключается из расчёта явно (не молча).

Перед любым роллапом:

1. **Получи список наших инстансов** (джойн периметра):
   ```bash
   yc compute instance list --folder-id b1g04ejboauabchemv0f --format json
   ```
   Это набор ресурсов, затраты по которым считаем нашими. Всё вне этого набора — чужое.

2. **При разбивке биллинга по folder** оставляй ТОЛЬКО `b1g04ejboauabchemv0f`. Чужие folder-ы
   перечисли явно в выводе как исключённые (`excluded_folders: [...]`), а не отбрасывай тихо.

3. **Сверь с INFRA.yaml** — все инстансы из allowlist-folder должны присутствовать в INFRA.yaml;
   расхождение (инстанс в биллинге, но не в INFRA.yaml) — фиксируй как аномалию, не сглаживай.

## 1. Расчёт (обёртка cost_control.py)

`cost_control.py` — детерминированный калькулятор из billing workbook (xlsx). Считает baseline,
always-on базу, активный runtime и сценарии (baseline/growth/peak/idle) в Decimal-точности.
Внешний billing-компонент (если есть) подаётся отдельным sidecar-JSON и при отсутствии держится
явным нулём с пометкой (без тихой экстраполяции).

```bash
python3 ~/Repos/techcon_hub/scripts/cost_control.py \
  --input-xlsx {billing_workbook.xlsx} \
  --external-billing-json {external_billing.json} \
  --period-start YYYY-MM-DD \
  --period-end YYYY-MM-DD \
  --timezone Europe/Moscow \
  --output {out.json}
```

Контракт обязывает: явный период должен совпадать с периодом в workbook summary (иначе ошибка),
shared-затраты атрибутируются только нашим ресурсам, отсутствующие источники = явный ноль + assumption.
Результат (`out.json`) — `scenario_contract`, `yc_breakdown`, `workbook_observations`. Это
**воспроизводимая** часть: не пересказывай, прикладывай числа из JSON.

## 2. Свежесть через REST billing API (НЕ `yc billing`)

⚠ `yc billing` CLI-группы НЕТ в текущем профиле — не используй её. Свежесть берём через REST:

```
GET https://billing.api.cloud.yandex.net/billing/v1/billingAccounts/dn26qcivkuh5q8ov1028
Authorization: Bearer $(yc iam create-token)
```

Эндпоинты `billing.api.cloud.yandex.net/billing/v1` (billingAccount/service/sku) дают актуальное
состояние аккаунта и помогают сверить: не устарел ли workbook, не появились ли новые SKU/folder-ы.
IAM-токен бери через `yc iam create-token` в подстановке — **не печатай токен и не логируй заголовок
Authorization** (см. §Анти-паттерны).

**Живой роллап затрат пер-folder/пер-SKU через REST = HANDOFF.** Детальный usage-роллап требует
сервис-аккаунта с ролью `billing.accounts.viewer` на billing-аккаунте — у обычного профиля её нет
(403). Не пытайся обойти. Оформи HANDOFF оператору: запрос SA с `billing.accounts.viewer` +
критерий приёмки (GET по аккаунту отдаёт 200, usage-export доступен). До выдачи роли — свежесть
ограничена метаданными аккаунта, основной расчёт остаётся на `cost_control.py` из workbook.

## Минимальный вывод при использовании навыка

- billing account (`dn26qcivkuh5q8ov1028`) + folder-allowlist (`b1g04ejboauabchemv0f`)
- сегментация: список наших инстансов (из `--folder-id`), явный список исключённых чужих folder-ов
- расчётные числа из `out.json` `cost_control.py` (baseline/always-on/runtime/сценарии), не пересказ
- свежесть: статус сверки с REST billing (метаданные аккаунта) ИЛИ HANDOFF-пометка, если нужен SA
- расхождения биллинг↔INFRA.yaml, если есть

## Анти-паттерны

- Считать «всё в billing-аккаунте» без folder-allowlist — завышение бюджета чужими облаками.
- Тихо отбрасывать чужие folder-ы — их надо перечислить явно как `excluded`.
- `yc billing ...` — группы нет в профиле; свежесть только через REST `billing.api.cloud.yandex.net`.
- Печать/лог IAM-токена или заголовка `Authorization` (секрет в shell history/выводе).
- Личный «живой роллап» usage без SA `billing.accounts.viewer` — это 403, оформляй HANDOFF.
- Пересказ «затраты примерно столько-то» вместо детерминированных чисел из `cost_control.py`.
- Доверие памяти вместо `out.json`/INFRA.yaml — id folder-ов и SKU дрейфуют.
