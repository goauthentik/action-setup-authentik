#!/bin/bash
source "${GITHUB_ACTION_PATH}/common.sh"

source "${ak_temp_dir}/.env"

while true; do
    echo "Testing authentik with URL ${_AK_WAIT_URL}..."
    status=$(curl \
        -s \
        -o /dev/null \
        -w ''%{http_code}'' \
        -H "Authorization: Bearer ${AUTHENTIK_BOOTSTRAP_TOKEN}" \
        "${_AK_WAIT_URL}")
    if [[ $status == "200" ]]; then
        exit 0
    fi
    sleep 5
done
