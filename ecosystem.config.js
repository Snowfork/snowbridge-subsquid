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
  ],
};
