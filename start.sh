#!/bin/bash
source "${GITHUB_ACTION_PATH}/common.sh"

export COMPOSE_PROJECT_NAME=authentik
echo "::group::Pulling authentik images..."
$_ak_dc pull -q
echo "::endgroup::"
echo "::group::Starting authentik..."
$_ak_dc up -d --wait
echo "::endgroup::"

server_container=$(docker ps -f label=com.docker.compose.project=authentik -f label=com.docker.compose.service=server --format "{{.ID}}")
worker_container=$(docker ps -f label=com.docker.compose.project=authentik -f label=com.docker.compose.service=worker --format "{{.ID}}")
echo "server_container=${server_container}" >> "${GITHUB_OUTPUT}"
echo "worker_container=${worker_container}" >> "${GITHUB_OUTPUT}"
