set -e

pm2 stop staging.ecosystem.config.js

docker exec snowbridge-subsquid-db-1 /bin/sh -c 'psql -h localhost -U postgres -c "drop database squid_staging WITH (FORCE);" -c "create database squid_staging;"'

sqd clean && sqd codegen && sqd build && sqd migration:apply

pm2 start staging.ecosystem.config.js


