<!-- owner: hub+CC | type: канонический git-контракт (5-repo флот) | status: ФИНАЛ, к раскатке | source-of-truth: techcon_hub/canon/GIT-CONTRACT.md, распространяется knowledge-sync.yml | update: по мере закрытия оставшихся open questions §6 -->

# 🚨 КРИТИЧНО: обязательно к прочтению и соблюдению для ИИ-агентов и людей перед любой git-операцией в этом репозитории

> Этот файл — единственный источник правды по git-контракту для органиации TechCon-ML-Team.
> Он синхронизирован автоматически во все 5 репозиториев (`techcon_infra_yac`, `techcon_defects_stt_plus`,
> `techcon_defectoscopy`, `techcon_infra_monitoring`, `techcon_hub`) через `knowledge-sync.yml`.
> **Не редактируй копию этого файла локально в дочернем репо — правки будут перезаписаны при следующем
> синке.** Правь оригинал в `techcon_hub/canon/GIT-CONTRACT.md` и коммить туда.
>
> Если ты ИИ-агент (Scaffold-сессия, Claude Code, любой другой) — перед `git push`, `git merge`,
> `gh pr create/merge`, изменением веток `main`/`develop` — прочитай этот файл целиком. Если ты человек —
> то же самое правило действует на тебя: `scaffold-git-policy.ts` энфорсит эти правила только внутри
> Scaffold-сессий (см. §0), поэтому вне их единственная защита — твоя дисциплина.

Статус: **ФИНАЛ, утверждён владельцем 2026-07-10.** Не черновик.
Исходная область действия (2026-07-10): `techcon_infra_yac`, `techcon_defects_stt_plus`,
`techcon_defectoscopy`, `techcon_infra_monitoring`, `techcon_hub` — эти пять репо были
предметом самого investigation'а, из которого вырос этот документ (merge-policy замер §1.4,
K3-гейт §1.3 и т.д.), и остаются единственными, чьи конкретные числа/находки в §5 относятся
именно к ним.

⚠ **Уточнено 31.08.2026 (план Ж, находка при back-merge через 18 репо).** Пятёркой
исходное investigation не ограничивает применимость самих ПРАВИЛ (§0–§1, кроме §5
"Миграционный план" — тот содержательно про эти пять). Любой репозиторий организации,
принявший модель `develop`/`main` (не все 18 её приняли — 7 репо на момент 31.08.2026 не
имеют ветки `develop` вовсе), подчиняется тем же правилам ветвления, merge-стратегии и
back-merge (§1.11), что и исходная пятёрка — практикаплана Ж (промоушн/back-merge по
всему флоту) это уже подтвердила де-факто. Раздатчик (`distribute-git-contract.yml`)
целится в матрицу коннекторов `connectors/*.yaml`, а не в этот список из пяти имён —
списки разошлись, и этот текст обновлён вслед за фактической раздачей, а не наоборот.

---

## 0. Модель энфорсмента — принятое и окончательное решение

Server-side (GitHub-native) branch protection **осознанно отложена** (deferred), не является открытым
вопросом. Discovery подтвердил: все 5 репозиториев — приватные, план не поддерживает classic branch
protection (`403 Upgrade to GitHub Pro`, подтверждено на `main` и `develop` для всех 5). Апгрейд тарифа
ради этого — **не предлагается** этим контрактом. Организация может в будущем мигрировать на GitLab, где
этот вопрос будет пересмотрен заново с нуля (self-hosted/GitLab-native protected branches). До тех пор
энфорсмент целиком держится на двух независимых, уже реализованных механизмах:

1. **Session-side: Scaffold git-policy плагин** (`runtime/plugins/scaffold-git-policy.ts`,
   `tool.execute.before` на `bash`-тул) — блокирует опасные git-команды *внутри* активной Scaffold-сессии.
   Не действует на прямой push из обычного терминала, чужого CI-раннера или Claude Code вне Scaffold-сессии.
2. **CI-side postfactum-гейты** (`verify-promotion-provenance` и аналоги, §3) — проверяют состояние ветки
   *после* пуша, перед деплоем, и блокируют деплой (не сам push) при нарушении ancestry-инварианта.

Это принятый риск, не пробел, который нужно закрывать апгрейдом плана. Everyone working in these repos —
agents and humans — operates under this constraint knowingly.

---

## 1. Ветвление — все 5 репо

### 1.1 Базовый поток

```
feature/* → PR → develop → (тест на dev hardware) → PR → main → (auto-deploy prod, где есть)
```

`develop` — ветвь, которая **всегда впереди** `main`. Прямые коммиты в `main`, минуя `develop`, запрещены
везде, **включая hotfix/emergency-сценарий** — исключений (break-glass) нет по умолчанию (см. §1.5).

### 1.2 Источник правды: `scaffold-git-policy.ts`, не переизобретаем правила текстом

Org-wide baseline уже задеплоен как mandatory-by-default плагин `runtime/plugins/scaffold-git-policy.ts`
(pi-scaffold), деплоится в `~/.scaffold/runtime/mimocode/config/plugin/scaffold-git-policy.ts` через
`install.sh`. Он уже даёт бесплатно на всех 5 репо, без изменений:

- `protectedBranches: ["main", "master"]`
- `requirePrForProtected: true` — прямой push в `main` запрещён
- `forbidForceOnProtected: true`, `forbidDeleteProtected: true`
- `forbidNoVerify: true` (`--no-verify` / `--no-gpg-sign` блокируются)
- `pr.forbidAdminMerge: true` (`gh pr merge --admin` запрещён)

Ни один из 5 репо не имеет `.scaffold/security/git-policy.json` или `scaffold.json.gitPolicy` — все
работают на дефолтах плагина. Этот контракт не переизобретает правила — он **включает** то, что сейчас
opt-in и выключено, и **ссылается** на плагин как на механизм.

**Что включается сверх дефолтов на каждом из 5 репо** — `.scaffold/security/git-policy.json`:

```json
{
  "protectedBranches": ["main", "develop"],
  "requirePrForProtected": true,
  "forbidForceOnProtected": true,
  "forbidDeleteProtected": true,
  "forbidNoVerify": true,
  "pr": {
    "forbidAdminMerge": true,
    "requiredSections": ["## Что изменилось", "## Зачем", "## Как проверено"],
    "minBodyLength": 40
  },
  "commitMessage": {
    "requireType": true,
    "allowedTypes": ["feat", "fix", "docs", "ci", "chore", "refactor", "test"]
  }
}
```

Ключевое изменение относительно дефолта плагина: **`develop` добавляется в `protectedBranches`**. Плагин
по умолчанию защищает только `main`/`master` — `develop` открыт для прямого push. Без этого весь смысл
"develop тестируется перед main" обходится прямым push в develop мимо PR-ревью.

**Drift-detection для этого конфига.** `.scaffold/security/git-policy.json` — сам по себе точка тихого
сброса (bad merge, revert, rebase, забыли завести на новом репо). Каждый из 5 репо получает scheduled
CI-джоб `git-policy-check.yml`, который сверяет присутствие и контрольную сумму
`.scaffold/security/git-policy.json` с согласованным baseline и алертит при расхождении/отсутствии — тем
же notify-путём, что и остальные scheduled-джобы контракта (`notify-hub`, см. §3.5, Уровень 2).

### 1.3 `main` = только merge из `develop`

- `feature/*` ветки мержатся в `develop` через PR.
- `develop` мержится в `main` через PR **только после** проверки: для GPU-репо — реальный прогон на dev
  T4-воркере через `deploy-dev.yml`; для `techcon_infra_yac`/`techcon_hub`, где нет физического
  dev-железа — минимум зелёный CI + owner review.
- Прямые коммиты в `main`, минуя `develop`, запрещены везде — **без исключения на hotfix** (§1.5).
- Гейт `verify-promotion-provenance` (уже существует на `techcon_defects_stt_plus` через `5a22987` и на
  `techcon_defectoscopy` через `ec6beef`) становится обязательным блокирующим шагом в `ci.yml`/
  `deploy-prod.yml` **до** любого deploy-джоба на всех 5 репо — копируется на `techcon_infra_yac`,
  `techcon_infra_monitoring`, `techcon_hub` в рамках этого контракта, не остаётся уникальной фичей двух
  GPU-репо.

### 1.4 Стратегия мержа `develop → main`: merge-commit, не squash — подтверждено, действие определено

