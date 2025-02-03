#!/usr/bin/env bash
set -eu

source ./scripts/set-env.sh

pm2 stop ecosystem.config.js

docker exec snowbridge-subsquid-db-1 /bin/sh -c 'psql -h localhost -U postgres -c "drop database '$database' WITH (FORCE);" -c "create database '$database';"'

sqd clean && sqd codegen && sqd build && sqd migration:apply

pm2 start ecosystem.config.js


