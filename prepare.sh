#!/bin/bash
source "${GITHUB_ACTION_PATH}/common.sh"

pg_pass=$(openssl rand -base64 32)
secret_key=$(openssl rand -base64 40)

echo "::add-mask::${pg_pass}"
echo "::add-mask::${secret_key}"

echo "PG_PASS='${pg_pass}'" >> "${ak_temp_dir}/.env"
echo "AUTHENTIK_SECRET_KEY='${secret_key}'" >> "${ak_temp_dir}/.env"
echo "AUTHENTIK_ERROR_REPORTING__ENABLED=true" >> "${ak_temp_dir}/.env"
echo "AUTHENTIK_ERROR_REPORTING__ENVIRONMENT=${INPUT_SENTRY_ENV}" >> "${ak_temp_dir}/.env"
echo "AUTHENTIK_DISABLE_UPDATE_CHECK=true" >> "${ak_temp_dir}/.env"
echo "AUTHENTIK_DISABLE_STARTUP_ANALYTICS=true" >> "${ak_temp_dir}/.env"
echo "CI=true" >> "${ak_temp_dir}/.env"

AUTHENTIK_BOOTSTRAP_TOKEN=$(openssl rand -base64 32)
echo "::add-mask::${AUTHENTIK_BOOTSTRAP_TOKEN}"
echo "AUTHENTIK_BOOTSTRAP_TOKEN='${AUTHENTIK_BOOTSTRAP_TOKEN}'" >> "${ak_temp_dir}/.env"
echo "AUTHENTIK_BOOTSTRAP_TOKEN='${AUTHENTIK_BOOTSTRAP_TOKEN}'" >> "${GITHUB_ENV}"
echo "admin_token=${AUTHENTIK_BOOTSTRAP_TOKEN}" >> "${GITHUB_OUTPUT}"

AUTHENTIK_BOOTSTRAP_PASSWORD=$(openssl rand -base64 32)
echo "::add-mask::${AUTHENTIK_BOOTSTRAP_PASSWORD}"
echo "AUTHENTIK_BOOTSTRAP_PASSWORD='${AUTHENTIK_BOOTSTRAP_PASSWORD}'" >> "${ak_temp_dir}/.env"
echo "AUTHENTIK_BOOTSTRAP_PASSWORD='${AUTHENTIK_BOOTSTRAP_PASSWORD}'" >> "${GITHUB_ENV}"
echo "admin_password=${AUTHENTIK_BOOTSTRAP_PASSWORD}" >> "${GITHUB_OUTPUT}"
