module.exports = {
  apps: [
    {
      name: "sepolia-ethereum",
      node_args: "--require=dotenv/config",
      script: "./lib/ethereum/main.js",
    },
    {
      name: "westend-bridgehub",
      node_args: "--require=dotenv/config",
      script: "./lib/bridgehub/main.js",
    },
    {
      name: "westend-assethub",
      node_args: "--require=dotenv/config",
      script: "./lib/assethub/main.js",
    },
    {
      name: "westend-graphql",
      script: "./node_modules/.bin/squid-graphql-server",
    },
    {
      name: "westend-postprocess",
      node_args: "--require=dotenv/config",
      script: "./lib/postprocess/cron.js",
    },
  ],
};
