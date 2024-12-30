set -e

pm2 stop bridgehub

docker exec snowbridge-subsquid-db-1 /bin/sh -c 'psql -h localhost -U postgres -d squid_v2 -c "drop schema bridgehub_processor cascade;"'

pm2 start bridgehub


