#!/bin/bash

# Скрипт для деплоя нового приложения с отдельным доменом
# Использование: ./deploy-new-app.sh <app_name> <domain>

set -e

APP_NAME=${1:-"app-new"}
DOMAIN=${2:-"app-new.test.ru"}

echo "========================================"
echo "ДЕПЛОЙ НОВОГО ПРИЛОЖЕНИЯ"
echo "Название: $APP_NAME"
echo "Домен: $DOMAIN"
echo "========================================"

# Создаем временный playbook для нового приложения
cat > deploy-temp-app.yml << EOF
---
- name: Deploy $APP_NAME
  hosts: roman-prod
  user: appuser
  become: false
  vars:
    ansible_ssh_common_args: '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
    project_dir: /home/appuser/app_project
    app_name: "$APP_NAME"
    app_domain: "$DOMAIN"
    compose_file: "docker-compose-production.yml"

  tasks:
    - name: Create application directory
      file:
        path: "{{ project_dir }}/{{ app_name }}"
        state: directory
        owner: appuser
        group: appuser
        mode: '0755'

    - name: Copy application files
      copy:
        src: "{{ item }}"
        dest: "{{ project_dir }}/{{ app_name }}/{{ item | basename }}"
        owner: appuser
        group: appuser
        mode: '0644'
      with_fileglob:
        - "../src/*"
        - "../*.json"
        - "../*.yml"
        - "../*.yaml"
        - "../Dockerfile"
        - "../README.md"

    - name: Copy docker-compose file
      copy:
        src: "{{ item }}"
        dest: "{{ project_dir }}/{{ app_name }}/{{ item | basename }}"
        owner: appuser
        group: appuser
        mode: '0644'
      with_fileglob:
        - "../{{ compose_file }}"

    - name: Create .env file for {{ app_name }}
      copy:
        content: |
          NODE_ENV=production
          SITE_DOMAIN={{ app_domain }}
          APP_NAME={{ app_name }}
        dest: "{{ project_dir }}/{{ app_name }}/.env"
        owner: appuser
        group: appuser
        mode: '0600'

    - name: Stop existing containers for {{ app_name }}
      docker_compose:
        project_src: "{{ project_dir }}/{{ app_name }}"
        state: absent
      ignore_errors: yes

    - name: Deploy {{ app_name }} with Traefik labels
      docker_compose:
        project_src: "{{ project_dir }}/{{ app_name }}"
        state: present
        definition:
          version: '3.8'
          services:
            avito-{{ app_name }}:
              build:
                context: .
                dockerfile: Dockerfile
              container_name: "avito-{{ app_name }}"
              networks:
                - reverse-proxy
              labels:
                - "traefik.enable=true"
                - "traefik.docker.network=reverse-proxy"
                - "traefik.http.routers.avito-{{ app_name }}.rule=Host(\`{{ app_domain }}\`) && PathPrefix(\`/avito/\`)"
                - "traefik.http.routers.avito-{{ app_name }}.tls=true"
                - "traefik.http.routers.avito-{{ app_name }}.tls.certresolver=letsencrypt"
                - "traefik.http.routers.avito-{{ app_name }}.entrypoints=websecure"
                - "traefik.http.routers.avito-{{ app_name }}.middlewares=avito-{{ app_name }}-stripprefix"
                - "traefik.http.middlewares.avito-{{ app_name }}-stripprefix.stripprefix.prefixes=/avito"
                - "traefik.http.services.avito-{{ app_name }}.loadbalancer.server.port=5001"
              environment:
                - NODE_ENV=production
                - SITE_DOMAIN={{ app_domain }}
                - BASE_URL={{ base_url_avito | default('https://api.avito.ru') }}
              entrypoint: ["npm", "run", "start:prod"]
            hh-{{ app_name }}:
              build:
                context: .
                dockerfile: Dockerfile
              container_name: "hh-{{ app_name }}"
              networks:
                - reverse-proxy
              labels:
                - "traefik.enable=true"
                - "traefik.docker.network=reverse-proxy"
                - "traefik.http.routers.hh-{{ app_name }}.rule=Host(\`{{ app_domain }}\`) && PathPrefix(\`/hh/\`)"
                - "traefik.http.routers.hh-{{ app_name }}.tls=true"
                - "traefik.http.routers.hh-{{ app_name }}.tls.certresolver=letsencrypt"
                - "traefik.http.routers.hh-{{ app_name }}.entrypoints=websecure"
                - "traefik.http.routers.hh-{{ app_name }}.middlewares=hh-{{ app_name }}-stripprefix"
                - "traefik.http.middlewares.hh-{{ app_name }}-stripprefix.stripprefix.prefixes=/hh"
                - "traefik.http.services.hh-{{ app_name }}.loadbalancer.server.port=5002"
              environment:
                - NODE_ENV=production
                - SITE_DOMAIN={{ app_domain }}
                - BASE_URL={{ base_url_hh | default('https://api.hh.ru') }}
              entrypoint: ["npm", "run", "start:prod"]
          networks:
            reverse-proxy:
              external: true

    - name: Wait for containers to start
      pause:
        seconds: 10

    - name: Display {{ app_name }} deployment status
      debug:
        msg: |
          ========================================
          {{ app_name | upper }} РАЗВЕРНУТ УСПЕШНО
          Домен: https://{{ app_domain }}
          Avito API: https://{{ app_domain }}/avito/
          HH API: https://{{ app_domain }}/hh/
          ========================================
      delegate_to: localhost
      run_once: true
      become: no
EOF

# Запускаем деплой
ansible-playbook -i inventory.ini deploy-temp-app.yml --private-key=$SSH_PRIVATE_KEY -u appuser

# Удаляем временный файл
rm deploy-temp-app.yml

echo "========================================"
echo "ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!"
echo "Приложение: https://$DOMAIN"
echo "Avito API: https://$DOMAIN/avito/"
echo "HH API: https://$DOMAIN/hh/"
echo "========================================"
