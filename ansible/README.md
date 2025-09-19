# Ansible Configuration

Ansible конфигурация для настройки сервера и развертывания приложений.

## 📁 Структура файлов

```
ansible/
├── playbook-server.yml           # Настройка сервера (Docker, Traefik, Portainer)
├── deploy-universal.yml          # Деплой универсального приложения
├── ssh_key.yml                   # SSH ключи для доступа
├── run-setup.sh                  # Скрипт настройки сервера
├── run-universal-deploy.sh       # Скрипт деплоя приложения
└── templates/
    ├── env-universal.j2          # Шаблон .env файла
    └── docker-compose-universal.j2 # Шаблон docker-compose.yml
```

## 🚀 Быстрый старт

### Настройка сервера
```bash
cd ansible
./run-setup.sh "your-domain.com"
```

### Деплой приложения
```bash
cd ansible
./run-universal-deploy.sh "your-domain.com" "client1"
```

## 📋 Playbooks

### `playbook-server.yml`
Настройка сервера и базовой инфраструктуры:
- Создание пользователя appuser
- Настройка SSH ключей
- Установка Docker и Docker Compose
- Настройка Traefik (reverse proxy)
- Установка Portainer (Docker UI)
- Настройка SSL сертификатов
- Установка Fail2ban
- Инициализация Portainer

### `deploy-universal.yml`
Деплой универсального приложения:
- Создание клиентской директории
- Копирование исходного кода
- Генерация конфигурационных файлов
- Запуск Docker контейнеров
- Настройка сетей и маршрутизации

## 🔧 Переменные

### Обязательные переменные:
- `site_domain` - домен для деплоя
- `client_name` - имя клиента (по умолчанию: main)

### Переменные приложения:
- `hh_client_id` - ID клиента HH API
- `hh_client_secret` - Secret клиента HH API
- `webhook_url_avito` - Webhook URL для Avito
- `webhook_url_hh` - Webhook URL для HH
- `sentry_dsn` - Sentry DSN для мониторинга

## 🐳 Docker контейнеры

Каждый клиент получает изолированные контейнеры:
- `avito-{client_name}` - Avito API сервис
- `hh-{client_name}` - HH API сервис
- `redis-{client_name}` - Redis для клиента

## 🔒 Безопасность

- SSH доступ только по ключам
- Автоматическая генерация паролей
- Изоляция клиентов по контейнерам
- SSL сертификаты от Let's Encrypt

## 📊 Мониторинг

### Проверка статуса:
```bash
# Статус контейнеров
docker ps

# Логи приложения
docker logs avito-client1
docker logs hh-client1
docker logs redis-client1
```

### Portainer:
- URL: `https://your-domain.com/portainer/`
- Логин: `admin`
- Пароль: генерируется автоматически

### Traefik Dashboard:
- URL: `https://your-domain.com/traefik/`
- Логин: `admin`
- Пароль: генерируется автоматически

## 🔄 Обновление

Для обновления приложения:
```bash
cd ansible
./run-universal-deploy.sh "your-domain.com" "client1"
```

Playbook автоматически:
- Останавливает старые контейнеры
- Обновляет образы
- Запускает новые контейнеры
- Сохраняет данные в volumes
