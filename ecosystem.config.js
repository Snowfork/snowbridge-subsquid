module.exports = {
  apps: [
    {
      name: "ethereum",
      node_args: "--require=dotenv/config",
      script: "./lib/ethereum/main.js",
    },
    {
      name: "bridgehub",
      node_args: "--require=dotenv/config",
      script: "./lib/bridgehub/main.js",
    },
    {
      name: "assethub",
      node_args: "--require=dotenv/config",
      script: "./lib/assethub/main.js",
    },
    {
      name: "hydration",
      node_args: "--require=dotenv/config",
      script: "./lib/parachains/hydration/main.js",
    },
    {
      name: "moonbeam",
      node_args: "--require=dotenv/config",
      script: "./lib/parachains/moonbeam/main.js",
    },
    {
      name: "bifrost",
      node_args: "--require=dotenv/config",
      script: "./lib/parachains/bifrost/main.js",
    },
    {
      name: "acala",
      node_args: "--require=dotenv/config",
      script: "./lib/parachains/acala/main.js",
    },
    {
      name: "mythos",
      node_args: "--require=dotenv/config",
      script: "./lib/parachains/mythos/main.js",
    },
    {
      name: "graphql",
      script: "./node_modules/.bin/squid-graphql-server",
    },
    {
      name: "postprocess",
      node_args: "--require=dotenv/config",
      script: "./lib/postprocess/cron.js",
    },
  ],
};
