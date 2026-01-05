#!/bin/bash
set -euo pipefail
if ! [[ -z ${RUNNER_DEBUG+x} ]]; then
    set -x
fi

export COMPOSE_PROJECT_NAME=authentik

ak_temp_dir="${RUNNER_TEMP}/${GITHUB_ACTION}"
mkdir -p "${ak_temp_dir}"
