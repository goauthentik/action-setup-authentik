#!/bin/bash
source ${GITHUB_ACTION_PATH}/common.sh

path=$(realpath "${GITHUB_WORKSPACE}/${INPUT_BLUEPRINTS_PATH}")
blueprints_files=$(find "${path}" -type f -mindepth 1 -printf '%P\n')
echo "blueprints_files<<EOF" >> $GITHUB_ENV
echo "${blueprints_files}" >> $GITHUB_ENV
echo "EOF" >> $GITHUB_ENV

cat <<EOT >> "${ak_temp_dir}/docker-compose.override.yml"
services:
  worker:
    volumes:
      - "${path}:/blueprints/action-setup-authentik"
EOT
echo _ak_dc="$_ak_dc -f ${ak_temp_dir}/docker-compose.override.yml" >> $GITHUB_ENV
