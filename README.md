# Squid Snowbridge project

A [Squid](https://subsquid.io) project to index snowbridge transfers. It accumulates transfer events from multiple chains(i.e. Ethereum, Bridgehub, Assethub) and serves them via GraphQL API.

## Summary

- [Quickstart](#quickly-running-the-sample)
- [Development flow](#dev-flow)
  - [Database Schema](#1-define-database-schema)
  - [Entity classes](#2-generate-typeorm-classes)
  - [DB migrations](#3-generate-database-migration)
  - [Typegen for Events, Extrinsics and Storage Calls](#4-generate-typescript-definitions-for-substrate-events-calls-and-storage)
- [Conventions](#project-conventions)

## Prerequisites

- node 20.x
- docker
- npm -- note that `yarn` package manager is not supported

## Quickly running the sample

Example commands below use [sqd](https://docs.subsquid.io/squid-cli/).
Please [install](https://docs.subsquid.io/squid-cli/installation/) it before proceeding.

```bash
# 1. Install dependencies
npm ci

# 2. Copy the env and make change if necessary
cp .env.example .env

# 3. Start target Postgres database and detach
sqd up

# 4. Build the project
sqd build

# 5. Generate database migration
sqd migration:clean && sqd migration && sqd migration:apply

# 6. Start the squid processor for ethereum
sqd process:ethereum

# 7. Start the squid processor for bridgehub
sqd process:bridgehub

# 8. Start the squid processor for assethub
sqd process:assethub

# 9. Start the graphql api
sqd serve
```

A GraphiQL playground will be available at [localhost:4350/graphql](http://localhost:4350/graphql).

## Development flow

### 1. Define database schema

Start development by defining the schema of the target database via `schema.graphql`.
Schema definition consists of regular graphql type declarations annotated with custom directives.
Full description of `schema.graphql` dialect is available [here](https://docs.subsquid.io/store/postgres/schema-file/).

### 2. Generate TypeORM classes

Mapping developers use [TypeORM](https://typeorm.io) entities
to interact with the target database during data processing. All necessary entity classes are
[generated](https://docs.subsquid.io/store/postgres/schema-file/intro/) by the squid framework from `schema.graphql`. This is done by running `npx squid-typeorm-codegen`
or (equivalently) `sqd codegen` command.

### 3. Generate database migration

All database changes are applied through migration files located at `db/migrations`.
`squid-typeorm-migration(1)` tool provides several commands to drive the process.
It is all [TypeORM](https://typeorm.io/#/migrations) under the hood.

```bash
# Connect to database, analyze its state and generate migration to match the target schema.
# The target schema is derived from entity classes generated earlier.
# Don't forget to compile your entity classes beforehand!
npx squid-typeorm-migration generate

# Create template file for custom database changes
npx squid-typeorm-migration create

# Apply database migrations from `db/migrations`
npx squid-typeorm-migration apply

# Revert the last performed migration
npx squid-typeorm-migration revert
```

Available `sqd` shortcuts:

```bash
# Build the project, remove any old migrations, then run `npx squid-typeorm-migration generate`
sqd migration:generate

# Run npx squid-typeorm-migration apply
sqd migration:apply
```

### 4. Generate TypeScript definitions for chain events, calls and storage

This is an optional part, but it is very advisable.

Event, call and runtime storage data come to mapping handlers as raw untyped json.
While it is possible to work with raw untyped json data,
it's extremely error-prone and the json structure may change over time due to runtime upgrades.

Squid framework provides a tool for generating type-safe wrappers around events, calls and runtime storage items for
each historical change in the spec version. See the [typegen](https://docs.subsquid.io/sdk/resources/tools/typegen/generation/) page for different chains.

## Project conventions

Squid tools assume a certain project layout.

- All compiled js files must reside in `lib` and all TypeScript sources in `src`.
  The layout of `lib` must reflect `src`.
- All TypeORM classes must be exported by `src/model/index.ts` (`lib/model` module).
- Database schema must be defined in `schema.graphql`.
- Database migrations must reside in `db/migrations` and must be plain js files.
- `squid-*(1)` executables consult `.env` file for a number of environment variables.

See the [full desription](https://docs.subsquid.io/basics/squid-structure/) in the documentation.

## Graphql server extensions

Basically transfer status should be resolved by these two queries.
- transferStatusToPolkadots
- transferStatusToEthereums

It is possible to extend `squid-graphql-server(1)` with custom
[type-graphql](https://typegraphql.com) resolvers and to add request validation.
For more details, consult [docs](https://docs.subsquid.io/graphql-api/).

## Deploy to subsquid cloud

Follow the guides in:

- https://docs.sqd.dev/cloud/overview/

- https://app.subsquid.io/squids/deploy

first login with the api key with:

```
sqd auth -k YOUR_API_TOKEN
```


then deploy to cloud with:

```
sqd deploy --org snowbridge .
```

### How to use the API

UI or 3rd teams can query transfers through Snowbridge from this indexer, explore https://data.snowbridge.network/graphql for the querys we support.

For easy usage we aggregate all data to two queries, which is `transferStatusToEthereums` for direction to ethereum and `transferStatusToPolkadots` for the other direction. A demo script for reference:

```
./scripts/query-transfers.sh
```

and the result is something like:

```
"transferStatusToPolkadots": [
      {
        "txHash": "0x53597b6f98334a160f26182398ec3e7368be8ca7aea3eea41d288046f3a1999d",
        "status": 1, // 0:pending, 1: completed 2: failed
        "channelId": "0xc173fac324158e77fb5840738a1a541f633cbec8884c6a601c567d2b376a0539",
        "destinationAddress": "0x628119c736c0e8ff28bd2f42920a4682bd6feb7b000000000000000000000000",
        "messageId": "0x00d720d39256bab74c0be362005b9a50951a0909e6dabda588a5d319bfbedb65",
        "nonce": 561,
        "senderAddress": "0x628119c736c0e8ff28bd2f42920a4682bd6feb7b",
        "timestamp": "2025-01-20T07:09:47.000000Z",
        "tokenAddress": "0xba41ddf06b7ffd89d1267b5a93bfef2424eb2003",
        "amount": "68554000000000000000000"
      },
      ...
],
"transferStatusToEthereums": [
      {
        "txHash": "0xb57627dbcc89be3bdaf465676fced56eeb32d95855db003f1e911aa4c3769059",
        "status": 1, // 0:pending, 1: completed 2: failed
        "channelId": "0xc173fac324158e77fb5840738a1a541f633cbec8884c6a601c567d2b376a0539",
        "destinationAddress": "0x2a9b5c906c6cac92dc624ec0fa6c3b4c9f2e7cc2",
        "messageId": "0x95c52ffe4f976c99bcfe8d76f6011e62b7f215ada834e8c0bcf6538b31b1bf87",
        "nonce": 152,
        "senderAddress": "0x4a79eee26f5dab7c230f7f2c8657cb541a4b8e391c8357f5eb51413f249ddc13",
        "timestamp": "2025-01-20T04:10:48.000000Z",
        "tokenAddress": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "amount": "8133242931806029953"
      },
      ...
]
```
