set -e

sqd clean && sqd codegen && sqd build && sqd migration:clean && sqd migration && sqd migration:apply

node --require=dotenv/config lib/ethereum/main.js &
node --require=dotenv/config lib/bridgehub/main.js &
node --require=dotenv/config lib/assethub/main.js &
node --require=dotenv/config lib/parachains/hydration/main.js &
node --require=dotenv/config lib/postprocess/main.js
