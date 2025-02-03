#!/usr/bin/env bash
set -eu

source ./scripts/set-env.sh

pm2 stop moonbeam

docker exec snowbridge-subsquid-db-1 /bin/sh -c 'psql -h localhost -U postgres -d '$database' -c "drop schema moonbeam_processor cascade;"'

pm2 start moonbeam


