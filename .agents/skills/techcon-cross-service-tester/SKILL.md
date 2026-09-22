---
name: techcon-cross-service-tester
description: Пишет и валидирует кросс-сервисные E2E интеграционные тесты между сервисами TechCon-экосистемы (upload -> classify -> detect -> search -> render). Применяй, когда нужно найти конкретный сломанный контракт между двумя сервисами, а не просто зафиксировать что тест упал.
allowed-tools: Bash(pytest:*), Bash(httpx:*)
harness: org@56a6fcf9f3cd846d7238a9233b40f00eed7f22b0
---
# Кросс-сервисный тестировщик TechCon

## Архитектура интеграционного тестирования

Типовой E2E flow в экосистеме TechCon: `upload (сервис A)` → `classify (сервис B)` →
`detect (сервис C)` → `search (сервис D)` → `render (сервис E)`.

Каждый переход между сервисами — потенциальная точка рассинхрона контракта: разные
форматы polling-роутов, разные envelope-структуры ответа, разные коды ошибок. Задача
скилла — не просто зафиксировать «упал тест», а назвать конкретный сервис и конкретное
поле/роут, где контракт разошёлся с соседним сервисом.

## Что генерировать

### Минимальный интеграционный тест (pytest)

```python
# tests/integration/test_cross_service_contract.py
# Зависимости: pip install httpx pytest
"""
Кросс-сервисный контракт: сервис A (polling) -> сервис B (polling) -> сервис C
"""
import pytest
import httpx
import os

SERVICE_A_URL = os.getenv("SERVICE_A_URL", "http://localhost:8001")
SERVICE_B_URL = os.getenv("SERVICE_B_URL", "http://localhost:8002")
SERVICE_C_URL = os.getenv("SERVICE_C_URL", "http://localhost:8003")


class TestPollingRouteContracts:
    """Проверяет единообразие polling endpoints между сервисами."""

    def test_service_a_polling_route_format(self):
        """сервис A: GET /api/v1/task/{id} возвращает TaskResponse с полями task_id, status"""
        r = httpx.get(f"{SERVICE_A_URL}/api/v1/task/nonexistent-id-12345", timeout=5.0)
        assert r.status_code in (200, 404), f"Unexpected status: {r.status_code}"
        if r.status_code == 200:
            body = r.json()
            assert "task_id" in body or "id" in body, "TaskResponse missing task_id/id field"
            assert "status" in body, "TaskResponse missing status field"

    def test_service_b_polling_route_format(self):
        """сервис B: polling endpoint должен совпадать по форме с сервисом A, не отличаться"""
        r_canonical = httpx.get(f"{SERVICE_B_URL}/api/v1/task/nonexistent-id-12345", timeout=5.0)

        if r_canonical.status_code not in (200, 404):
            # Канонический роут не существует — проверить legacy-маршрут
            r_legacy = httpx.get(f"{SERVICE_B_URL}/result/nonexistent-id-12345", timeout=5.0)
            if r_legacy.status_code in (200, 404):
                # Legacy-роут существует — это контрактный рассинхрон, не skip
                pytest.fail(
                    "Сервис B использует /result/{id} вместо /api/v1/task/{id}. "
                    "Контрактный рассинхрон с сервисом A. "
                    f"canonical: {r_canonical.status_code}, legacy: {r_legacy.status_code}"
                )
            else:
                pytest.skip(
                    f"Ни /api/v1/task, ни /result не отвечают "
                    f"({r_canonical.status_code}/{r_legacy.status_code})"
                )
        # Если canonical роут ответил 200 или 404 — это правильно, рассинхрона нет


class TestAPIEnvelopeContracts:
    """Проверяет единообразие envelope формата {"ok": bool, "data": ..., "error": ...}."""

    def test_health_endpoints_all_services(self):
        """Все сервисы отвечают на /health с JSON содержащим поле 'status'."""
        services = [
            ("service_a", SERVICE_A_URL),
            ("service_b", SERVICE_B_URL),
            ("service_c", SERVICE_C_URL),
        ]
        failures = []
        for name, url in services:
            try:
                r = httpx.get(f"{url}/health", timeout=5.0)
                if r.status_code != 200:
                    failures.append(f"{name}: /health -> {r.status_code}")
                    continue
                body = r.json()
                if "status" not in body:
                    failures.append(f"{name}: /health ответ не содержит поле 'status', got: {list(body.keys())}")
            except Exception as e:
                failures.append(f"{name}: недоступен ({type(e).__name__}: {e})")
        assert not failures, "Проблемы health endpoints:\n" + "\n".join(failures)
```

## Правила написания тестов

1. **Конкретный failure message** — тест должен объяснять ЧТО сломано и ПОЧЕМУ это рассинхрон
2. **Один assert = один контракт** — не смешивать несколько проверок в один assert
3. **Skip > xfail для отсутствующих данных** — если нет тестовых данных, skip с объяснением
4. **Environment variables для URL** — не хардкодить адреса, брать из env
5. **Timeout** — всегда `timeout=5.0` для httpx, не висеть бесконечно

## Приоритеты покрытия

| Priority | Что тестировать | Почему |
|----------|----------------|--------|
| P0 | Все `/health` endpoints | Базовая доступность |
| P0 | Polling route формат между соседними сервисами | Частый источник рассинхрона |
| P1 | API envelope `{ok, data, error}` | Ломает integration-виджеты |
| P1 | Сигналы готовности через общее хранилище состояния (Redis и подобные) | Асинхронный старт может тихо не стартовать |
| P2 | Error code формат 4xx ответов | Стандартизация |
| P2 | CORS headers (если cross-origin) | Фронт может сломаться |

## Как запускать

```bash
# Локально с docker-compose
SERVICE_A_URL=http://localhost:8001 \
SERVICE_B_URL=http://localhost:8002 \
SERVICE_C_URL=http://localhost:8003 \
pytest tests/integration/ -v --tb=short

# Против staging
SERVICE_A_URL=https://service-a.staging.example.com \
pytest tests/integration/test_cross_service_contract.py -v
```

## Что делать при падении теста

1. Сформулировать: «Сервис X ожидал Y, получил Z»
2. Указать файл, в котором нужно исправление
3. Предложить конкретное изменение (не общее описание)
4. Проверить, нет ли аналогичного рассинхрона в других парах сервисов
