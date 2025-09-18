# 📋 Примеры конфигураций клиентов

## 🔧 Настройка GitHub Secrets для разных клиентов

### Клиент 1: Company A

**GitHub Secrets:**
```
SSH_PRIVATE_KEY          - ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC...
COMPANY_A_HH_CLIENT_SECRET - hh_company_a_secret_key
COMPANY_A_SENTRY_DSN     - https://sentry.io/company-a/project
```

**GitHub Variables:**
```
COMPANY_A_AVITO_API_URL  - https://api.avito.ru
COMPANY_A_HH_CLIENT_ID   - hh_company_a_client_id
COMPANY_A_HH_API_URL     - https://api.hh.ru
COMPANY_A_WEBHOOK_URL_AVITO - https://webhook.company-a.com/avito
COMPANY_A_WEBHOOK_URL_HH - https://webhook.company-a.com/hh
```

**Примечания:** 
- Avito credentials (client_id, client_secret) управляются через API endpoints, а не через переменные окружения
- `BASE_URL_AVITO` и `BASE_URL_HH` создаются автоматически от домена:
  - `BASE_URL` = `https://api.company-a.com`
  - `BASE_URL_AVITO` = `https://api.company-a.com/avito`
  - `BASE_URL_HH` = `https://api.company-a.com/hh`

### Клиент 2: Startup B

**GitHub Secrets:**
```
SSH_PRIVATE_KEY          - ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC...
STARTUP_B_HH_CLIENT_SECRET - hh_startup_b_secret_key
STARTUP_B_SENTRY_DSN     - https://sentry.io/startup-b/project
```

**GitHub Variables:**
```
STARTUP_B_AVITO_API_URL  - https://api.avito.ru
STARTUP_B_HH_CLIENT_ID   - hh_startup_b_client_id
STARTUP_B_HH_API_URL     - https://api.hh.ru
STARTUP_B_WEBHOOK_URL_AVITO - https://api.startup-b.com/webhooks/avito
STARTUP_B_WEBHOOK_URL_HH - https://api.startup-b.com/webhooks/hh
```

**Примечания:** 
- Avito credentials (client_id, client_secret) управляются через API endpoints, а не через переменные окружения
- `BASE_URL_AVITO` и `BASE_URL_HH` создаются автоматически от домена:
  - `BASE_URL` = `https://app.startup-b.com`
  - `BASE_URL_AVITO` = `https://app.startup-b.com/avito`
  - `BASE_URL_HH` = `https://app.startup-b.com/hh`

## 🚀 Примеры деплоя

### Деплой через GitHub Actions

1. **Company A**:
   - Domain: `api.company-a.com`
   - Server IP: `192.168.1.100`
   - Client Name: `company_a`

2. **Startup B**:
   - Domain: `app.startup-b.com`
   - Server IP: `192.168.1.101`
   - Client Name: `startup_b`

### Деплой через командную строку

```bash
# Company A
cd ansible
./run-universal-deploy.sh api.company-a.com 192.168.1.100 company_a

# Startup B
cd ansible
./run-universal-deploy.sh app.startup-b.com 192.168.1.101 startup_b
```

## 🔄 Управление множественными клиентами

### Структура контейнеров на сервере

```bash
# Клиент 1 (Company A)
avito-company_a
hh-company_a
redis-company_a

# Клиент 2 (Startup B)
avito-startup_b
hh-startup_b
redis-startup_b

# Общие сервисы
traefik
portainer
```

### Изоляция данных

Каждый клиент имеет:
- Отдельный Redis с изолированными данными
- Отдельные контейнеры приложений
- Отдельные volumes для данных
- Общий Traefik для маршрутизации

## 📱 API Endpoints для каждого клиента

### Company A
- Avito API: `https://api.company-a.com/avito/`
- HH API: `https://api.company-a.com/hh/`
- Portainer: `https://api.company-a.com/portainer/`

### Startup B
- Avito API: `https://app.startup-b.com/avito/`
- HH API: `https://app.startup-b.com/hh/`
- Portainer: `https://app.startup-b.com/portainer/`

## 🔒 Безопасность для множественных клиентов

### Изоляция
- Каждый клиент имеет отдельные контейнеры
- Отдельные Redis базы данных
- Изолированные volumes
- Общий Traefik с path-based routing

### Секреты
- Все секреты хранятся в GitHub Secrets
- SSH доступ только по ключам
- Автоматическая генерация SSL сертификатов

## 🛠️ Мониторинг и логи

### Просмотр логов конкретного клиента

```bash
# Company A
docker logs avito-company_a
docker logs hh-company_a
docker logs redis-company_a

# Startup B
docker logs avito-startup_b
docker logs hh-startup_b
docker logs redis-startup_b
```

### Мониторинг через Portainer

1. Откройте `https://your-domain.com/portainer/`
2. Перейдите в **Containers**
3. Фильтруйте по имени клиента (например, `company_a`)

## 🔄 Обновление клиентов

### Обновление одного клиента

```bash
# Обновить только Company A
./run-universal-deploy.sh api.company-a.com 192.168.1.100 company_a
```

### Обновление всех клиентов

```bash
# Обновить Company A
./run-universal-deploy.sh api.company-a.com 192.168.1.100 company_a

# Обновить Startup B
./run-universal-deploy.sh app.startup-b.com 192.168.1.101 startup_b
```

## 📊 Масштабирование

### Добавление нового клиента

1. Добавьте секреты в GitHub
2. Запустите деплой с новым client_name
3. Настройте DNS для нового домена

### Удаление клиента

```bash
# Остановить и удалить контейнеры клиента
docker stop avito-client_name hh-client_name redis-client_name
docker rm avito-client_name hh-client_name redis-client_name
docker volume rm redis_data_client_name
```

## 🔧 Настройка для продакшена

### Рекомендуемые настройки

1. **Сервер**: Минимум 2GB RAM, 2 CPU cores
2. **Диск**: Минимум 20GB SSD
3. **Сеть**: Статический IP адрес
4. **DNS**: Настройте A-записи для доменов

### Мониторинг

1. Настройте мониторинг контейнеров
2. Настройте алерты для критических ошибок
3. Регулярно проверяйте логи
4. Настройте автоматическое обновление SSL сертификатов
