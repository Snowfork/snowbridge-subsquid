module.exports = {
  apps: [
    {
      name: "staging-ethereum",
      node_args: "--require=dotenv/config",
      script: "./lib/polkadot/ethereum/main.js",
    },
    {
      name: "staging-bridgehub",
      node_args: "--require=dotenv/config",
      script: "./lib/polkadot/bridgehub/main.js",
    },
    {
      name: "staging-assethub",
      node_args: "--require=dotenv/config",
      script: "./lib/polkadot/assethub/main.js",
    },
    {
      name: "staging-hydration",
      node_args: "--require=dotenv/config",
      script: "./lib/polkadot/parachains/hydration/main.js",
    },
    {
      name: "staging-moonbeam",
      node_args: "--require=dotenv/config",
      script: "./lib/polkadot/parachains/moonbeam/main.js",
    },
    {
      name: "staging-bifrost",
      node_args: "--require=dotenv/config",
      script: "./lib/polkadot/parachains/bifrost/main.js",
    },
    {
      name: "staging-acala",
      node_args: "--require=dotenv/config",
      script: "./lib/polkadot/parachains/acala/main.js",
    },
    {
      name: "staging-mythos",
      node_args: "--require=dotenv/config",
      script: "./lib/polkadot/parachains/mythos/main.js",
    },
    {
      name: "staging-graphql",
      script: "./node_modules/.bin/squid-graphql-server",
    },
    {
      name: "staging-postprocess",
      node_args: "--require=dotenv/config",
      script: "./lib/postprocess/cron.js",
    },
  ],
};
