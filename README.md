# 🚀 Automated Server Setup and Application Deployment

Автоматизированная настройка сервера и развертывание приложений с использованием Ansible и GitHub Actions.

## 📋 Возможности

- **Автоматическая настройка сервера** - Docker, Traefik, Portainer, SSL сертификаты
- **Path-based routing** - `domain.com/portainer/`, `domain.com/traefik/`
- **Автоматическое SSL** - Let's Encrypt сертификаты
- **GitHub Actions** - Полностью автоматизированный деплой
- **Безопасность** - Fail2ban, SSH ключи, изолированные контейнеры

## 🔧 Настройка GitHub Action

### 1. Создайте SSH ключ секрет в GitHub

Перейдите в **Settings → Secrets and variables → Actions** и добавьте:

```
SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
ваш_приватный_ключ_здесь
-----END OPENSSH PRIVATE KEY-----
```

### 2. Настройте DNS

Убедитесь, что ваш домен указывает на IP адрес сервера:
```
A    app.scarion.su    46.62.213.224
```

### 3. Запустите GitHub Action

1. Перейдите в **Actions** в вашем репозитории
2. Выберите **Deploy Application**
3. Нажмите **Run workflow**
4. Заполните поля:
   - **Domain**: `app.scarion.su`
   - **Server IP**: `46.62.213.224`
   - **Action**: `setup` (для первой настройки)

## 🎯 Доступные действия

### Setup (Настройка сервера)
- Установка Docker, Docker Compose
- Настройка Traefik с SSL
- Установка Portainer
- Настройка Fail2ban
- Создание пользователя `appuser`

### Deploy (Развертывание приложения)
- Сборка Docker образов
- Запуск приложений
- Настройка маршрутизации

### Update (Обновление)
- Обновление приложений
- Перезапуск сервисов

## 🌐 URL-адреса после настройки

- **Основной сайт**: `https://app.scarion.su/`
- **Portainer**: `https://app.scarion.su/portainer/`
- **Traefik Dashboard**: `https://app.scarion.su/traefik/`

## 🔑 Данные для входа

После настройки сервера пароли будут выведены в логах GitHub Action:
- **Пользователь**: `admin`
- **Пароль**: (генерируется автоматически)

## 📁 Структура проекта

```
├── .github/workflows/deploy.yml    # GitHub Action
├── ansible/
│   ├── playbook-server.yml         # Настройка сервера
│   ├── deploy-app.yml              # Деплой приложения
│   ├── common-setup.yml            # Общие настройки
│   └── run-setup.sh               # Ручной запуск
├── docker-compose-production.yml   # Production конфигурация
└── README.md
```

## 🚀 Ручной запуск

Если нужно запустить вручную:

```bash
# Настройка сервера
./ansible/run-setup.sh "app.scarion.su" "46.62.213.224"

# Деплой приложения
./ansible/run-deploy.sh "app.scarion.su" "46.62.213.224"
```

## 🔒 Безопасность

- SSH ключи для доступа
- Fail2ban для защиты от брутфорса
- Изолированные Docker сети
- Автоматические SSL сертификаты
- Безопасные пароли (генерируются автоматически)

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи GitHub Action
2. Убедитесь, что DNS настроен правильно
3. Проверьте, что SSH ключ добавлен в секреты
4. Убедитесь, что IP адрес сервера указан в секретах