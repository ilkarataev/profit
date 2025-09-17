#!/bin/bash

# Скрипт для настройки сервера
# Использование: ./run-setup.sh [domain] [ip_address]

set -e

# Параметры по умолчанию
DEFAULT_DOMAIN="web.test.ru"
DEFAULT_IP=""

# Получение параметров
DOMAIN=${1:-$DEFAULT_DOMAIN}
IP_ADDRESS=${2:-$DEFAULT_IP}

echo "========================================"
echo "НАСТРОЙКА СЕРВЕРА"
echo "Домен: $DOMAIN"
if [ -n "$IP_ADDRESS" ]; then
    echo "IP адрес: $IP_ADDRESS"
fi
echo "========================================"

# Проверка наличия SSH ключа
if [ ! -f "$HOME/.ssh/id_rsa" ]; then
    echo "❌ SSH ключ не найден: $HOME/.ssh/id_rsa"
    echo "Создайте SSH ключ: ssh-keygen -t rsa -b 4096 -C 'server-deploy'"
    exit 1
fi

# Проверка наличия inventory файла
if [ ! -f "inventory.ini" ]; then
    echo "❌ Файл inventory.ini не найден"
    exit 1
fi

# Проверка наличия SSH ключа в ssh_key.yml
if [ ! -f "ssh_key.yml" ]; then
    echo "❌ Файл ssh_key.yml не найден"
    echo "Создайте файл с вашим публичным ключом:"
    echo "echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... ваш_публичный_ключ' > ssh_key.yml"
    exit 1
fi

echo "🔧 Запуск настройки сервера..."

# Запуск playbook
if [ -n "$IP_ADDRESS" ]; then
    # Используем IP адрес напрямую
    ansible-playbook -i "$IP_ADDRESS," playbook-server.yml \
        --private-key="$HOME/.ssh/id_rsa" \
        -u root \
        -e "site_domain=$DOMAIN" \
        -v
else
    # Используем inventory файл
    ansible-playbook -i inventory.ini playbook-server.yml \
        --private-key="$HOME/.ssh/id_rsa" \
        -u root \
        -e "site_domain=$DOMAIN" \
        -v
fi

echo "========================================"
echo "✅ НАСТРОЙКА ЗАВЕРШЕНА!"
echo "Домен: https://$DOMAIN"
echo "Portainer: https://$DOMAIN/portainer/"
echo "Traefik: https://$DOMAIN/traefik/"
echo "========================================"
echo ""
echo "Следующие шаги:"
echo "1. Сохраните пароль Portainer и Traefik (выводится выше)"
echo "2. Запустите деплой приложения: ./run-deploy.sh $DOMAIN"
echo "========================================"
