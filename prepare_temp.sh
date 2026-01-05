#!/bin/bash
source ${GITHUB_ACTION_PATH}/common.sh

temp_dir="${RUNNER_TEMP}/${GITHUB_ACTION}"
mkdir -p ${temp_dir}

echo "ak_temp_dir=${temp_dir}" >> $GITHUB_ENV