**Подтверждённый факт (org merge-policy check, 2026-07-10):** на уровне GitHub-репозитория merge-commit
(`allow_merge_commit`) сегодня **выключен на всех 5 репо**, squash (`allow_squash_merge`) включён везде,
rebase включён только на `techcon_infra_monitoring` и `techcon_hub`:

| repo | squash | merge_commit | rebase |
|---|---|---|---|
| techcon_infra_yac | true | **false** | false |
| techcon_defects_stt_plus | true | **false** | false |
| techcon_defectoscopy | true | **false** | false |
| techcon_infra_monitoring | true | **false** | true |
| techcon_hub | true | **false** | true |

Это не пробел между политикой и реальностью — squash-only реально enforced на уровне репо-настроек,
`gh pr merge --merge` физически провалится сегодня на любом из 5 репо.

**Почему это не может остаться так для `develop → main` конкретно.** `verify-promotion-provenance`
подтверждён (ancestry-check investigation) как настоящая ancestry-проверка:
`git merge-base --is-ancestor origin/develop "${{ github.sha }}"` (`techcon_defects_stt_plus/ci.yml:128-129`,
`techcon_defectoscopy/ci.yml:160` и `deploy-prod.yml:62`), плюс вторичная проверка "коммит принадлежит
смёрженному PR" через `gh api .../commits/{sha}/pulls`. Squash-merge PR `develop → main` создаёт на `main`
новый коммит, чей единственный родитель — старый tip `main`; коммиты `develop` **не становятся его
предками** (кроме транзиторного момента сразу после введения этих гейтов, когда `develop`==`main`).
Squash-merge на этой границе гарантированно сломает `verify-promotion-provenance` на следующем же цикле.

**Требуемое действие (конкретно, не оставлено владельцу):** на всех 5 репо включить `allow_merge_commit:
true` в GitHub repo settings (`gh api repos/TechCon-ML-Team/{repo} -X PATCH -f allow_merge_commit=true`
или Settings → General → Pull Requests → Allow merge commits). Squash остаётся включённым и остаётся
дефолтным/единственно допустимым способом мержа для `feature/* → develop` (там нет проблемы ancestry —
фичевая ветка одноразовая). Merge-commit используется **исключительно** для PR `develop → main`: `git
merge --no-ff` при мерже этого конкретного типа PR, вручную через `gh pr merge --merge` (не squash-кнопку
по умолчанию в UI). Нет необходимости выключать squash глобально — оба режима сосуществуют на одном
репо, разница — в том, какую кнопку/флаг использует конкретный PR.

**Побочная находка, требующая фикса:** текст сообщения об ошибке в самом гейте сегодня вводит в
заблуждение — `techcon_defects_stt_plus/ci.yml` (~строка 130) и идентичный текст в
`techcon_defectoscopy/ci.yml`/`deploy-prod.yml` говорят "Промоутируйте изменение через squash-PR из
develop", хотя реальный механизм требует merge-commit, а squash его сломает. Исправить текст на "через
merge-commit PR (`git merge --no-ff`), не squash" при следующей правке этих workflow-файлов — включено в
scope этого контракта, не отдельная задача.

Копируя `verify-promotion-provenance` на `techcon_infra_yac`, `techcon_infra_monitoring`, `techcon_hub`
(§1.3) — та же зависимость: merge-commit для `develop → main`, squash-only не подойдёт.

### 1.5 Hotfix / emergency prod-фикс: без break-glass-исключения — решено

Даже экстренный прод-фикс идёт через `develop` первым, затем PR `develop → main` (merge-commit, §1.4).
Контракт **не** встраивает по умолчанию обходной путь. Это осознанный trade-off владельца: скорость
экстренного реагирования приносится в жертву инварианту "main = только из develop" повсеместно, без
исключений, требующих отдельного обоснования каждый раз. Если в будущем конкретный инцидент потребует
обхода — это решение того момента (ad-hoc owner override), не встроенный в контракт механизм.

### 1.6 `techcon_infra_monitoring` — устранение прод-риска push-to-main

Discovery: это единственный репо, где push в `main` **сразу** триггерит SSH-деплой в прод (`ci.yml`,
`on: push: branches:[main]`, deploy-джоб с `yc-ops-01`, concurrency-группа
`deploy-techcon_infra_monitoring-prod`) — **без** отдельного `confirm`-гейта, в отличие от
`techcon_defectoscopy` (`deploy-prod.yml`, `workflow_dispatch` + typed `confirm: 'deploy'`) и
`techcon_infra_yac` (`terraform-apply.yml`, `workflow_dispatch` + typed
`"yes-i-reviewed-the-plan"`).

**Решено: добавить typed-confirm гейт, как у остальных репо.** Конкретное изменение workflow:

1. `ci.yml`: убрать текущий `on: push: branches: [main]` триггер у deploy-джоба (или разделить: `push`
   триггерит только build/test/`verify-promotion-provenance`, деплой — отдельный джоб/workflow).
2. Добавить новый job/workflow `deploy-prod.yml` по образцу `techcon_defectoscopy`:
   ```yaml
   on:
     workflow_dispatch:
       inputs:
         confirm:
           description: 'Введите "deploy" для подтверждения прод-деплоя'
           required: true
   jobs:
     verify-promotion-provenance:
       # тот же ancestry-гейт, что и в остальных репо (§1.3)
     deploy:
       needs: [verify-promotion-provenance]
       if: github.event.inputs.confirm == 'deploy'
       concurrency:
         group: deploy-techcon_infra_monitoring-prod
         cancel-in-progress: false
       # существующая SSH-деплой логика на yc-ops-01, перенесённая как есть
   ```
3. Merge PR `develop → main` сам по себе больше не деплоит — деплой становится отдельным явным
   `workflow_dispatch`-действием после мержа, симметрично `techcon_defectoscopy`/`techcon_infra_yac`.
4. `verify-promotion-provenance` (тот же ancestry-check, §1.3) добавляется в этот новый workflow как
   `needs`-предусловие деплоя — на этом репо его раньше не было вообще.

### 1.7 `develop` для репо, где её сейчас нет

`techcon_infra_yac` и `techcon_hub` не имеют ветки `develop`. Механически, без конфликтов:

- `techcon_infra_yac`: создать `develop` от текущего `main`.
- `techcon_hub`: создать `develop` от текущего `main`.

⚠ Обновление 19.08.2026 (план Д): у обоих репозиториев `develop` с тех пор
заведена. См. G59 в `canon/problems/` — заведена, но не мержется в `main`
регулярно ни в одном из проверенных 10 репозиториев кроме двух; вопрос,
какую ветку реально читают агенты по умолчанию, остаётся открытым.

### 1.8 CODEOWNERS — informative-маркер, не enforced-контроль (добавлено 19.08.2026, А8 плана Д)

§2.2 упоминает `CODEOWNERS`-подобные файлы только как пример `.github/`-
конвенции (файловая раскладка), не как решение о владении кодом — этот
документ до сих пор не фиксировал, заводить ли `CODEOWNERS` там, где его
нет. Решение владельца 22 (план Д, 19.08.2026): **не заводить** новые
`CODEOWNERS` в репозиториях без него — «почти все проекты в каком-то
смысле общие, нет смысла защищать по владельцу» (дословно). Асимметрия
(файл присутствует не во всех репозиториях организации) остаётся как
есть, зафиксирована как решение, не как пробел — см. `canon/problems/G50`
в `techcon_hub`. Существующие файлы (сегодня 7 репозиториев) несут ту же
пометку в собственном заголовке.

### 1.9 Merge-authority — кто может мержить (перенесено из `docs/COMMIT_CONTRACT.md`, G62, 26.08.2026)

Раздел перенесён сюда дословно по смыслу из `docs/COMMIT_CONTRACT.md` —
нераспределяемого дубликата, который жил копиями в 14 репозиториях вне
распределительной трубы и разошёлся на **6** разных редакций (см.
`canon/exec/closed-cards/G62-commit-contract-unsourced-duplicate-diverged.yaml`,
закрыта 2026-08-31).
Решение владельца от 26.08.2026, вариант «а»: merge-authority — актуальная
политика, её место здесь, в файле, который раздаётся с маркером источника.

