---
name: techcon-infra-access
description: Полная карта доступов для работы в любом techcon_* репозитории — SSH/VM, GitHub, GitLab, YC CLI, Linear, пути к знаниям хаба. Протокол поддержания TECHCON_ACCESS.md в дочерних репо.
---

# Инфраструктурный доступ TechCon

Используй этот скилл в любом `techcon_*` репозитории, чтобы получить полную карту доступов и знать что можно делать без подтверждения оператора.

## Канонические источники истины

| Источник | Путь | Назначение |
|---------|------|-----------|
| SSH + VM fleet | `~/Repos/techcon_hub/canon/ecosystem/ssh-access-guide.md` | Маршруты, ключи, статус VM |
| VM флот (machine-readable) | `~/Repos/techcon_hub/INFRA.yaml` | IP, роли, спеки VM |
| Хабовый статус | `~/Repos/techcon_hub/canon/GUIDE.md` + `canon/problems/*.yaml` | Ориентация + открытые карточки |
| Доступ в child repo | `{repo}/TECHCON_ACCESS.md` | Локальное зеркало для агентов |

## 1. SSH / YC VMs

### Инвентарь (всегда проверять командой, не по памяти)

```bash
# Текущее состояние VM (read-only, безопасно)
yc compute instance list

# Детали конкретной VM
yc compute instance get --name {name}
```

### VM флот

> ⚠ Таблица адресов здесь больше НЕ ведётся. Она пережила переезд на
> инфраструктуру v2 в неизменном виде и три месяца подсказывала агентам путь к
> машинам `yc-ops-01`, `yc-dev-stand-01` и `yc-cpu-worker-01`, помеченным здесь
> как `always_on`, — при том что в облаке их нет вовсе (`status: deleted` в
> `INFRA.yaml`). Документ, дублирующий реестр, не ломается в момент гашения
> машины: он продолжает уверенно вести в пустоту, и находят это в момент
> инцидента.
>
> Источник правды по флоту — `~/Repos/techcon_hub/INFRA.yaml` (поля `status`,
> `always_on`, `vpc_ip`, `ssh_alias`) и `yc compute instance list`. Обращайся к
> хостам по алиасу, не по адресу: алиас переживает замену машины, адрес нет.

### Маршруты и ключи

```bash
# Алиасы и маршруты берутся из INFRA.yaml (ssh_alias) и ~/.ssh/config.
# Живые хосты на 2026-08-18: obs-ctl-01, gpufleet-ctl-01, prod-apps-01,
# edu-app-01, pub-showcase-dev-01, ext-vm-01 — сверять командой, не по памяти.
yq '.vms | to_entries[] | select(.value.status == "running") | .key' \
  ~/Repos/techcon_hub/INFRA.yaml

ssh obs-ctl-01          # публичный вход и бастион
ssh -J obs-ctl-01 tc-gpu-t4-01   # ускорители — только через бастион

# Ключи (стабильные имена — содержимое можно ротировать)
# ~/.ssh/techcon_pyramidheadshark_ed25519  — основной
# ~/.ssh/techcon_chaber_ed25519            — резервный
```

### Правила безопасности (read-only / operator-gated)

```bash
# РАЗРЕШЕНО без подтверждения (read-only diagnostics)
yc compute instance list
yc compute instance get --name {name}
ssh {alias} 'systemctl status {service}'
ssh {alias} 'docker ps'
ssh {alias} 'cat /var/log/{logfile} | tail -50'

# ТРЕБУЕТ подтверждения оператора (mutation)
yc compute instance start --name {name}
yc compute instance stop --name {name}
yc compute instance reboot --name {name}
ssh {alias} 'systemctl restart {service}'
```

## 2. GitHub

### Доступ

```bash
# Проверить авторизацию
gh auth status

# Авторизоваться (один раз)
gh auth login
```

**Org/user**: `pyramidheadshark`  
**Repos**: `pyramidheadshark/techcon_*` — полный read/write доступ через `gh` CLI

### Частые команды

```bash
# Список PR
gh pr list --repo pyramidheadshark/{repo}

# Статус Actions
gh run list --repo pyramidheadshark/{repo} --limit 5

# Создать issue
gh issue create --repo pyramidheadshark/{repo} --title "..." --body "..."

# API (raw)
gh api repos/pyramidheadshark/{repo}/commits --jq '.[0].sha'
```

## 3. GitLab (read-only via MCP)

**Политика**: оба GitLab-инстанса — только чтение. Запись заблокирована намеренно.

| Инстанс | Env var | Scopes |
|---------|---------|--------|
| `gitlab.com` | `GITLAB_PERSONAL_ACCESS_TOKEN` | `read_api`, `read_repository` |
| `gitlab.techcon.pro` | `GITLAB_TECHCON_TOKEN` | `read_api`, `read_repository` |

```bash
# Проверить что токены установлены
echo ${GITLAB_PERSONAL_ACCESS_TOKEN:0:10}...
echo ${GITLAB_TECHCON_TOKEN:0:10}...
```

MCP-серверы `scaffold-gitlab` и `scaffold-gitlab-techcon` доступны агентам через Scaffold.

## 4. YC CLI

