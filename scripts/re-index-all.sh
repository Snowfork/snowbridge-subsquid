set -e

pm2 stop ecosystem.config.js

docker exec snowbridge-subsquid-db-1 /bin/sh -c 'psql -h localhost -U postgres -c "drop database squid_v2 WITH (FORCE);" -c "create database squid_v2;"'

sqd clean && sqd codegen && sqd build && sqd migration:apply

pm2 start ecosystem.config.js