> **Поправка 26.08.2026 (дефект самого переноса).** Первая редакция §1.9 брала
> за истину blob `48034bf5` (33 строки) как «единственную редакцию с разделом
> Merge-authority и надмножество остальных». Это было неверно дважды. Во-первых,
> перепись сняли только по default-веткам, а расхождение бывает внутри одного
> репозитория: `techcon_reports` несёт `48034bf5` (с Merge-authority) на `main`
> и `8eb95714` (без него) на `develop`. Во-вторых, максимальная редакция — не
> `48034bf5`, а `8f091785` (42 строки) из `techcon_passports@develop`: она
> строгое надмножество, и девять её строк в перенос не попали. Среди
> потерянного был запрет `gh pr merge --delete-branch` на промоушн-PR
> `develop → main` — правило, прямо предотвращающее класс G51 (удаление базовой
> ветки закрывает стековый PR). Потерять его при консолидации значило бы
> воспроизвести ровно тот дефект, ради которого консолидация и затевалась.
> Недостающее внесено ниже. Урок: за истину берётся МАКСИМАЛЬНАЯ редакция,
> найденная переписью по всем оперативным веткам, а не первая встреченная,
> в которой нужный раздел присутствует.

- GitHub free-план → нативная branch protection для приватных репозиториев
  недоступна технически. `CODEOWNERS` в `.github/` — **informative-маркер
  владения, не enforced GitHub'ом на free** (см. §1.8). Единственный
  работающий контур энфорсмента — дисциплина людей и агентов плюс
  `scaffold-git-policy.ts` внутри Scaffold-сессий (§0).
- Разрешено мержить в `main`/`develop`: **@pyramidheadshark** — единственный
  подтверждённый human approver, canonical owner по `CODEOWNERS`.
- Автоматизированные агенты (Scaffold prime/build, Claude Code, любые другие)
  мержат ТОЛЬКО через `gh pr merge` после зелёного CI и явного решения
  владельца или prime — **никогда молча**.
- **Запрет:** агент не мержит PR в `main`/`develop` по собственной инициативе
  без явного мандата в задаче или Mission Brief. Отсутствие запрета в брифе
  мандатом не является — мандат должен быть выражен, а не выведен.
- `gh pr merge --admin` запрещён всем, включая владельца: он обходит те
  немногие проверки, которые на free-плане вообще работают (см. §1.2 —
  `scaffold-git-policy.ts`, `forbidAdminMerge`).
- **`gh pr merge --delete-branch` ЗАПРЕЩЁН на промоушн-PR `develop → main`.**
  Head такого PR — сама постоянная ветка `develop`, а не одноразовая
  feature-ветка. Мержить ТОЛЬКО `gh pr merge --squash` без `--delete-branch`,
  когда `head == develop`. Для короткоживущих topic-веток `--delete-branch`
  остаётся разрешённым и желательным — запрет адресует именно постоянные ветки.
- **Одного отказа от флага недостаточно.** Инцидент 2026-07-05 повторился
  ДВАЖДЫ: `develop` удалялась даже БЕЗ `--delete-branch` в команде, потому что
  у репозитория была включена настройка `delete_branch_on_merge: true` — она
  удаляет head-ветку при ЛЮБОМ мерже, независимо от флага CLI. Настоящий фикс —
  на стороне репозитория:
  `gh api -X PATCH repos/<org>/<repo> -f delete_branch_on_merge=false`.
  Перед первым промоушн-мержем в новом репозитории с моделью `develop`/`main`
  проверить `gh api repos/<org>/<repo> --jq .delete_branch_on_merge` и
  выключить, если `true`.
- **Зачем это правило здесь, а не только в истории инцидента.** Удаление
  постоянной базовой ветки закрывает все открытые PR, которые на неё нацелены
  (класс G51, стековые PR). Это единственное правило контракта, нарушение
  которого уничтожает чужую незакоммиченную работу, а не только собственную
  ветку, — поэтому оно раздаётся вместе с контрактом, а не живёт в разборе.

### 1.10 Остаток переноса из `docs/COMMIT_CONTRACT.md` (G62, 26.08.2026)

Перенос §1.9 закрывал только раздел Merge-authority. Сверка максимальной
редакции (`8f091785`, 42 строки) с этим файлом строка за строкой показала ещё
**пять правил, которых в каноне не было ни в какой формулировке**. Они
жили ТОЛЬКО в нераспределяемых копиях — то есть удаление копий стёрло бы их из
организации целиком. Проверка была механической, а не на глаз: по каждому
правилу `grep` по этому файлу, и ноль совпадений считался пропуском, а не
«наверное, где-то есть». Ниже ровно пять пунктов — счёт и список сверены
между собой, чтобы раздел про потерянный знаменатель сам не потерял свой.

- **После hotfix в `main` — обязательный back-merge `main → develop`.**
  §1.5 говорит, что экстренный фикс идёт через `develop` первым, но ничего не
  говорит про случай, когда `main` всё же ушёл вперёд. Без back-merge
  инвариант §1.1 («`develop` всегда впереди `main`») тихо ломается, и
  следующий промоушн затирает прод-фикс.
- **Запрет revert-коммитов живого прод-поведения в обход ревью.** Откат того,
  что работает на проде, — изменение прод-поведения, а не техническая
  операция; он идёт тем же путём (ветка + PR + ревью), что и любое другое.
- **Conventional commits + трейлер соавторства для агентских коммитов.**
  Формат: `feat:`/`fix:`/`docs:`/`chore:`… Агентский коммит несёт
  `Co-Authored-By:` с моделью сессии. Один коммит = одно логическое изменение.
  Это единственное машинно-проверяемое правило из списка: его энфорсит
  `scaffold-git-policy.ts` (`commitMessage.*`, §1.2).
- **Прод-поведение = истина.** Не терять то, что работает на проде. Деплой
  `main` запрещён, пока он не воспроизводит прод-поведение. Правило старше
  любого зелёного CI: зелёный прогон на ветке, которая не воспроизводит прод,
  доказывает работоспособность ветки, а не сохранность прода.
- **При запросе на нарушение — отказать и предложить корректный путь**
  (ветка + PR вместо прямого пуша; merge вместо cherry-pick; squash вместо
  произвольного merge-коммита; дождаться зелёного CI вместо форсированного
  мержа). Адресовано и агентам, и людям: отказ — штатный исход запроса, а не
  конфликт.

**Что НЕ переносилось и почему.** Раздел «Деплой» копий (immutable
`sha-<git-sha>`-теги, блокирующий health-gate, auto-rollback, deploy-lock,
deploy-marker) в этот файл не переносится: у него есть собственный носитель —
`canon/DEPLOY-CONTRACT.md`, который раздаётся отдельной трубой
(`distribute-agent-infra-source.yml` → `.scaffold/CLAUDE.md` целевого репо).
Дублировать его здесь значило бы завести второй источник правды ровно того
класса, который G62 и разбирает.

⚠ **Одно правило копий переносить БЫЛО НЕЛЬЗЯ — оно противоречит канону.**
Все редакции `docs/COMMIT_CONTRACT.md` требовали: «Промоушн `develop → main` —
только **squash-PR**». **§1.4 этого файла требует ровно обратного:
merge-commit, не squash.** Расхождение не стилистическое и имеет последствие в
CI: squash-merge создаёт на `main` коммит, чьи предки не включают коммиты
`develop`, поэтому `verify-promotion-provenance`
(`git merge-base --is-ancestor origin/develop $GITHUB_SHA`) гарантированно
падает на следующем же цикле. §1.4 — редакция более поздняя и обоснованная
живым замером merge-policy организации (2026-07-10), копии её не догнали.

Это и есть цена нераспределяемого дубликата в чистом виде: копия не просто
устаревает, она начинает **противоречить** источнику, и агент, прочитавший
копию, ломает гейт, действуя строго «по контракту». Squash остаётся
единственно допустимым для `feature/* → develop` — там проблемы ancestry нет.

### 1.11 Back-merge `main → develop` — обязанность агента её ЗАМЕЧАТЬ, не только знать правило (добавлено 31.08.2026, план Ж)

§1.10 уже переносил правило «после hotfix в `main` — обязательный back-merge
`main → develop`» из старой копии `docs/COMMIT_CONTRACT.md`. Живой прогон
плана Ж 31.08.2026 (веерная проверка 18 репозиториев организации) показал:
формулировки правила недостаточно — агент может знать текст и всё равно не
применить его, потому что раздел не говорил, **как обнаружить**, что момент
для back-merge наступил, и **какой именно командой** его делать (в отличие
от §1.3/§1.4, которые для промоушна вперёд дают точную последовательность).
Итог того прогона: у 8 из 18 репозиториев `main` содержал коммиты, которых
не было в `develop` (от 2 до 271 коммита), и без этого раздела задача
регулярно read'ится как «develop отстал от main» и решается форсированным
промоушном вперёд — что либо невозможно (fast-forward блокируется реальным
расхождением), либо, если форсировать через merge commit, тихо теряет
прод-коммиты `main` в истории `develop`.

