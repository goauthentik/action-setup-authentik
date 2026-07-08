#!/bin/bash
source "${GITHUB_ACTION_PATH}/common.sh"

install_id=$(curl -sf -H "Authorization: Bearer ${_AK_TOKEN}" \
    "http://localhost:9000/api/v3/enterprise/license/install_id/" | jq -r '.install_id')

response=$(curl -sf -X POST 'https://customers.goauthentik.io/api/v1/license/create/dev/' \
    --header 'Accept: */*' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer ${_AK_CUSTOMER_TOKEN}" \
    --data "{
        \"install_id\": \"${install_id}\",
        \"users_internal\": ${INPUT_ENTERPRISE_LICENSE_USERS_INTERNAL},
        \"users_external\": ${INPUT_ENTERPRISE_LICENSE_USERS_EXTERNAL}
    }")

license_key=$(echo "${response}" | jq -r '.license_key')
echo "::add-mask::${license_key}"
echo "enterprise_license_key=${license_key}" >> "${GITHUB_OUTPUT}"

curl -sf -X POST "http://localhost:9000/api/v3/enterprise/license/" \
    -H "Authorization: Bearer ${_AK_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"key\": \"${license_key}\"}"
