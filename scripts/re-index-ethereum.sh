set -e

pm2 stop ethereum

docker exec snowbridge-subsquid-db-1 /bin/sh -c 'psql -h localhost -U postgres -d squid_v2 -c "drop schema eth_processor cascade;"'

pm2 start ethereum


