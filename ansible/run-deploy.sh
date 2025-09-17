#!/bin/bash

# Скрипт для деплоя приложения
# Использование: ./run-deploy.sh [domain] [ip_address]

set -e

# Параметры по умолчанию
DEFAULT_DOMAIN="web.test.ru"
DEFAULT_IP=""

# Получение параметров
DOMAIN=${1:-$DEFAULT_DOMAIN}
IP_ADDRESS=${2:-$DEFAULT_IP}

echo "========================================"
echo "ДЕПЛОЙ ПРИЛОЖЕНИЯ"
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

echo "🚀 Запуск деплоя приложения..."

# Запуск playbook
if [ -n "$IP_ADDRESS" ]; then
    # Используем IP адрес напрямую
    ansible-playbook -i "$IP_ADDRESS," deploy-app.yml \
        --private-key="$HOME/.ssh/id_rsa" \
        -u appuser \
        -e "site_domain=$DOMAIN" \
        -v
else
    # Используем inventory файл
    ansible-playbook -i inventory.ini deploy-app.yml \
        --private-key="$HOME/.ssh/id_rsa" \
        -u appuser \
        -e "site_domain=$DOMAIN" \
        -v
fi

echo "========================================"
echo "✅ ДЕПЛОЙ ЗАВЕРШЕН!"
echo "Приложение: https://$DOMAIN"
echo "Avito API: https://$DOMAIN/avito/"
echo "HH API: https://$DOMAIN/hh/"
echo "Portainer: https://$DOMAIN/portainer/"
echo "Traefik: https://$DOMAIN/traefik/"
echo "========================================"