**Обе стороны синхронизации — не «основная» и «на всякий случай», а
симметричная пара, обе штатные:**

| Направление | Когда | Процедура |
|---|---|---|
| `develop → main` | штатный релизный поток (§1.1, §1.3) | PR, merge-commit, `git merge --no-ff` (§1.4) |
| `main → develop` | `main` получил коммиты в обход `develop` (hotfix, аварийный прямой push, экспортированный вручную прод-фикс) | этот раздел |

**Как обнаружить, что нужен back-merge — та же проверка предков, что уже
используют `verify-promotion-provenance` и промоушн-агенты плана Ж:**

```bash
git fetch origin main develop
git merge-base --is-ancestor origin/main origin/develop
```

Код возврата `1` (не 0) означает: в `main` есть коммиты, отсутствующие в
`develop`. Это сигнал к back-merge, а не повод пытаться форсировать
`develop → main` через силу — `main` в этом состоянии стоит ВПЕРЕДИ
`develop` по этим коммитам, а не позади. Число коммитов только в `main`:
`git rev-list --count origin/develop..origin/main`.

**Процедура back-merge, дословно (та же, что уже дважды применена вручную в
`techcon_defects_stt_plus`/`techcon_defectoscopy` в рамках плана Ж —
формализуется здесь как повторяемый рецепт, не изобретается заново на
каждый случай):**

```bash
git checkout -b sync/main-to-develop origin/develop
git merge --no-ff origin/main         # merge commit, НЕ squash — см. обоснование ниже
# конфликт возможен, если develop и main независимо чинили одно и то же место —
# разрешать вручную, сохраняя содержательно верный вариант, не "любой, лишь бы собралось"
git push origin sync/main-to-develop
gh pr create --base develop --head sync/main-to-develop \
  --title "chore: back-merge main -> develop (hotfix sync)" \
  --body "..."   # назвать конкретные коммиты main, которые довозятся, и почему они там оказались
# после зелёного CI:
gh pr merge --merge   # merge-commit, не squash — см. ниже
```

**Почему merge-commit, а не squash, здесь тоже (не только для §1.4):**
squash на этой границе создаёт в `develop` новый коммит с единственным
родителем — старым tip `develop`; исходные коммиты `main` не становятся его
предками. Следующая проверка `git merge-base --is-ancestor origin/main
origin/develop` после такого squash **снова** вернёт `1` — работа
формально сделана, а инвариант не восстановлен, и следующий агент по той же
проверке решит, что back-merge всё ещё не сделан. Merge-commit — единственный
способ, при котором проверка предков после операции действительно меняет
результат.

**Не форсировать вслепую.** Если `main` и `develop` разошлись НАСТОЛЬКО, что
`main` содержит закреплённый постоянный паттерн вроде `DEV_ONLY_DIVERGENCE`
(§5.6) — коммиты, которые сознательно никогда не должны попасть в `main`
из `develop`, — back-merge `main → develop` этого не касается и не
конфликтует с этим паттерном: тот паттерн про то, что `develop`→`main` не
берёт с собой, а не про то, что `main`→`develop` не может довезти. Если
конфликт merge реально не резолвится тривиально (не «взять любой хунк»), а
требует содержательного решения о том, чья версия правильная — это выносится
как открытый вопрос PR/владельцу, не решается агентом самостоятельно
угадыванием.

### 1.12 `verify-promotion-provenance` (K3) предупреждает о PR не из `develop` — не блокирует (добавлено 01.09.2026)

Живой инцидент 01.09.2026: диагностика сначала предположила, что 5 раздатчиков
(`distribute-*.yml`) ломают K3 для строгого 5-репо флота своим паттерном
«PR прямо в `default_branch`, squash-merge». Форк-проверка математически
опровергла это: squash-merge создаёт коммит с единственным родителем — старый
tip базовой ветки; если `develop` уже был предком старого `main` (верно, пока
`main` однажды был честно промоутирован), он остаётся предком и НОВОГО
squash-коммита транзитивно. Оба чека K3 (`develop`-предок, PR-ассоциация)
структурно не могут быть сломаны этим механизмом. Правка кода раздатчиков —
**не сделана**, она чинила бы не ту причину.

Реальная, давно существующая причина content-дивергенции `main`/`develop` —
практика открывать PR с `base=main` напрямую, не только у раздатчиков, но и
в органической работе (живой пример: PR #188/#189 в `techcon_defectoscopy`,
#154/#155 в `techcon_defects_stt_plus`, все — не раздаточные, base=main,
01.09.2026). Она безвредна для двух чеков K3 (см. выше), но именно она копит
на `main` контент, которого `develop` никогда не увидит без back-merge (§1.11).

**Что сделано вместо правки раздатчиков:** `promotion-provenance-callable.yml`
(R5, K3) получил третий шаг — не `::error::`, а `::warning::` — если PR,
доставивший коммит на `main`, имел `head` не `develop`. GitHub org на Free
plan не даёт настоящей branch protection (403 везде, см. комментарий K3-файла)
— этот шаг физически не может заблокировать уже смёрженный PR, только сделать
факт дивергенции видимым в CI-логе и напомнить про back-merge §1.11. Это не
замена регулярной проверки предков (`git merge-base --is-ancestor origin/main
origin/develop`) — предупреждение реагирует на КАЖДЫЙ отдельный PR, проверка
предков — на накопленное состояние; полагаться на одно вместо другого нельзя.

---

## 2. Распространение контракта: расширение `knowledge-sync.yml`

### 2.1 Что делает `knowledge-sync.yml` сегодня

Проверено (`~/Repos/techcon_hub/.github/workflows/knowledge-sync.yml`): это **входящий** (inbound)
механизм — забирает данные ИЗ 5 мониторимых репо (`scripts/sync.py --all`, читает git log/commits через
`gh api` с `GH_ORG_TOKEN`, по одному YAML-коннектору на репо в `connectors/*.yaml`) и пишет результат в
`techcon_hub/canon/` + коммитит/пушит **только внутри `techcon_hub`**. Триггеры: `schedule` (weekly,
Monday 06:00 UTC), `repository_dispatch` (type `knowledge-sync-requested`, шлётся дочерними репо после
push через `TECHCON_HUB_DISPATCH_TOKEN`), `workflow_dispatch` (ручной, опционально по одному репо). Он
**не** пушит файлы наружу ни в один из 5 репо сегодня.

Коннекторы для всех 5 репо контракта уже существуют: `connectors/techcon_infra_yac.yaml`,
`connectors/techcon_defects_stt_plus.yaml`, `connectors/techcon_defectoscopy.yaml`,
`connectors/techcon_infra_monitoring.yaml`, `connectors/techcon_hub.yaml`.

### 2.2 Расширение: новый outbound-джоб `distribute-contract` в том же workflow

**Предусловие, блокирующее включение этого джоба — не просто заметка.** Матрица ниже адресует все 5
репо, но `techcon_infra_yac` и `techcon_hub` сегодня не имеют ветки `develop` (§1.7). Чекаут `ref:
develop` для этих двух матричных ног упадёт (`fatal: couldn't find remote ref develop`) до тех пор, пока
`develop` не создана в обоих. **Порядок обязателен: сначала §1.7 (создание `develop` в
`techcon_infra_yac`/`techcon_hub`), только потом активация/первый прогон `distribute-contract`.** До
выполнения §1.7 матрица должна быть ограничена тремя репо, где `develop` уже существует
(`techcon_defects_stt_plus`, `techcon_defectoscopy`, `techcon_infra_monitoring`), либо джоб на этих двух
ногах должен явно проверять существование ветки и no-op'ится, а не падать красным:

```yaml
      - name: Check target develop exists
        id: devcheck
        run: |
          if git ls-remote --exit-code --heads \
             https://x-access-token:${{ secrets.GH_ORG_TOKEN }}@github.com/TechCon-ML-Team/${{ matrix.repo }}.git develop; then
            echo "exists=true" >> "$GITHUB_OUTPUT"
          else
            echo "exists=false" >> "$GITHUB_OUTPUT"
            echo "::warning::${{ matrix.repo }}: develop ещё не создана (см. §1.7) — distribute-contract пропущен для этого репо"
          fi
```

