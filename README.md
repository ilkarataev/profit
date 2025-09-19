# 🚀 Application Deployment

Универсальная система деплоя приложений Avito и HH с поддержкой множественных клиентов, использующая Ansible, Docker и Traefik.

## 📑 Оглавление

- [📋 Обзор](#-обзор)
- [🏗️ Архитектура](#️-архитектура)
- [⚙️ Настройка репозитория](#️-настройка-репозитория)
  - [SSH Ключи](#ssh-ключи)
  - [GitHub Secrets](#github-secrets)
  - [GitHub Variables](#github-variables-новый-формат)
  - [Структура проекта](#-структура-проекта)
- [🚀 Быстрый старт](#-быстрый-старт)
- [📱 API Endpoints](#-api-endpoints)
- [🚀 Использование](#-использование)
- [🔄 Управление клиентами](#-управление-клиентами)
- [📝 Примеры использования](#-примеры-использования)
- [🐳 Docker контейнеры](#-docker-контейнеры)
- [🔒 Безопасность](#-безопасность)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [🔄 Обновление](#-обновление)
- [📞 Поддержка](#-поддержка)

## 📋 Обзор

Описание возможностей, принципов работы системы, ключевых преимуществ, области применения, целевой аудитории и конкурентных преимуществ.

Эта система позволяет:
- Деплоить приложения Avito и HH в одном Docker Compose
- Поддерживать множественных клиентов с изолированными контейнерами
- Использовать общий Redis для сервисов HH и AVITO
- Автоматически настраивать Traefik для маршрутизации
- Управлять секретами через GitHub Secrets

## 🏗️ Архитектура

Схема взаимодействия компонентов системы, потоки данных, сетевые соединения, принципы масштабирования, производительности и надежности.

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

## ⚙️ Настройка репозитория

> **💡 Если репозиторий уже настроен, переходите к [Быстрому старту](#-быстрый-старт).**

Настройка SSH ключей, GitHub Secrets, Variables и структуры проекта для первого запуска системы с проверкой конфигурации, тестированием и валидацией.

### SSH Ключи

#### Генерация SSH ключей

1. **Сгенерируйте SSH ключ** (если у вас его нет):
```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

2. **Добавьте приватный ключ в GitHub Secrets**:
   - Скопируйте содержимое файла `~/.ssh/id_rsa` (приватный ключ)
   - Добавьте его в GitHub Secrets как `SSH_PRIVATE_KEY`

3. **Добавьте публичный ключ в файл `ansible/ssh_key.yml`**:
   - Скопируйте содержимое файла `~/.ssh/id_rsa.pub` (публичный ключ)
   - Добавьте его в файл `ansible/ssh_key.yml` в формате:
   ```yaml
   ssh_public_key: |
     ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQ... your-email@example.com
   ```

4. **Добавление доступа для других пользователей**:
   - Если кому-то нужен доступ к серверу, попросите его публичный ключ
   - Добавьте его в файл `ansible/ssh_key.yml` в том же формате
   - Все ключи в этом файле будут добавлены в `~/.ssh/authorized_keys` на сервере

### GitHub Secrets

Добавьте следующие секреты в ваш GitHub репозиторий:

```
SSH_PRIVATE_KEY          - Приватный SSH ключ для доступа к серверу

# Для каждого клиента нужны только секретные данные:
# Например, для клиента "client1":
CLIENT1_HH_CLIENT_SECRET - Client Secret для HH API
CLIENT1_SENTRY_DSN       - Sentry DSN (опционально)
```

### GitHub Variables (Новый формат)

**Рекомендуемый формат** - одна переменная с JSON-конфигурацией для каждого клиента:

#### Пример для client1:
- **Название переменной**: `CLIENT1_CONFIG`
- **Значение** (JSON):
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

#### Пример для client2:
- **Название переменной**: `CLIENT2_CONFIG`
- **Значение** (JSON):
```json
{
  "avito_api_url": "https://api.avito.ru",
  "hh_client_id": "another_hh_client_id",
  "hh_api_url": "https://api.hh.ru",
  "webhook_url_avito": "https://webhook.example.com/client2/avito",
  "webhook_url_hh": "https://webhook.example.com/client2/hh",
  "sentry_dsn": "https://another-sentry-dsn@sentry.io/project-id"
}
```

#### Минимальная конфигурация:
```json
{
  "hh_client_id": "your_hh_client_id"
}
```

#### Поля конфигурации:

| Поле | Тип | Обязательное | По умолчанию | Описание |
|------|-----|-------------|-------------|----------|
| `avito_api_url` | string | Нет | `https://api.avito.ru` | URL API Avito |
| `hh_client_id` | string | Да | - | ID клиента HH |
| `hh_api_url` | string | Нет | `https://api.hh.ru` | URL API HH |
| `webhook_url_avito` | string | Нет | - | Webhook URL для Avito |
| `webhook_url_hh` | string | Нет | - | Webhook URL для HH |
| `sentry_dsn` | string | Нет | - | Sentry DSN для мониторинга |

**Примечания:** 
- Redis пароль генерируется автоматически для каждого клиента и не требует настройки
- Avito credentials (client_id, client_secret) управляются через API endpoints, а не через переменные окружения
- `BASE_URL_AVITO` и `BASE_URL_HH` создаются автоматически от домена:
  - `BASE_URL` = `https://домен_клиента`
  - `BASE_URL_AVITO` = `https://домен_клиента/avito`
  - `BASE_URL_HH` = `https://домен_клиента/hh`
- Каждый клиент может иметь свой уникальный домен
- GitHub Actions автоматически проверяет наличие всех необходимых секретов и переменных перед деплоем

### Структура проекта

```
project/
├── avito-main/                 # Avito приложение
├── hh-main/                   # HH приложение
├── docker-compose-universal.yml # Универсальный compose
├── ansible/
│   ├── playbook-server.yml    # Настройка сервера
│   ├── deploy-universal.yml   # Деплой приложения
│   ├── run-setup.sh          # Скрипт настройки сервера
│   ├── run-universal-deploy.sh # Скрипт деплоя приложения
│   └── templates/
│       └── env-universal.j2   # Шаблон .env файла
└── .github/workflows/
    ├── setup-server.yml       # GitHub Action настройки сервера
    └── deploy.yml             # GitHub Action деплоя приложения
```

## 🚀 Быстрый старт

> **⚠️ Перед началом убедитесь, что выполнена [настройка репозитория](#️-настройка-репозитория).**

Пошаговые инструкции для быстрого запуска системы с минимальными настройками, проверкой работоспособности, тестированием и валидацией.

### 1. Настройка сервера

Используйте GitHub Action **Setup Server**:
- Domain: `your-domain.com`

### 2. Деплой приложения

Используйте GitHub Action **Deploy Universal Application**:
- Domain: `your-domain.com`
- Client Name: `client1`
- Action: `deploy`

### 3. Ручной деплой

```bash
# Настройка сервера
cd ansible
./run-setup.sh "your-domain.com"

# Деплой приложения
cd ansible
./run-universal-deploy.sh "your-domain.com" "client1"
```

## 📱 API Endpoints

Доступные эндпоинты, URL-адреса, маршруты, примеры запросов, документация API и тестирование после успешного деплоя.

После успешного деплоя будут доступны:

- **Avito API**: `https://your-domain.com/avito/`
- **HH API**: `https://your-domain.com/hh/`
- **Portainer**: `https://your-domain.com/portainer/`
- **Traefik Dashboard**: `https://your-domain.com/traefik/`

## 🚀 Использование

Подробные инструкции по деплою и управлению приложениями через GitHub Actions и Ansible с примерами команд, настройками, мониторингом и оптимизацией.

### GitHub Actions (Рекомендуемый способ)

1. Перейдите в раздел **Actions** вашего репозитория
2. Выберите **Deploy Universal Application**
3. Нажмите **Run workflow**
4. Заполните параметры:
   - **Domain**: `app.example.com`
   - **Client Name**: `client1`
   - **Action**: `deploy` или `update`

### Ручной запуск через Ansible

```bash
cd ansible
./run-universal-deploy.sh app.example.com client1
```

### Ручной запуск с переменными окружения

```bash
# Redis password is generated automatically
export HH_CLIENT_ID="hh_client_id"
export HH_CLIENT_SECRET="hh_client_secret"
export WEBHOOK_URL="https://webhook.example.com"

cd ansible
./run-universal-deploy.sh app.example.com client1
```

### Ручной запуск с дополнительными параметрами

```bash
cd ansible
./run-universal-deploy.sh app.example.com client1 \
  "redis_password=mypass webhook_url=https://webhook.example.com"
```

## 🔄 Управление клиентами

Управление множественными клиентами с изолированными контейнерами, отдельными доменами, конфигурациями, мониторингом, масштабированием и автоматизацией.

### Деплой нового клиента

```bash
# Клиент 1
./run-universal-deploy.sh app1.example.com client1

# Клиент 2
./run-universal-deploy.sh app2.example.com client2
```

### Обновление существующего клиента

```bash
./run-universal-deploy.sh app.example.com client1
```

## 📝 Примеры использования

Реальные сценарии деплоя для разных клиентов с конкретными командами, настройками, проверкой работоспособности, оптимизацией и мониторингом.

### Деплой для клиента "company1"

```bash
./run-universal-deploy.sh api.company1.com company1
```

### Деплой для клиента "startup2"

```bash
./run-universal-deploy.sh app.startup2.com startup2
```

## 🐳 Docker контейнеры

Архитектура контейнеров, изоляция клиентов, управление ресурсами, сетевое взаимодействие, мониторинг, производительность и масштабирование.

Каждый клиент получает изолированные контейнеры:

- `avito-{client_name}` - Avito API сервис
- `hh-{client_name}` - HH API сервис  
- `redis-{client_name}` - Redis для клиента
- `traefik` - Общий reverse proxy
- `portainer` - Общий Docker UI

## 🔒 Безопасность

Принципы безопасности, защиты данных, изоляции клиентов, управления доступом, аудита, соответствия стандартам и мониторинга.

- Все секреты хранятся в GitHub Secrets
- SSH доступ только по ключам
- Traefik автоматически генерирует SSL сертификаты
- Контейнеры изолированы по клиентам
- Redis защищен паролем

## 🛠️ Troubleshooting

Решение типичных проблем, диагностика системы, восстановление работоспособности, мониторинг, профилактика, оптимизация и автоматизация.

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

## 🔄 Обновление

Процесс обновления приложений, системы, миграции данных, отката изменений, версионирования и тестирования.

Для обновления приложения используйте GitHub Action с параметром **Action: update** или перезапустите скрипт с теми же параметрами.

## 📞 Поддержка

Получение помощи, решение проблем, контакты для поддержки, дополнительные ресурсы, сообщество и обучение.

При возникновении проблем:
1. Проверьте логи контейнеров
2. Убедитесь, что все секреты настроены
3. Проверьте доступность сервера
4. Проверьте DNS настройки домена