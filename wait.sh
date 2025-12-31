#!/bin/bash
set -euo pipefail

while true; do
    echo "Testing authentik with URL ${_AK_WAIT_URL}..."
    status=$(curl \
        -s \
        -o /dev/null \
        -w ''%{http_code}'' \
        -H "Authorization: Bearer ${_AK_TOKEN}" \
        ${_AK_WAIT_URL})
    if [[ $status == "200" ]]; then
        exit 0
    fi
    sleep 5
done
