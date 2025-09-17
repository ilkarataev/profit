# Server Setup - Ansible Configuration

Этот репозиторий содержит Ansible конфигурацию для настройки сервера и развертывания приложений с поддержкой множественных доменов.

## Структура

- `playbook-server.yml` - Основной playbook для настройки сервера и программного обеспечения.  
- `deploy-app.yml` - Playbook для деплоя основного приложения
- `deploy-single-app.yml` - Шаблон для деплоя одного приложения
- `deploy-new-app.sh` - Скрипт для быстрого деплоя нового приложения
Дополнительные файлы:
- `common-setup.yml` - Общие настройки сервера (Docker, Portainer, Traefik) 
- `inventory.ini` - Инвентарь серверов
- `ssh_key_prod.yml` - SSH ключи для продакшн среды

## Компоненты

### Установленные сервисы:
- **Docker & Docker Compose** - Контейнеризация
- **Portainer** - Веб-интерфейс для управления Docker (с аутентификацией)
- **Traefik** - Обратный прокси с автоматическими SSL сертификатами
- **Certbot** - Автоматическое получение SSL сертификатов
- **Fail2ban** - Защита от брутфорса

### Приложения:
- **Avito API** - Путь `/avito/`
- **HH API** - Путь `/hh/`

## Как работает Traefik

Traefik автоматически обнаруживает контейнеры с Docker labels и создает маршруты:

1. **Host-based routing**: `Host(domain.com)` - направляет трафик по домену
2. **Path-based routing**: `PathPrefix(/avito/)` - направляет по пути
3. **SSL автоматически**: Let's Encrypt сертификаты для каждого домена
4. **Load balancing**: Автоматическая балансировка нагрузки

### Пример маршрутизации:
```
https://web.test.ru/avito/ → avito-main:3030 (внутренняя сеть)
https://web.test.ru/hh/ → hh-main:3031 (внутренняя сеть)
```

## Использование

### 1. Настройка сервера (первый раз)

```bash
cd ansible
ansible-playbook -i inventory.ini playbook-server.yml --private-key=path/to/your/private/key -u root
```

**После настройки вы получите:**
- Пароль для Portainer (сохраните его!)
- Доступ к Traefik Dashboard
- Настроенную инфраструктуру для развертывания приложений

### 2. Деплой основного приложения

```bash
cd ansible
ansible-playbook -i inventory.ini deploy-app.yml --private-key=path/to/your/private/key -u appuser
```
### 3. Быстрый деплой нового приложения

```bash
cd ansible
./deploy-new-app.sh <app_name> <domain>

# Пример:
./deploy-new-app.sh app-test test.test.ru
```

### 4. GitHub Actions

Ручной деплой через GitHub Actions. Перейдите в **Actions** → **Deploy Application** → **Run workflow**.

## Доступные URL

После настройки будут доступны:

- **Основное приложение**: https://web.test.ru
- **Avito API**: https://web.test.ru/avito/
- **HH API**: https://web.test.ru/hh/
- **Portainer**: https://portainer.web.test.ru (требует аутентификацию)
- **Traefik Dashboard**: https://traefik.web.test.ru

## Безопасность Portainer

Portainer защищен:
- ✅ **Аутентификация**: Логин/пароль (генерируется автоматически)
- ✅ **HTTPS**: SSL сертификат от Let's Encrypt
- ✅ **Доступ только по домену**: `portainer.web.test.ru`
- ✅ **Изолированная сеть**: Только для администраторов

## Множественные приложения

### Поддерживаемые сценарии:

1. **Изолированные контейнеры**:
   - Каждое приложение в отдельном контейнере
   - Автоматическое управление через Traefik

2. **Изоляция**:
   - Каждое приложение в отдельном контейнере
   - Общая сеть `reverse-proxy` для Traefik

### Пример конфигурации множественных приложений:

```yaml
applications:
  - name: "app-main"
    domain: "web.test.ru"
  - name: "app-test"
    domain: "test.test.ru"
  - name: "app-dev"
    domain: "dev.test.ru"
```

## Настройка SSH ключей

1. Создайте SSH ключ для деплоя:
```bash
ssh-keygen -t rsa -b 4096 -C "server-deploy"
```

2. Добавьте публичный ключ в `ssh_key_prod.yml`:
```yaml
---
ssh_public_key: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... ваш_публичный_ключ"
```

3. Добавьте приватный ключ в GitHub Secrets как `SSH_PRIVATE_KEY`

## Мониторинг

- **Логи приложений**: `docker logs <container_name>`
- **Статус сервисов**: `systemctl status <service_name>`
- **Portainer**: Веб-интерфейс для управления контейнерами
- **Traefik Dashboard**: Мониторинг маршрутов и сертификатов

## Управление приложениями

### Остановка приложения:
```bash
docker stop avito-app hh-app
```

### Запуск приложения:
```bash
docker start avito-app hh-app
```

### Просмотр логов:
```bash
docker logs -f avito-app
docker logs -f hh-app
```

### Обновление приложения:
```bash
cd ansible
ansible-playbook -i inventory.ini deploy-app.yml --private-key=path/to/your/private/key -u appuser
```

## 🔄 Повторный деплой

При повторном деплое playbook автоматически:

1. **Останавливает** существующие контейнеры
2. **Удаляет** старые контейнеры
3. **Обновляет** образы Docker
4. **Создает** новые контейнеры с теми же именами
5. **Сохраняет** данные в volumes

### Безопасность данных:
- **Volumes** сохраняют данные между деплоями
- **Redis** данные не теряются
- **Конфигурации** остаются актуальными

## 🏗️ Локальная сборка

Приложение собирается локально на сервере:

1. **Dockerfile** используется для сборки
2. **Исходный код** копируется на сервер
3. **Образы** собираются на месте
4. **Redis** запускается как отдельный контейнер

### Переменные окружения:
- `SITE_DOMAIN` - основной домен
- `BASE_URL_AVITO` - URL API Avito (по умолчанию: https://api.avito.ru)
- `BASE_URL_HH` - URL API HH (по умолчанию: https://api.hh.ru)
