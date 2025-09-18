#!/bin/bash

# Universal Application Deployment Script
# Usage: ./run-universal-deploy.sh <domain> <client_name> [additional_vars]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  $0 <domain> <client_name> [additional_vars]"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0 app.example.com client1"
    echo "  $0 app.example.com client1 \"redis_password=mypass webhook_url=https://webhook.example.com\""
    echo ""
    echo -e "${BLUE}Required parameters:${NC}"
    echo "  domain        - Domain name for the application (IP will be resolved from DNS)"
    echo "  client_name   - Client identifier (used for container names)"
    echo ""
    echo -e "${BLUE}Optional parameters:${NC}"
    echo "  additional_vars - Additional Ansible variables in key=value format"
    echo ""
    echo -e "${BLUE}Environment variables (can be set instead of additional_vars):${NC}"
    echo "  AVITO_API_URL         - Avito API base URL (default: https://api.avito.ru)"
    echo "  HH_CLIENT_ID          - HH API client ID"
    echo "  HH_CLIENT_SECRET      - HH API client secret"
    echo "  HH_API_URL            - HH API base URL (default: https://api.hh.ru)"
    echo "  WEBHOOK_URL_AVITO     - Webhook URL for Avito notifications"
    echo "  WEBHOOK_URL_HH        - Webhook URL for HH notifications"
    echo "  SENTRY_DSN         - Sentry DSN (optional)"
}

# Check if help is requested
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    usage
    exit 0
fi

# Check minimum required parameters
if [[ $# -lt 2 ]]; then
    echo -e "${RED}Error: Missing required parameters${NC}"
    echo ""
    usage
    exit 1
fi

DOMAIN="$1"
CLIENT_NAME="$2"
shift 2

# Additional variables
ADDITIONAL_VARS=""
if [[ $# -gt 0 ]]; then
    ADDITIONAL_VARS="$*"
fi

# DNS resolution
echo -e "${BLUE}🔍 Resolving DNS for $DOMAIN...${NC}"
IP_ADDRESS=$(dig +short $DOMAIN | head -n1)
if [ -z "$IP_ADDRESS" ]; then
    echo -e "${RED}❌ DNS record for $DOMAIN not found!${NC}"
    echo "Please configure DNS A record pointing to your server"
    exit 1
fi
echo -e "${GREEN}✅ DNS: $DOMAIN -> $IP_ADDRESS${NC}"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}🚀 UNIVERSAL APPLICATION DEPLOYMENT${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}🌐 Domain:${NC} $DOMAIN"
echo -e "${GREEN}🔗 IP Address:${NC} $IP_ADDRESS"
echo -e "${GREEN}👤 Client:${NC} $CLIENT_NAME"
echo -e "${BLUE}=========================================${NC}"

# Check if SSH key exists
if [[ ! -f ~/.ssh/id_rsa ]]; then
    echo -e "${RED}Error: SSH private key not found at ~/.ssh/id_rsa${NC}"
    echo "Please ensure your SSH key is properly configured."
    exit 1
fi

# Build ansible-playbook command
ANSIBLE_CMD="ansible-playbook -i \"$IP_ADDRESS,\" deploy-universal.yml --private-key=~/.ssh/id_rsa -u appuser -e \"site_domain=$DOMAIN\" -e \"client_name=$CLIENT_NAME\""

# Add additional variables if provided
if [[ -n "$ADDITIONAL_VARS" ]]; then
    ANSIBLE_CMD="$ANSIBLE_CMD -e \"$ADDITIONAL_VARS\""
fi

# Add environment variables if they exist
if [[ -n "$AVITO_API_URL" ]]; then
    ANSIBLE_CMD="$ANSIBLE_CMD -e \"avito_api_url=$AVITO_API_URL\""
fi
if [[ -n "$HH_CLIENT_ID" ]]; then
    ANSIBLE_CMD="$ANSIBLE_CMD -e \"hh_client_id=$HH_CLIENT_ID\""
fi
if [[ -n "$HH_CLIENT_SECRET" ]]; then
    ANSIBLE_CMD="$ANSIBLE_CMD -e \"hh_client_secret=$HH_CLIENT_SECRET\""
fi
if [[ -n "$HH_API_URL" ]]; then
    ANSIBLE_CMD="$ANSIBLE_CMD -e \"hh_api_url=$HH_API_URL\""
fi
if [[ -n "$WEBHOOK_URL_AVITO" ]]; then
    ANSIBLE_CMD="$ANSIBLE_CMD -e \"webhook_url_avito=$WEBHOOK_URL_AVITO\""
fi
if [[ -n "$WEBHOOK_URL_HH" ]]; then
    ANSIBLE_CMD="$ANSIBLE_CMD -e \"webhook_url_hh=$WEBHOOK_URL_HH\""
fi
if [[ -n "$SENTRY_DSN" ]]; then
    ANSIBLE_CMD="$ANSIBLE_CMD -e \"sentry_dsn=$SENTRY_DSN\""
fi

# Add environment variable for host key checking
export ANSIBLE_HOST_KEY_CHECKING=False

echo -e "${YELLOW}Running Ansible playbook...${NC}"
echo ""

# Execute the command
eval $ANSIBLE_CMD

# Check exit status
if [[ $? -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${BLUE}🌐 Application URL:${NC} https://$DOMAIN"
    echo -e "${BLUE}📱 Avito API:${NC} https://$DOMAIN/avito/"
    echo -e "${BLUE}📱 HH API:${NC} https://$DOMAIN/hh/"
    echo -e "${BLUE}🐳 Portainer:${NC} https://$DOMAIN/portainer/"
    echo -e "${BLUE}🚦 Traefik:${NC} https://$DOMAIN/traefik/"
    echo -e "${GREEN}=========================================${NC}"
else
    echo ""
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}❌ DEPLOYMENT FAILED!${NC}"
    echo -e "${RED}=========================================${NC}"
    echo "Check the error messages above for details."
    exit 1
fi