```bash
# Проверить авторизацию
yc config list

# Список ресурсов (read-only)
yc compute instance list
yc managed-redis cluster list
yc container registry list

# Логи (если доступно)
yc logging read --folder-id {folder-id} --since 1h
```

YC CLI pre-configured. Cloud/folder ID — в INFRA.yaml и в `yc config list`.

## 5. Linear (задачи и проекты)

Доступен через MCP `scaffold-linear`:
- Без `LINEAR_API_KEY` → OAuth при первом вызове (браузер)
- С ключом → авторизация мгновенная

```bash
# Проверить
echo ${LINEAR_API_KEY:0:10}...

# В Scaffold TUI: вызвать любой Linear-инструмент → откроется OAuth
```

Правила создания задач в Linear: `~/Repos/techcon_hub/canon/standards/task-description-standard.md`
(формат/отчёт) и `~/Repos/techcon_hub/canon/standards/linear-task-governance.md` (транспорт)

## 6. Пути к знаниям хаба (из любого child repo)

```bash
# Ориентация хаба (единственный обязательный документ)
cat ~/Repos/techcon_hub/canon/GUIDE.md

# Открытые задачи — карточки, не устаревший active-problems.md/dev/status.md/
# .hub/incoming (все три — мёртвый протокол, снесён этапом 2 плана С, 19.08.2026;
# координация с child repo идёт через Linear + PR, не через файловый обмен)
grep -l 'status: \(open\|in_progress\|blocked\|escalated\)' ~/Repos/techcon_hub/canon/problems/*.yaml

# SSH-справочник
cat ~/Repos/techcon_hub/canon/ecosystem/ssh-access-guide.md

# VM флот
cat ~/Repos/techcon_hub/INFRA.yaml

# Знания другого репо
cat ~/Repos/techcon_hub/canon/_archive/knowledge-legacy-2026-08-19/repos/{target-repo}/overview.md

# Коннектор репо
cat ~/Repos/techcon_hub/connectors/{repo}.yaml
```

## 7. Протокол TECHCON_ACCESS.md

Каждый `techcon_*` репозиторий должен иметь `TECHCON_ACCESS.md` — локальное зеркало инфра-договора для агентов, работающих в этом репо.

### Верификация

```bash
# Проверить что файл есть во всех активных репо
for repo in techcon_defectoscopy techcon_defects_stt_plus techcon_infra_monitoring \
            techcon_infra_yac techcon_passports techcon_reports techcon_demos \
            techcon_summary_tables techcon_techplans_search; do
    if [ -f "$HOME/Repos/$repo/TECHCON_ACCESS.md" ]; then
        echo "✓ $repo"
    else
        echo "✗ MISSING: $repo"
    fi
done
```

### Когда обновлять

Hub обновляет `TECHCON_ACCESS.md` в child repo когда:
1. Меняются IP или SSH-алиасы VM
2. Добавляются или удаляются VM
3. Меняются правила безопасности
4. Ротируются ключи

**Процедура**: hub обновляет `TECHCON_ACCESS.md` в child repo через PR (тот же принцип, что `distribute-git-contract.yml`/`distribute-skills.yml` — синхронизация одним открытым PR на репозиторий, не прямой push), координация через Linear.

### Шаблон TECHCON_ACCESS.md для child repo

```markdown
# TechCon — памятка по доступу без секретов

## Канонический источник
Общий справочник: `techcon_hub/canon/ecosystem/ssh-access-guide.md`
VM флот: `techcon_hub/INFRA.yaml`

## Режимы доступа
- `ssh-direct` — yc-dev-stand-01, yc-cpu-worker-01, yc-ops-01
- `ssh-internal-via-public-controller` — 10.128.* через yc-dev-stand-01; 192.168.* через yc-ops-01
- `yc-cli-first` — read-only инвентарь, mutation только с одобрения оператора

## Стабильные имена ключей
- основной: ~/.ssh/techcon_pyramidheadshark_ed25519
- резервный: ~/.ssh/techcon_chaber_ed25519

## GitHub
- Доступ через gh CLI (gh auth login выполнен)
- Org: pyramidheadshark / Repos: pyramidheadshark/techcon_*

## GitLab (read-only)
- gitlab.com: GITLAB_PERSONAL_ACCESS_TOKEN (read_api, read_repository)
- gitlab.techcon.pro: GITLAB_TECHCON_TOKEN (read_api, read_repository)
- Запись заблокирована

## Правила безопасности
- read-only YC diagnostics — без подтверждения
- SSH mutation (restart, etc.) — без явного разрешения в brief запрещено
- start/stop/reboot VM — всегда operator-gated
- Не хранить ключи, токены, VPN-конфиги в git
```

## Красные флаги (остановиться и проверить)

- VM недоступна по SSH — проверить `yc compute instance list` перед эскалацией
- GitLab отдаёт 403 — токен истёк или нет нужного scope
- `gh` CLI возвращает 401 — переавторизоваться: `gh auth login`
- `GITLAB_*_TOKEN` не установлен — MCP-сервер неактивен, задачи требующие GitLab — стоп
- IP в INFRA.yaml расходится с реальным — обновить INFRA.yaml через hub
