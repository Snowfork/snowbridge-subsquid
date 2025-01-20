export api_end_point="https://data.snowbridge.network/graphql"

echo "Query the recent 100 transfers from ethereum to polkadot:"
curl -H 'Content-Type: application/json' \
-X POST -d \
'{ "query": "query { transferStatusToPolkadots(limit: 5, orderBy: blockNumber_DESC) { txHash status channelId destinationAddress messageId nonce senderAddress timestamp tokenAddress amount} }" }' \
$api_end_point --no-progress-meter | jq "."

echo "query the recent 100 transfers from polkadot to ethereum:"

curl -H 'Content-Type: application/json' \
-X POST -d \
'{ "query": "query { transferStatusToEthereums(limit: 5, orderBy: blockNumber_DESC) { txHash status channelId destinationAddress messageId nonce senderAddress timestamp tokenAddress amount} }" }' \
$api_end_point --no-progress-meter | jq "."
