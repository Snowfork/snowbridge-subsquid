# Squid Snowbridge project

A [Squid](https://subsquid.io) project to index snowbridge transfers. It accumulates transfers from multiple chains(Ethereum,Bridgehub,Assethub) and serves them via GraphQL API.

## Summary

- [Quickstart](#quickly-running-the-sample)
- [Development flow](#dev-flow)
  - [Database Schema](#1-define-database-schema)
  - [Entity classes](#2-generate-typeorm-classes)
  - [DB migrations](#3-generate-database-migration)
  - [Typegen for Events, Extrinsics and Storage Calls](#4-generate-typescript-definitions-for-substrate-events-calls-and-storage)
- [Conventions](#project-conventions)

## Prerequisites

- node 18.x
- docker
- npm -- note that `yarn` package manager is not supported

## Quickly running the sample

Example commands below use [sqd](https://docs.subsquid.io/squid-cli/).
Please [install](https://docs.subsquid.io/squid-cli/installation/) it before proceeding.

```bash
# 1. Install dependencies
npm ci

# 2. Start target Postgres database and detach
sqd up

# 3. Build the project
sqd build

# 4. Generate database migration
sqd migration:clean && sqd migration && sqd migration:apply

# 5. Start the squid processor for ethereum
sqd process:ethereum

# 6. Start the squid processor for bridgehub
sqd process:bridgehub

# 6. Start the squid processor for assethub
sqd process:assethub
```

A GraphiQL playground will be available at [localhost:4350/graphql](http://localhost:4350/graphql).

## Dev flow

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
each historical change in the spec version. See the [Substrate typegen](https://docs.subsquid.io/substrate-indexing/squid-substrate-typegen/) documentation page.

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

It is possible to extend `squid-graphql-server(1)` with custom
[type-graphql](https://typegraphql.com) resolvers and to add request validation.
For more details, consult [docs](https://docs.subsquid.io/graphql-api/).
