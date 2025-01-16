set -e

pm2 stop assethub

docker exec snowbridge-subsquid-db-1 /bin/sh -c 'psql -h localhost -U postgres -d squid_v2 -c "drop schema assethub_processor cascade;"'

pm2 start assethub


