#!/bin/bash
source "${GITHUB_ACTION_PATH}/common.sh"

if ! [[ -z ${RUNNER_DEBUG+x} ]]; then
    echo "AUTHENTIK_LOG_LEVEL=debug" >> "${ak_temp_dir}/.env"
fi
if [ "${INPUT_VERSION}" = "beta" ]; then
    echo "AUTHENTIK_IMAGE=ghcr.io/goauthentik/dev-server" >> "${ak_temp_dir}/.env"
    echo "AUTHENTIK_TAG=gh-next" >> "${ak_temp_dir}/.env"
    echo "AUTHENTIK_OUTPOSTS__DOCKER_IMAGE_BASE=ghcr.io/goauthentik/dev-%(type)s:gh-%(build_hash)s" >> "${ak_temp_dir}/.env"
elif [ "${INPUT_VERSION}" != "stable" ]; then
    echo "AUTHENTIK_TAG=${INPUT_VERSION}" >> "${ak_temp_dir}/.env"
fi
wget --quiet https://goauthentik.io/compose.yml -O "${ak_temp_dir}/docker-compose.yml"
echo _ak_dc="docker compose --env-file ${ak_temp_dir}/.env -f ${ak_temp_dir}/docker-compose.yml" >> "${GITHUB_ENV}"