**Токен-скоуп — не подтверждён, требует проверки до мержа, а не хеджа в прозе.** `GH_ORG_TOKEN`
сегодня используется только для чтения (`gh api` в `sync` job). Пушить ветку и открывать PR в 5 чужих
репо требует `repo` (или fine-grained `contents:write` + `pull-requests:write`) scope. Является ли
токен уже таким — **не проверено этим документом** (см. §6, пункт добавлен). Перед мержем этого раздела
в реализацию: выполнить `gh api repos/TechCon-ML-Team/techcon_hub --silent` с этим токеном на push в
тестовую ветку одного репо, или сверить scope в org secret settings. Если read-only — расширение прав
токена является **обязательным** предварительным шагом реализации, не опциональным.

Добавляется второй job в `knowledge-sync.yml`, использующий (после подтверждения scope, см. выше) тот же
`GH_ORG_TOKEN`:

```yaml
  distribute-contract:
    needs: sync
    runs-on: ubuntu-latest
    strategy:
      matrix:
        repo: [techcon_infra_yac, techcon_defects_stt_plus, techcon_defectoscopy,
               techcon_infra_monitoring, techcon_hub]
    steps:
      - name: Checkout techcon_hub (source of truth)
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5  # v4

      # Check target develop exists — см. блок выше; пропускает ногу, если develop ещё не создана (§1.7)

      - name: Checkout target repo
        if: steps.devcheck.outputs.exists == 'true'
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5  # v4
        with:
          repository: TechCon-ML-Team/${{ matrix.repo }}
          token: ${{ secrets.GH_ORG_TOKEN }}
          path: target
          ref: develop   # контракт распространяется через develop, не прямым push в main (§1.3)

      - name: Sync contract file (idempotent — one open PR per repo, not one per day)
        if: steps.devcheck.outputs.exists == 'true'
        run: |
          mkdir -p target/.github
          cp canon/GIT-CONTRACT.md target/.github/GIT-CONTRACT.md
          cd target
          git config user.name "techcon-hub-bot"
          git config user.email "bot@techcon-hub.local"
          git add .github/GIT-CONTRACT.md
          git diff --staged --quiet && echo "No changes" && exit 0

          # Стабильное, недатированное имя ветки — джоб идемпотентен по конструкции: повторный прогон
          # в тот же день (schedule + repository_dispatch от разных репо + ручной workflow_dispatch
          # могут пересечься) обновляет существующую ветку/PR, а не плодит вторую параллельную.
          BRANCH="chore/sync-git-contract"

          if gh pr list --repo "TechCon-ML-Team/${{ matrix.repo }}" --head "$BRANCH" --state open --json number -q '.[0].number' | grep -q .; then
            # Открытый PR уже есть — обновляем его ветку force-push'ом вместо второго PR
            git push origin "HEAD:$BRANCH" --force
            echo "Updated existing PR for $BRANCH"
          else
            git checkout -b "$BRANCH"
            git commit -m "docs: sync GIT-CONTRACT.md from techcon_hub [automated]"
            git push origin "$BRANCH"
            gh pr create --title "docs: sync GIT-CONTRACT.md from techcon_hub" \
              --body "Автоматический синк канонического git-контракта из techcon_hub/canon/GIT-CONTRACT.md.

          ## Что изменилось
          Обновлена копия GIT-CONTRACT.md в .github/.

          ## Зачем
          techcon_hub — единый source of truth для git-контракта; этот PR держит локальную копию в синке.

          ## Как проверено
          Файл идентичен оригиналу в techcon_hub на момент генерации PR." \
              --base develop --head "$BRANCH"
          fi
        env:
          GH_TOKEN: ${{ secrets.GH_ORG_TOKEN }}
```

**Ключевые проектные решения этого расширения:**

- Файл распространяется в `.github/GIT-CONTRACT.md` каждого репо (не в корень) — соответствует
  GitHub-конвенции для repo-level документации (`.github/` уже используется под `SECURITY.md`/
  `CODEOWNERS`-подобные файлы в экосистеме GitHub) и не засоряет корень репо рядом с кодом.
- Распространение идёт **через PR в `develop`**, не прямым push в `main` — соответствует §1.3 (main
  только из develop) и проходит тот же review-путь, что и любое другое изменение. Не самокоммитится в
  обход контракта, который сам описывает.
- Матрица по всем 5 репо переиспользует уже существующие коннекторы/токен — не вводит новый секрет,
  не вводит новый workflow-файл, использует существующий `sync` job как precondition (`needs: sync`),
  чтобы distribution всегда шла вслед за актуализацией `canon/_archive/knowledge-legacy-2026-08-19/`.
- Триггер расширения — те же, что уже есть у `knowledge-sync.yml` (weekly schedule +
  `repository_dispatch` + `workflow_dispatch`) — правки `GIT-CONTRACT.md` в `techcon_hub` подхватятся
  автоматически на следующем еженедельном прогоне или могут быть протолкнуты вручную через
  `workflow_dispatch`. **Именно из-за этих трёх независимых триггеров, способных сработать в один
  календарный день, идемпотентность (стабильное имя ветки + проверка открытого PR перед созданием
  нового) обязательна, а не опциональное улучшение** — без неё второй прогон в тот же день упадёт на
  non-fast-forward push в занятую датированную ветку.

---

## 3. GPU-repo addendum: sync-on-boot консистентность (`techcon_defects_stt_plus`, `techcon_defectoscopy`)

### 3.1 Архитектурное решение владельца

Текущий механизм CI→host (push-модель) не меняется: CI (self-hosted `ops01` раннер) собирает образ,
пушит в `cr.yandex`, SSH на хост (`appleboy/ssh-action`), `docker compose pull` + `up -d` — для STT-prod
(`ci.yml`, job `deploy-prod`, `ci.yml:235-249`, host = tc-gpu-t4-01) и для defectoscopy
(`deploy-prod.yml` → `scripts/deploy_t4_carrier.sh`).

Новое требование — что происходит при **wake** воркера, остановленного cost-driven power scaling
(`gpu_orchestrator.py`). Сейчас воркер поднимается с тем образом, который был примонтирован при
последней остановке — никакой pull/проверки при wake не происходит (`gpu_orchestrator.py` не содержит
`image_id|create_instance|recreate` логики, только power-state).

**Решено:** при VM boot/wake воркер сам синхронизирует код на актуальный, не дожидаясь следующего
live-push; уже бегущие воркеры — на следующем цикле пробуждения (eventual, не мгновенная,
консистентность — сознательный trade-off простоты).

### 3.2 Механизм автозапуска app-контейнеров — подтверждено: Docker restart-policy, НЕ systemd per-container

