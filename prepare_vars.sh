#!/bin/bash
source ${GITHUB_ACTION_PATH}/common.sh

pg_pass=$(openssl rand -base64 32)
secret_key=$(openssl rand -base64 40)

echo "::add-mask::${pg_pass}"
echo "::add-mask::${secret_key}"

echo "PG_PASS=${pg_pass}" >> "${ak_temp_dir}/.env"
echo "AUTHENTIK_SECRET_KEY=${secret_key}" >> "${ak_temp_dir}/.env"
echo "AUTHENTIK_ERROR_REPORTING__ENABLED=true" >> "${ak_temp_dir}/.env"
echo "AUTHENTIK_ERROR_REPORTING__ENVIRONMENT=${{ inputs.sentry_env }}" >> "${ak_temp_dir}/.env"
echo "AUTHENTIK_DISABLE_UPDATE_CHECK=true" >> "${ak_temp_dir}/.env"
echo "AUTHENTIK_DISABLE_STARTUP_ANALYTICS=true" >> "${ak_temp_dir}/.env"
echo "CI" >> "${ak_temp_dir}/.env"
