#!/bin/bash
set -euo pipefail
if ! [[ -z ${RUNNER_DEBUG+x} ]]; then
    set -x
fi
