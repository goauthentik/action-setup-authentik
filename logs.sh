#!/bin/bash
source "${GITHUB_ACTION_PATH}/common.sh"

echo "::group::authentik Logs"
$_ak_dc logs
echo "::endgroup::"