**Investigation confirmed:** boot-time автозапуск идёт через один `Type=oneshot`/`RemainAfterExit=yes`
systemd-юнит `techcon-gpu-runtime.service` (`techcon_infra_yac/deploy/t4/systemd/techcon-gpu-runtime.service`,
запекается в образ Packer'ом — `images/gpu-t4.pkr.hcl:46-47,84,89`), который просто разово запускает
`docker compose up -d` при boot и `docker compose down` при shutdown. Он **не** мониторит и не
перезапускает контейнеры в рантайме.

Реальное runtime crash-recovery — Docker `restart: unless-stopped` в каждом compose-файле обоих
app-репо: `techcon_defectoscopy/docker-compose.t4.yml:44`, `docker-compose.api.yml:16`,
`docker-compose.dev.yml:44`, `techcon_defects_stt_plus/docker-compose.prod.yml:32`,
`docker-compose.dev.yml:32`. Routine-деплои (`deploy_t4_carrier.sh`, `ci.yml` в обоих репо) SSH'ят и
делают `docker compose pull`/`up -d` напрямую — нет `systemctl restart/reload` нигде в деплой-пути.

**Это подтверждает риск, который поднимала первая версия черновика:** дизайн `Before=`/`After=` против
"app-контейнерных systemd-юнитов" (`techcon-stt-api.service`, `techcon-defectoscopy.service`) **не
применим** — таких юнитов не существует. Docker-демон сам, независимо от порядка systemd-юнитов, поднимет
старый (pre-sleep) контейнер по своей `restart: unless-stopped` политике сразу после своего старта — race
с `sync_on_boot.sh` остаётся открытым, если ничего не менять.

**Предпосылка этого риска зависит от типа stop-действия — не подтверждена этой investigation'ой,
явно фиксируется как допущение, а не факт.** Race реален только если `gpu_orchestrator.py`'s
cost-driven stop — это **hard cloud-API stop** (например Yandex Cloud `stop-instance`), который не даёт
guest-системе времени на graceful shutdown, оставляя Docker-контейнеры в состоянии "running" на диске —
именно поэтому Docker воскрешает их при следующем старте демона. Если вместо этого stop-действие —
**graceful in-guest shutdown**, дающий systemd отработать `ExecStop` у `techcon-gpu-runtime.service`
(`docker compose down`), контейнеров к моменту boot уже нет вообще, и race, описанный выше, не
существует. Investigation этой сессии подтвердила только то, что `gpu_orchestrator.py` не содержит
`image_id|create_instance|recreate`-логики (только power-state) — это ничего не говорит о graceful vs
hard stop, что является load-bearing фактом для того, решает ли фикс ниже реальную проблему или
мнимую. **Требуется явное подтверждение на этапе реализации** (см. §6) — какой именно API/механизм
использует `gpu_orchestrator.py` для stop-действия. До этого подтверждения фикс ниже применяется как
дефолт (безопаснее исходить из hard-stop и защититься, чем не защититься от реального race), но его
необходимость подлежит пересмотру, если подтвердится graceful path.

**Фикс ниже намеренно жертвует Docker-native runtime crash-recovery — это признанный, компенсируемый
trade-off, а не побочный эффект, о котором молчит документ.** `restart: unless-stopped` сегодня — не
только защита от pre-sleep race, но и единственный механизм, поднимающий контейнер обратно, если он
падает **во время нормальной работы** (OOM, паника приложения, segfault) на хосте, который не
перезагружался несколько дней. Переключение на `restart: "no"` убирает эту защиту целиком — без
компенсации хост с упавшим ночью контейнером простоит "мёртвым" до следующего reboot/wake, т.к.
`sync_on_boot.sh` запускается только один раз, при boot. Компенсация, входящая в scope этого фикса как
обязательная часть, не опциональное улучшение:

- Добавляется лёгкий watchdog-таймер (`techcon-container-watchdog.timer` + `.service`, интервал 2-5
  минут), который делает Docker `healthcheck`-based проверку (`docker inspect --format
  '{{.State.Health.Status}}'` на app-контейнеры) и при `unhealthy`/`exited` инициирует то же самое
  `docker compose up -d --remove-orphans`/`--force-recreate`, что делает шаг 4 `sync_on_boot.sh` (§3.3)
  — переиспользуя ту же pull-логику против **текущего desired-state**, а не просто рестарт того же
  образа вслепую (чтобы не воскресить намеренно остановленный или устаревший контейнер).
  - Это не возврат к `restart: unless-stopped` "через боковую дверь" — таймер сверяется с desired-state
    (§3.4) перед recreate, тогда как Docker-native restart-policy слепо поднимает то, что было.
- Конкретная реализация watchdog-юнита (интервал, health-check команда конкретно на STT/defectoscopy)
  остаётся деталью реализации, не owner decision — фиксируется здесь как обязательная часть §3.2, а не
  вычёркивается из scope.

**Конкретный фикс (решено при подтверждении hard-stop-предпосылки, компенсировано watchdog'ом выше):**

На T4-хостах (в baked Packer-образе, `images/gpu-t4.pkr.hcl`) переключить политику restart в
prod-composе-файлах, которые реально разворачиваются на GPU-хостах, с `restart: unless-stopped` на
`restart: "no"`. Это не меняет поведение локального dev (`docker-compose.dev.yml` может сохранить
`unless-stopped` — там нет sync-on-boot конкурента) — меняется только вариант, который реально
раскатывается на `tc-gpu-t4-0N` (`docker-compose.prod.yml` в stt_plus, carrier-профиль в
defectoscopy). `sync_on_boot.sh` (см. §3.3) становится **единственным путём**, поднимающим контейнеры
после boot/wake — Docker-демон при собственном старте больше не воскрешает старый контейнер
самостоятельно, и порядок гарантирован тем, что `techcon-sync-on-boot.service` — единственный
инициатор `docker compose up`.

Итоговый systemd-юнит (`techcon-sync-on-boot.service`, добавляется в `images/gpu-t4.pkr.hcl` рядом с
существующими `techcon-gpu-runtime.service`/watchdog/monitoring юнитами) теряет смысл `Before=` против
несуществующих app-юнитов и вместо этого замещает собой запуск, который раньше делал
`techcon-gpu-runtime.service`:

```ini
[Unit]
Description=TechCon: sync deployed app code to latest desired version on boot/wake
After=network-online.target docker.service techcon-provision-env.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/opt/techcon/scripts/sync_on_boot.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

`techcon-gpu-runtime.service`'s текущий `ExecStart` (`docker compose --project-directory "$dir" ... up -d`
для `/opt/stt`, `/opt/defecto`) либо заменяется вызовом `sync_on_boot.sh`, либо `techcon-gpu-runtime.service`
целиком выводится из эксплуатации в пользу нового юнита — конкретно который из двух вариантов, решается
на этапе реализации PR в `techcon_infra_yac` (не меняет архитектурное решение выше).

`After=` включает `techcon-provision-env.service` — **статус этого юнита не подтверждён этой
investigation'ой и требует явной проверки перед реализацией, не implicit-допущения.** Подтверждено
только, что существует **скрипт** `scripts/provision_env_from_lockbox.sh` — не подтверждено, что
существует systemd-**юнит**, оборачивающий его и уже запечённый в Packer-образ. Если такого юнита нет
сегодня, `After=techcon-provision-env.service` в спецификации выше ссылается на несуществующую цель:
systemd в этом случае не фейлит юнит, а молча трактует неизвестный `After=`-таргет как no-op — то есть
ordering-гарантия, ради которой эта строка добавлена (не стартовать `sync_on_boot.sh` раньше, чем
появятся registry/Lockbox-credentials для `docker compose pull` из `cr.yandex`), тихо не будет
действовать, и `sync_on_boot.sh` будет спорадически фейлиться на аутентификации — что выглядит как
ложный health-gate-фейл, а не реальный дрейф. **Перед реализацией §3.2 нужно явно установить (см. §6):**
(a) существует ли `techcon-provision-env.service` как systemd-юнит в текущем Packer-образе уже сегодня;
(b) если нет — этот юнит нужно создать как часть этого контракта, специфицировав его с той же
конкретностью, что и `techcon-sync-on-boot.service` выше; (c) альтернативно, если credentials на самом
деле уже baked-in в образ и provisioning-шаг вообще не нужен — тогда строка `After=` упрощается,
убирая ссылку на несуществующую и ненужную цель.

### 3.3 `sync_on_boot.sh` — логика

Новый скрипт, аналог по духу существующим `scripts/provision_env_from_lockbox.sh` и
`scripts/deploy_t4_carrier.sh` (`techcon_defectoscopy`), `scripts/deploy_evaluator.sh`
(`techcon_infra_yac`):

1. Читает desired-state (тег, который должен быть развёрнут) из **внешнего**, host-независимого
   источника истины (§3.4) — не из локального файла на этом хосте.
2. `docker compose pull` образ **этого конкретного тега** (не `latest`) — идентично тому, что уже
   делает `deploy-dev.yml`/`ci.yml`/`deploy_t4_carrier.sh`, только триггер теперь boot, а не push.
3. **Только после успешного pull** — переключение на новую версию: если старый (pre-sleep) контейнер
   всё ещё поднят (не будет, если сделан фикс §3.2 — но скрипт не должен полагаться только на это,
   пишет defensively), он не останавливается, пока новый образ не подтверждён как скачанный. Порядок:
   "pull → confirm → recreate → health-gate", а не "recreate, потом health-gate" — сетевой сбой/
   просроченный registry-токен/удалённый тег не оставляют хост без работающего контейнера.
4. `docker compose up -d --remove-orphans` (STT) / `--force-recreate` (defectoscopy carrier-паттерн) —
   после подтверждённого pull.
5. Health-gate: HTTP-poll `/health` (тот же паттерн, что уже есть в `deploy_t4_carrier.sh:118-136` и
   `ci.yml:300-438` для STT). Если fail — старый контейнер к этому моменту уже заменён (нет
   "молчаливого отката"); скрипт:
   - пишет в лог с явным маркером `SYNC_ON_BOOT_HEALTH_FAIL`;
   - шлёт алерт немедленно, не полагаясь на периодический `drift-check.yml` (§3.5, Уровень 1);
   - оставляет воркер в состоянии "не готов", не помечая доступным для очереди/orchestrator'а.
6. Пишет/обновляет тот же VERSION-marker, что уже используется CI-деплоем (`/opt/stt/VERSION`,
   `/opt/defectoscopy/VERSION` он же `/opt/defecto/VERSION` в carrier-скрипте) — переиспользуется
   существующий файл, не вводится второй.
7. Держит `deploy:lock:<worker>` (Redis, тот же ключ, что консультирует
   `gpu_orchestrator.py:_is_deploy_locked`, `gpu_orchestrator.py:324-327`) установленным на время
   выполнения скрипта. **Область защиты этого лока подтверждена investigation'ом (§3.6)** — использовать
   с учётом этой оговорки, не как единственную защиту готовности воркера для инференс-трафика. Снимается
   только после успешного health-gate.

### 3.4 Desired-state: глобальный, не per-host файл

- **"Что фактически сейчас на хосте" (actual)** — уже есть: `/opt/stt/VERSION`,
  `/opt/defectoscopy/VERSION`/`/opt/defecto/VERSION`, пишутся как side-effect успешного деплоя.
  Остаётся per-host файлом.
- **"Что ДОЛЖНО быть развёрнуто" (desired)** — единый, host-независимый источник, не per-host файл.
  Причина: хост, остановленный cost-scaling'ом, недоступен по SSH в момент CI-деплоя — CI физически не
  может обновить его локальный файл; при следующем пробуждении такой хост синхронизировался бы не с
  "последним провалидированным prod-релизом", а с "последним релизом, который случился, пока этот хост
  был проснувшимся" — и `drift-check.yml` не увидел бы проблему, т.к. `actual == desired` на этом хосте
  оба устарели бы одинаково.
  - CI пишет desired-state **один раз за успешный prod-деплой**, независимо от того, какие хосты сейчас
    подняты. Место хранения — Lockbox-параметр (тот же механизм, что уже провижинит `.env` через
    `provision_env_from_lockbox.sh`) или запись в Redis, доступном воркерам — конкретный выбор остаётся
    owner decision (§6).
  - Ключуется по **сервису** (`stt-prod`, `defectoscopy-prod`), не по хосту.
  - `sync_on_boot.sh` читает этот глобальный desired-state при каждом boot, не локальный кэш.

**Bootstrap для полностью нового хоста:** для инстанса, только что созданного Terraform (scale-out),
локального actual-VERSION нет вообще. `sync_on_boot.sh` явно отличает "файла нет, потому что это первый
boot" от "дрейф" — отсутствие ответа от desired-state store в этом случае — сбой, требующий алерта, не
"нечего делать".

### 3.5 Detection/alert на молчаливый дрейф

**Уровень 1 — немедленный, локальный** (boot-time health-gate, §3.3 шаг 5). Требует отдельного,
credentialed outbound alert-пути, работающего локально на T4-хосте, независимо от Lockbox
app-provisioning — вебхук-секрет, вшитый в Packer-образ отдельно от Lockbox-провижининга приложения.

**Уровень 2 — periodic, из CI** (`drift-check.yml`). Раз в N часов (предложение: каждые 4 часа +
on-demand `workflow_dispatch`) в каждом из двух GPU-репо:
- Список хостов для проверки выводится из `INFRA.yaml` (`~/Repos/techcon_infra_yac/INFRA.yaml`) или
  live Terraform state — не из hand-maintained GitHub-секретов (не расходится с реальным флотом при
  добавлении/замене/выводе хостов из эксплуатации).
- SSH на каждый хост → `cat /opt/.../VERSION` (actual) и запрос текущего global desired-state (§3.4)
  для соответствующего сервиса.
- Сравнивает: если хост `running` и `actual != desired` дольше, чем один boot-цикл — сигнал, что
  `sync_on_boot.sh` либо не сработал, либо хост не перезагружался с момента последнего деплоя.
- Алертит через тот же notify-путь, что уже используют `ci.yml` обоих репо (`notify-hub`).

Явный staleness-порог — реальное число вместо плейсхолдера "7 дней" остаётся owner decision (§6).

### 3.6 Redis `deploy:lock:<worker>` — область защиты подтверждена investigation'ом

**Investigation confirmed (2026-07-10):** `deploy:lock` консультируется **только** stop/scale-down
решениями:
- `gpu_orchestrator.py:1609` — idle-drain stop actuator (`_is_deploy_locked`, определён строками 324-327,
  сама логика — `bool(self._r.get(self._deploy_lock_key(worker_id)))`).
- `scripts/dev_pair_idle_stop.py:238` (`techcon_infra_yac`) — read-only зеркало того же ключа для
  dev-pair idle-stop, явно документировано как таковое (комментарий на строках 147-150).

Ни `techcon_defects_stt_plus`, ни `techcon_defectoscopy` **не читают** `deploy:lock` нигде в
inference-dispatch пути (`grep` по обоим репо на `deploy:lock|deploy_lock|_is_deploy_locked` — ноль
совпадений). Живой gate диспетчеризации инференс-джобов — `predict.py:151`
(`techcon_defectoscopy/src/techcon_defectoscopy/web/routes/predict.py`) — использует другой ключ,
`gpu:fleet:status` (`_get_fleet_status`, строки 39-41), проверяет `"STOPPED"`/`None`. Worker-side pickup
(`worker.py`) забирает джобы через `XREADGROUP` consumer-group claims без какой-либо Redis-lock проверки.

**Следствие для §3.3 шаг 7:** `deploy:lock` в текущем виде защищает только от того, что оркестратор
одновременно с `sync_on_boot.sh` решит остановить/пересоздать воркер — это **не** гарантия, что воркер не
получит инференс-трафик, пока `sync_on_boot.sh` его синхронизирует. Если нужна такая гарантия — она
требует отдельного изменения в `predict.py`'s `_get_fleet_status`/`gpu:fleet:status`, чтобы тоже
учитывать `deploy:lock` (или наоборот — writer `sync_on_boot.sh` временно выставляет `gpu:fleet:status`
в `"SYNCING"`/аналог "STOPPED" на время синка, переиспользуя уже читаемый диспетчером ключ, без
изменений на стороне `predict.py`). Второй вариант дешевле (0 изменений в inference-repo). Конкретное
решение — owner decision (§6), не блокирует остальную реализацию §3.

**Durability/TTL/key-identity** (persистентность Redis-инстанса под `deploy:lock:*`, TTL с продлением
против навсегда зависшего лока при упавшем на середине `sync_on_boot.sh`, стабильность ключа при
пересоздании Terraform-инстанса) — investigation этой сессии их не проверял, остаётся owner decision
(§6).

---

## 4. Merge-commit требование для `develop → main` — итог (сводка §1.4)

Не альтернатива на выбор — техническая необходимость, вытекающая из уже подтверждённого поведения
`verify-promotion-provenance`. Требуемое действие: `allow_merge_commit: true` на всех 5 репо в GitHub
settings (сегодня `false` везде), squash остаётся для `feature/* → develop`, merge-commit — только для
`develop → main`. Плюс исправление вводящего в заблуждение текста ошибки гейта (см. §1.4).

---

## 5. Миграционный план: примирение текущего расхождения `stt_plus`/`defectoscopy`

Владелец уже классифицировал коммиты. План строится строго по классификации — не "смёржить всё".

### 5.1 `techcon_defects_stt_plus`

**Шаг 1 — `main → develop` (4 SAFE, механически):** `fb1973a`, `12767b1` (конфликтует по одному хунку с
`69b69f3`), `107311a`, `3a9ccbb`, `9ef628d`.

Ожидаемый конфликт: `12767b1` и `69b69f3` (уже на develop) независимо зафиксили один и тот же
`maxlen=5000, approximate=True` на `gpu:stt` XADD — сохранить любой из двух хунков, удалить дубликат
вручную. Даже помеченный SAFE/механический мерж проходит как реальный PR на защищённый `develop` (§1.2)
и требует минимального owner/reviewer-взгляда перед мержем — ярлык "SAFE" не превращается в неявное
само-одобрение.

**Шаг 2 — `develop → main`, merge-commit (§1.4), последовательные owner-решения по каждому коммиту:**
- `979bf5f` (demand-trigger fleet-status fix) — меняет control-flow автоскейлинга; нужен owner sign-off.
- `36fec40` (`/health` real Redis PING + env-prefixed stream keys) — прод-риск через
  ENVIRONMENT/DEPLOY_ENV.
- `4f061e9` (content-hash Redis cache K11.3) — фича с kill switch, готовность к прод — за владельцем.
- `54d2d63` (self-hosted ops01 runner) — **формализуется как постоянное решение** (§5.5), не пересмотр.
- `5a22987` (dev/prod dynamo parity + `verify-promotion-provenance` гейт) — governance-решение отдельно
  от технического parity-фикса.

**Не мержить в main:** `4052ee5`, `4d80979` (DEV_ONLY_DIVERGENCE — постоянный паттерн, §5.5).
`69b69f3` не мержится отдельно — уже разрешён конфликтом на шаге 1.

### 5.2 `techcon_defectoscopy`

**Шаг 1 — `main → develop` (4 SAFE):** `4649b3f`, `e613d46`, `e24c724`, `f38053c`. Тот же минимальный
review.

**`maxlen`-конфликт на `gpu:defecto` — решено, не открытый вопрос.** `420d891` (main, `maxlen=1000`) vs
`b64fd29` (develop, `maxlen=100`): **целевое значение — 1000** (значение `main`). При мерже шага 1
сохранить хунк `420d891`, отбросить `b64fd29`'s `maxlen=100`.

**Шаг 2 — `develop → main`, merge-commit (§1.4):**

Safe немедленно (6): `75f009f`, `32fccdd`, `ff93495`, `6352077`, `624aff3`, `d80ec96`.

NEEDS_OWNER_DECISION (последовательно): `fe54462`, `4ddb96f`, `6dd2b25` (зависит от `4ddb96f`), `b64fd29`
(уже разрешён выше — `maxlen=1000` побеждает, отдельного owner-решения по нему больше не требуется),
`7fad7b2`, `ec6beef` (`verify-promotion-provenance` — подтверждена совместимость со стратегией мержа
§1.4, копируется на остальные репо как есть, с исправленным текстом ошибки).

**`845ebbb` (self-hosted ops01, "временно" в commit message) — формализуется как постоянное решение
(§5.5), не ревертится.**

### 5.3 `techcon_infra_monitoring`

Discovery divergence-анализ для этого репо не проводился. Учитывая устранённый прод-риск push-to-main
(§1.6, уже решено), перед включением в общий migration-flow всё ещё нужен отдельный discovery-проход по
факту расхождения `main`/`develop` — единственная часть этого репо, остающаяся open (§6).

### 5.4 `techcon_infra_yac`, `techcon_hub`

Нет `develop` — нет расхождения. Миграция = создание `develop` от текущего `main` (§1.7).

### 5.5 Self-hosted `ops01` runner (`54d2d63`, `845ebbb`) — формализовано как постоянное

**Решено:** self-hosted `ops01` раннер остаётся в постоянном использовании в обоих репо — commit-message
пометка "временно" в `845ebbb` больше не отражает решение владельца, ревертить не нужно. Открывается
отдельная follow-up задача (вне scope этого контракта) на закрытие single-point-of-failure риска
self-hosted раннера (то же, что уже отмечено в T4 fleet ops post-mortem — self-hosted раннер как дважды
подтверждённая двойная точка отказа) — резервирование/redundancy раннера, не пересмотр самого факта
использования.

### 5.6 DEV_ONLY_DIVERGENCE как постоянный паттерн

`4052ee5`/`4d80979` навсегда остаются на `develop` и никогда не попадут в `main`. Формально это
исключение из "develop всегда впереди main", зафиксированное в этом документе как политика (не только в
тексте миграционного плана) — риск, что будущий контрибьютор без контекста этого файла захватит эти
коммиты в обычный промоушен, снимается тем, что сам контракт (этот файл) теперь синкается во все репо
(§2) и явно называет эти два коммита исключением. Конкретный технический механизм защиты (например,
`.gitattributes` с `merge=ours`, либо выделенная директория, явно игнорируемая
`verify-promotion-provenance`) остаётся owner decision по реализации (§6) — сам факт "эти два коммита
никогда не промоутятся" здесь уже зафиксирован окончательно.

---

## 6. Оставшиеся открытые вопросы

Всё, что было закрыто investigation'ом 2026-07-10 или явными решениями владельца выше, из списка
исключено. Список разделён на два рода: **6A** — то, что подлинно требует суждения владельца (нет
единственного технически правильного ответа, trade-off — вопрос вкуса/приоритета); **6B** —
недостающие факты, которые нужно проверить (discovery-gap), а не решить — они не должны зависать в
ожидании владельца, если ответ уже лежит в конфигурации, на которую документ и так ссылается.

### 6A. Owner judgment calls

1. **Порядок/решения по отдельным NEEDS_OWNER_DECISION коммитам** (§5.1: `979bf5f`, `36fec40`,
   `4f061e9`, `5a22987`; §5.2: `fe54462`, `4ddb96f`, `6dd2b25`, `7fad7b2`, `ec6beef`) — по каждому
   отдельно, содержательное решение включать/не включать/в каком порядке.
2. **`techcon_infra_monitoring` divergence** (§5.3) — нужен отдельный discovery-проход перед включением
   в migration flow.
3. **Desired-state store** (§3.4) — Lockbox-параметр или Redis-запись, ключуемые по сервису.
4. **Staleness-порог** (§3.5) — реальное число вместо "7 дней"-плейсхолдера.
5. **Алертинг для boot-time health-gate failure** (§3.5, Уровень 1) — отдельный webhook-секрет в образе,
   или осознанная деградация до задержки Уровня 2.
6. **Redis `deploy:lock:*` — персистентность, TTL, стабильность ключа** (§3.6) — три отдельных
   технических решения, не проверенных этим investigation'ом.
7. **`deploy:lock` ↔ `gpu:fleet:status` координация** (§3.6) — принять предложенный дешёвый вариант
   (writer `sync_on_boot.sh` временно выставляет `gpu:fleet:status`) или нет.
8. **Синхронизация `sync_on_boot.sh` с живым деплой-путём при редких Packer-ребейках** (§3.3) —
   (a) скрипт при каждом boot подтягивает актуальную версию себя из git/object storage, или (b)
   CI-проверка, фейлящая pipeline при изменении деплой-логики без синхронного re-bake.
9. **Механизм для DEV_ONLY_DIVERGENCE как постоянного паттерна** (§5.6) — конкретная техническая
   реализация (`.gitattributes merge=ours` vs выделенная директория vs что-то ещё).
10. **`techcon-gpu-runtime.service` vs новый `techcon-sync-on-boot.service`** (§3.2) — заменить
    `ExecStart` существующего юнита или вывести его из эксплуатации целиком в пользу нового; не меняет
    архитектуру, но нужна декларация перед PR в `techcon_infra_yac`.

### 6B. Pre-implementation verification (факты, не решения — закрываются проверкой, не ожиданием владельца)

11. **`GH_ORG_TOKEN` scope** (§2.2) — сегодня используется только на чтение; способен ли он push'ить
    ветку и открывать PR в 5 репо (`repo`/`contents:write`+`pull-requests:write`), не проверено.
    Проверяется одной командой/сверкой org secret settings до мержа §2.2 в реализацию — если
    read-only, расширение прав становится частью того же PR, что вводит `distribute-contract`.
12. **`gpu_orchestrator.py` stop-действие: graceful in-guest shutdown или hard cloud-API stop** (§3.2)
    — load-bearing факт для того, существует ли race, который решает фикс `restart: "no"`. Проверяется
    чтением actuator-кода (какой конкретно вызов делает stop — Yandex Cloud API instance-stop, или SSH
    + `systemctl poweroff`/аналог, дающий guest-у время на `ExecStop`). Не owner-решение — ответ уже
    существует в коде, просто не был прочитан этой investigation'ей.
13. **`techcon-provision-env.service` — существует ли уже как systemd-юнит в Packer-образе, или это
    новая работа** (§3.2) — подтверждено существование только скрипта
    `provision_env_from_lockbox.sh`, не юнита, который бы его оборачивал. Проверяется чтением
    `images/gpu-t4.pkr.hcl` и списка юнитов, которые он запекает — тот же файл, что уже используется
    как источник для `techcon-gpu-runtime.service` в §3.2, проверка не требует нового доступа.
14. **Персистентность `/opt` относительно Terraform replacement** (§3.4) — на каком диске у T4-хостов
    живёт `/opt`, переживает ли `terraform apply -replace` пересоздание инстанса; влияет на
    bootstrap-логику при recreate. Discoverable из того же `images/gpu-t4.pkr.hcl` +
    Terraform-конфигурации диска/volume в `techcon_infra_yac` (уже цитируется в §3.2/§3.4 для других
    фактов) — не требует владельца, требует ещё одного прохода по тем же файлам.
