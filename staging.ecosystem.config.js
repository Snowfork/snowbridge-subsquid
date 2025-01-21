module.exports = {
  apps: [
    {
      name: "staging-ethereum",
      node_args: "--require=dotenv/config",
      script: "./lib/ethereum/main.js",
    },
    {
      name: "staging-bridgehub",
      node_args: "--require=dotenv/config",
      script: "./lib/bridgehub/main.js",
    },
    {
      name: "staging-assethub",
      node_args: "--require=dotenv/config",
      script: "./lib/assethub/main.js",
    },
    {
      name: "staging-hydration",
      node_args: "--require=dotenv/config",
      script: "./lib/parachains/hydration/main.js",
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
