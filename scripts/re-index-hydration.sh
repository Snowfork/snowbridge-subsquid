set -e

pm2 stop hydration

docker exec snowbridge-subsquid-db-1 /bin/sh -c 'psql -h localhost -U postgres -d squid_v2 -c "drop schema hydration_processor cascade;"'

pm2 start hydration


