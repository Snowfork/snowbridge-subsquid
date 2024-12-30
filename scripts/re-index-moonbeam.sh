set -e

pm2 stop moonbeam

docker exec snowbridge-subsquid-db-1 /bin/sh -c 'psql -h localhost -U postgres -d squid_v2 -c "drop schema moonbeam_processor cascade;"'

pm2 start moonbeam


