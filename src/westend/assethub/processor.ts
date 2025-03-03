import { assertNotNull } from "@subsquid/util-internal";
import {
  BlockHeader,
  DataHandlerContext,
  SubstrateBatchProcessor,
  SubstrateBatchProcessorFields,
  Event as _Event,
  Call as _Call,
  Extrinsic as _Extrinsic,
} from "@subsquid/substrate-processor";

import { events } from "./types";

const SUBSQUID_NETWORK =
  process.env["SUBSQUID_NETWORK_ASSETHUB"] || "asset-hub-westend";

const START_BLOCK = process.env["START_BLOCK_ASSETHUB"]
  ? parseInt(process.env["START_BLOCK_ASSETHUB"])
  : 9102740;

const RPC_URL =
  process.env["RPC_ASSETHUB"] || "wss://asset-hub-westend-rpc.dwellir.com";

export const processor = new SubstrateBatchProcessor()
  // Lookup archive by the network name in Subsquid registry
  // See https://docs.subsquid.io/substrate-indexing/supported-networks/
  .setGateway(`https://v2.archive.subsquid.io/network/${SUBSQUID_NETWORK}`)
  // Chain RPC endpoint is required on Substrate for metadata and real-time updates
  .setRpcEndpoint({
    // Set via .env for local runs or via secrets when deploying to Subsquid Cloud
    // https://docs.subsquid.io/deploy-squid/env-variables/
    url: RPC_URL,
    // More RPC connection options at https://docs.subsquid.io/substrate-indexing/setup/general/#set-data-source
    rateLimit: 10,
  })
  .setBlockRange({
    from: START_BLOCK,
  })
  .addEvent({
    name: [
      events.messageQueue.processed.name,
      events.messageQueue.processingFailed.name,
      events.polkadotXcm.sent.name,
      events.foreignAssets.burned.name,
      events.foreignAssets.issued.name,
      events.xcmpQueue.xcmpMessageSent.name,
    ],
    extrinsic: true,
  })
  .setFields({
    event: {
      args: true,
    },
    extrinsic: {
      hash: true,
      fee: true,
    },
    block: {
      timestamp: true,
    },
  });
// Uncomment to disable RPC ingestion and drastically reduce no of RPC calls
//.useArchiveOnly()

export type Fields = SubstrateBatchProcessorFields<typeof processor>;
export type Block = BlockHeader<Fields>;
export type Event = _Event<Fields>;
export type Call = _Call<Fields>;
export type Extrinsic = _Extrinsic<Fields>;
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>;
