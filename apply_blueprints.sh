#!/bin/bash
source "${GITHUB_ACTION_PATH}/common.sh"

for fn in $blueprints_files; do
    echo "::group::Blueprint $fn"
    $_ak_dc exec worker ak apply_blueprint "action-setup-authentik/${fn}"
    echo "::endgroup::"
done
