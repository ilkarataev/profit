# Примеры конфигураций клиентов

## 🔧 Формат конфигурации

Каждый клиент настраивается через **одну переменную** `{CLIENT_NAME}_CONFIG` в формате JSON.

## 📋 Примеры конфигураций

### Минимальная конфигурация

```json
{
  "hh_client_id": "your_hh_client_id"
}
```

### Полная конфигурация

```json
{
  "avito_api_url": "https://api.avito.ru",
  "hh_client_id": "your_hh_client_id",
  "hh_api_url": "https://api.hh.ru",
  "webhook_url_avito": "https://webhook.example.com/client1/avito",
  "webhook_url_hh": "https://webhook.example.com/client1/hh",
  "sentry_dsn": "https://your-sentry-dsn@sentry.io/project-id"
}
```

### Конфигурация для тестирования

```json
{
  "avito_api_url": "https://api.avito.ru",
  "hh_client_id": "test_client_id",
  "hh_api_url": "https://api.hh.ru",
  "webhook_url_avito": "https://webhook.example.com/test/avito",
  "webhook_url_hh": "https://webhook.example.com/test/hh"
}
```

### Конфигурация для продакшена

```json
{
  "avito_api_url": "https://api.avito.ru",
  "hh_client_id": "prod_client_id_12345",
  "hh_api_url": "https://api.hh.ru",
  "webhook_url_avito": "https://api.yourcompany.com/webhooks/avito",
  "webhook_url_hh": "https://api.yourcompany.com/webhooks/hh",
  "sentry_dsn": "https://abc123def456@o123456.ingest.sentry.io/123456"
}
```

## 🔐 Секреты

Для каждого клиента создайте секрет `{CLIENT_NAME}_CLIENT_SECRET`:

- **CLIENT1_CLIENT_SECRET**: `your_hh_client_secret_for_client1`
- **CLIENT2_CLIENT_SECRET**: `your_hh_client_secret_for_client2`
- **TEST_CLIENT_SECRET**: `test_secret_for_testing`

## 📝 Поля конфигурации

| Поле | Тип | Обязательное | По умолчанию | Описание |
|------|-----|-------------|-------------|----------|
| `avito_api_url` | string | Нет | `https://api.avito.ru` | URL API Avito |
| `hh_client_id` | string | Да | - | ID клиента HH |
| `hh_api_url` | string | Нет | `https://api.hh.ru` | URL API HH |
| `webhook_url_avito` | string | Нет | - | Webhook URL для Avito |
| `webhook_url_hh` | string | Нет | - | Webhook URL для HH |
| `sentry_dsn` | string | Нет | - | Sentry DSN для мониторинга |

## 🚀 Как добавить нового клиента

1. **Создайте переменную** в GitHub:
   - Название: `NEWCLIENT_CONFIG`
   - Значение: JSON конфигурация (см. примеры выше)

2. **Создайте секрет** в GitHub:
   - Название: `NEWCLIENT_CLIENT_SECRET`
   - Значение: HH client secret

3. **Запустите деплой**:
   - Domain: `your-domain.com`
   - Client name: `newclient`
   - Action: `deploy`

## ✅ Валидация конфигурации

GitHub Actions автоматически проверяет:
- ✅ JSON корректность
- ✅ Наличие обязательных полей
- ✅ Существование секрета
- ✅ DNS резолюцию домена

## 🔄 Миграция со старого формата

Если у вас есть переменные в старом формате:
- `CLIENT1_AVITO_API_URL`
- `CLIENT1_HH_CLIENT_ID`
- `CLIENT1_HH_API_URL`
- `CLIENT1_WEBHOOK_URL_AVITO`
- `CLIENT1_WEBHOOK_URL_HH`
- `CLIENT1_SENTRY_DSN`

Объедините их в одну переменную `CLIENT1_CONFIG`:

```json
{
  "avito_api_url": "значение из CLIENT1_AVITO_API_URL",
  "hh_client_id": "значение из CLIENT1_HH_CLIENT_ID",
  "hh_api_url": "значение из CLIENT1_HH_API_URL",
  "webhook_url_avito": "значение из CLIENT1_WEBHOOK_URL_AVITO",
  "webhook_url_hh": "значение из CLIENT1_WEBHOOK_URL_HH",
  "sentry_dsn": "значение из CLIENT1_SENTRY_DSN"
}
```

И переименуйте секрет `CLIENT1_HH_CLIENT_SECRET` в `CLIENT1_CLIENT_SECRET`.