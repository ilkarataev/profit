# 🚀 Universal Application Deployment

Универсальная система деплоя для приложений Avito и HH с поддержкой множественных клиентов.

## 📋 Обзор

Эта система позволяет:
- Деплоить приложения Avito и HH в одном Docker Compose
- Поддерживать множественных клиентов с изолированными контейнерами
- Использовать общий Redis для всех сервисов
- Автоматически настраивать Traefik для маршрутизации
- Управлять секретами через GitHub Secrets

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Traefik       │    │   Portainer     │    │   Redis         │
│   (Reverse      │    │   (Docker UI)   │    │   (Shared)      │
│    Proxy)       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Avito API     │    │   HH API        │    │   Client Data   │
│   :3030         │    │   :3999         │    │   (Isolated)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Настройка

### 1. GitHub Secrets

Добавьте следующие секреты в ваш GitHub репозиторий:

```
SSH_PRIVATE_KEY          - Приватный SSH ключ для доступа к серверу

# Для каждого клиента нужны только секретные данные:
# Например, для клиента "client1":
CLIENT1_HH_CLIENT_SECRET - Client Secret для HH API
CLIENT1_SENTRY_DSN       - Sentry DSN (опционально)

# Для клиента "client2":
CLIENT2_HH_CLIENT_SECRET - Client Secret для HH API
CLIENT2_SENTRY_DSN       - Sentry DSN (опционально)
```

### 1.1. GitHub Variables

Добавьте следующие переменные(variables) в ваш GitHub репозиторий:

```
# Для каждого клиента нужны переменные(variables) с префиксом:
# Например, для клиента "client1":
CLIENT1_AVITO_API_URL    - Базовый URL для Avito API (по умолчанию: https://api.avito.ru)
CLIENT1_HH_API_URL       - Базовый URL для HH API (по умолчанию: https://api.hh.ru)
CLIENT1_HH_CLIENT_ID     - Client ID для HH API
CLIENT1_WEBHOOK_URL_AVITO - URL для webhook уведомлений Avito
CLIENT1_WEBHOOK_URL_HH   - URL для webhook уведомлений HH
CLIENT

# Для клиента "client2":
CLIENT2_AVITO_API_URL    - Базовый URL для Avito API
CLIENT2_HH_CLIENT_ID     - Client ID для HH API
CLIENT2_HH_API_URL       - Базовый URL для HH API
CLIENT2_WEBHOOK_URL_AVITO - URL для webhook уведомлений Avito
CLIENT2_WEBHOOK_URL_HH   - URL для webhook уведомлений HH
```

**Примечания:** 
- Redis пароль генерируется автоматически для каждого клиента и не требует настройки
- Avito credentials (client_id, client_secret) управляются через API endpoints, а не через переменные окружения
- `BASE_URL_AVITO` и `BASE_URL_HH` создаются автоматически от домена:
  - `BASE_URL` = `https://домен_клиента`
  - `BASE_URL_AVITO` = `https://домен_клиента/avito`
  - `BASE_URL_HH` = `https://домен_клиента/hh`
- Каждый клиент может иметь свой уникальный домен
- GitHub Actions автоматически проверяет наличие всех необходимых секретов и переменных перед деплоем

### 2. Структура проекта

```
project/
├── avito-main/                 # Avito приложение
├── hh-main/                   # HH приложение
├── docker-compose-universal.yml # Универсальный compose
├── ansible/
│   ├── deploy-universal.yml   # Ansible playbook
│   ├── run-universal-deploy.sh # Скрипт для ручного запуска
│   └── templates/
│       └── env-universal.j2   # Шаблон .env файла
└── .github/workflows/
    └── deploy.yml             # GitHub Action
```

## 🚀 Использование

### GitHub Actions (Рекомендуемый способ)

1. Перейдите в раздел **Actions** вашего репозитория
2. Выберите **Deploy Universal Application**
3. Нажмите **Run workflow**
4. Заполните параметры:
   - **Domain**: `app.example.com`
   - **Server IP**: `192.168.1.100`
   - **Client Name**: `client1`
   - **Action**: `deploy` или `update`

### Ручной запуск через Ansible

```bash
cd ansible
./run-universal-deploy.sh app.example.com 192.168.1.100 client1
```

### Ручной запуск с переменными окружения

```bash
# Redis password is generated automatically
export HH_CLIENT_ID="hh_client_id"
export HH_CLIENT_SECRET="hh_client_secret"
export WEBHOOK_URL="https://webhook.example.com"

cd ansible
./run-universal-deploy.sh app.example.com 192.168.1.100 client1
```

### Ручной запуск с дополнительными параметрами

```bash
cd ansible
./run-universal-deploy.sh app.example.com 192.168.1.100 client1 \
  "redis_password=mypass webhook_url=https://webhook.example.com"
```

## 📱 API Endpoints

После успешного деплоя будут доступны:

- **Avito API**: `https://your-domain.com/avito/`
- **HH API**: `https://your-domain.com/hh/`
- **Portainer**: `https://your-domain.com/portainer/`
- **Traefik Dashboard**: `https://your-domain.com/traefik/`

## 🔄 Управление клиентами

### Деплой нового клиента

```bash
# Клиент 1
./run-universal-deploy.sh app1.example.com 192.168.1.100 client1

# Клиент 2
./run-universal-deploy.sh app2.example.com 192.168.1.101 client2
```

### Обновление существующего клиента

```bash
./run-universal-deploy.sh app.example.com 192.168.1.100 client1
```

## 🐳 Docker контейнеры

Каждый клиент получает изолированные контейнеры:

- `avito-{client_name}` - Avito API сервис
- `hh-{client_name}` - HH API сервис  
- `redis-{client_name}` - Redis для клиента
- `traefik` - Общий reverse proxy
- `portainer` - Общий Docker UI

## 🔒 Безопасность

- Все секреты хранятся в GitHub Secrets
- SSH доступ только по ключам
- Traefik автоматически генерирует SSL сертификаты
- Контейнеры изолированы по клиентам
- Redis защищен паролем

## 🛠️ Troubleshooting

### Проверка статуса контейнеров

```bash
ssh appuser@your-server
docker ps
```

### Просмотр логов

```bash
# Avito
docker logs avito-client1

# HH
docker logs hh-client1

# Redis
docker logs redis-client1
```

### Перезапуск сервисов

```bash
cd /home/appuser/app
docker-compose -f docker-compose-universal.yml restart
```

## 📝 Примеры использования

### Деплой для клиента "company1"

```bash
./run-universal-deploy.sh api.company1.com 192.168.1.100 company1
```

### Деплой для клиента "startup2"

```bash
./run-universal-deploy.sh app.startup2.com 192.168.1.101 startup2
```

## 🔄 Обновление

Для обновления приложения используйте GitHub Action с параметром **Action: update** или перезапустите скрипт с теми же параметрами.

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи контейнеров
2. Убедитесь, что все секреты настроены
3. Проверьте доступность сервера
4. Проверьте DNS настройки домена
