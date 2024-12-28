import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { processor, ProcessorContext } from "./processor";
import {
  MessageProcessedOnPolkadot,
  TransferStatusToPolkadot,
  TransferStatusToEthereum,
} from "../model";
import { events } from "./types";
import { Bytes } from "./types/support";
import {
  AggregateMessageOrigin,
  V4Instruction,
  V4Location,
  ProcessMessageError,
  V3MultiLocation,
} from "./types/v1002000";
import { V4Location as V4Location1003004 } from "./types/v1003004";
import { TransferStatusEnum, BridgeHubParaId, AssetHubParaId } from "../common";

processor.run(
  new TypeormDatabase({
    supportHotBlocks: true,
    stateSchema: "assethub_processor",
  }),
  async (ctx) => {
    await processInboundEvents(ctx);
    await processOutboundEvents(ctx);
  }
);

async function processOutboundEvents(ctx: ProcessorContext<Store>) {
  let transfersToEthereum: TransferStatusToEthereum[] = [],
    forwardMessages: MessageProcessedOnPolkadot[] = [];
  for (let block of ctx.blocks) {
    let foreignAssetBurned = false;
    let messageForwarded: MessageProcessedOnPolkadot;
    let transferToEthereum: TransferStatusToEthereum;
    for (let event of block.events) {
      if (event.name == events.foreignAssets.burned.name) {
        let rec: {
          assetId: V3MultiLocation;
        };
        if (events.foreignAssets.burned.v1002000.is(event)) {
          rec = events.foreignAssets.burned.v1002000.decode(event);
          if (
            rec.assetId.parents == 2 &&
            rec.assetId.interior.__kind == "X2" &&
            rec.assetId.interior.value[0].__kind == "GlobalConsensus" &&
            rec.assetId.interior.value[0].value.__kind == "Ethereum" &&
            rec.assetId.interior.value[1].__kind == "AccountKey20"
          ) {
            foreignAssetBurned = true;
          }
        } else if (events.foreignAssets.burned.v1003004.is(event)) {
          let rec: {
            assetId: V4Location1003004;
          };
          if (events.foreignAssets.burned.v1003004.is(event)) {
            rec = events.foreignAssets.burned.v1003004.decode(event);
            if (
              rec.assetId.parents == 2 &&
              rec.assetId.interior.__kind == "X2" &&
              rec.assetId.interior.value[0].__kind == "GlobalConsensus" &&
              rec.assetId.interior.value[0].value.__kind == "Ethereum" &&
              rec.assetId.interior.value[1].__kind == "AccountKey20"
            ) {
              foreignAssetBurned = true;
            }
          } else {
            throw new Error("Unsupported spec");
          }
        }
      } else if (event.name == events.messageQueue.processed.name) {
        let rec: {
          id: Bytes;
          origin: AggregateMessageOrigin;
          success?: boolean;
          error?: ProcessMessageError;
        };
        if (events.messageQueue.processed.v1002000.is(event)) {
          rec = events.messageQueue.processed.v1002000.decode(event);
        } else {
          throw new Error("Unsupported spec");
        }
        // Filter message from non system parachain
        if (rec.origin.__kind == "Sibling" && rec.origin.value >= 2000) {
          messageForwarded = new MessageProcessedOnPolkadot({
            id: event.id,
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            messageId: rec.id.toString().toLowerCase(),
            paraId: AssetHubParaId,
            success: rec.success,
          });
        }
      } else if (event.name == events.polkadotXcm.sent.name) {
        let rec: {
          origin: V4Location;
          destination: V4Location;
          messageId: Bytes;
          message: V4Instruction[];
        };
        if (events.polkadotXcm.sent.v1002000.is(event)) {
          rec = events.polkadotXcm.sent.v1002000.decode(event);
        } else {
          throw new Error("Unsupported spec");
        }
        if (
          rec.destination.parents == 2 &&
          rec.destination.interior.__kind == "X1" &&
          rec.destination.interior.value[0].__kind == "GlobalConsensus" &&
          rec.destination.interior.value[0].value.__kind == "Ethereum"
        ) {
          let amount: bigint;
          let senderAddress: Bytes;
          let tokenAddress: Bytes;
          let destinationAddress: Bytes;

          let messageId = rec.messageId.toString().toLowerCase();
          if (rec.origin.interior.__kind == "X1") {
            let val = rec.origin.interior.value[0];
            if (val.__kind == "AccountId32") {
              senderAddress = val.id;
            }
          }

          let instruction0 = rec.message[0];
          if (instruction0.__kind == "WithdrawAsset") {
            let asset = instruction0.value[0];
            if (asset.fun.__kind == "Fungible") {
              amount = asset.fun.value;
              if (asset.id.interior.__kind == "X1") {
                let val = asset.id.interior.value[0];
                if (val.__kind == "AccountKey20") {
                  tokenAddress = val.key;
                }
              }
            }
          }

          let instruction3 = rec.message[3];
          if (instruction3.__kind == "DepositAsset") {
            let beneficiary = instruction3.beneficiary;
            if (beneficiary.interior.__kind == "X1") {
              let val = beneficiary.interior.value[0];
              if (val.__kind == "AccountKey20") {
                destinationAddress = val.key;
              }
            }
          }

          transferToEthereum = new TransferStatusToEthereum({
            id: messageId,
            txHash: event.extrinsic?.hash,
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            messageId: messageId,
            tokenAddress: tokenAddress!,
            sourceParaId: AssetHubParaId,
            senderAddress: senderAddress!,
            destinationAddress: destinationAddress!,
            amount: amount!,
            status: TransferStatusEnum.Sent,
          });
        }
      }
    }
    if (messageForwarded!) {
      forwardMessages.push(messageForwarded);
    }
    if (foreignAssetBurned) {
      // Start from AH
      if (transferToEthereum!) {
        let transfer = await ctx.store.findOneBy(TransferStatusToEthereum, {
          id: transferToEthereum.messageId,
        });
        if (!transfer) {
          transfersToEthereum.push(transferToEthereum);
        }
      }
      // Start from 3rd Parachain
      if (messageForwarded!) {
        let transfer = await ctx.store.findOneBy(TransferStatusToEthereum, {
          id: messageForwarded.messageId,
        });
        if (transfer!) {
          transfer.forwardedBlockNumber = block.header.height;
          if (transfer.status == TransferStatusEnum.Sent) {
            transfer.status = TransferStatusEnum.Forwarded;
          }
          transfersToEthereum.push(transfer);
        }
      }
    }
  }

  if (transfersToEthereum.length > 0) {
    ctx.log.debug("saving transfer messages to ethereum");
    await ctx.store.save(transfersToEthereum);
  }

  if (forwardMessages.length > 0) {
    ctx.log.debug("saving forward messages to ethereum");
    await ctx.store.save(forwardMessages);
  }
}

async function processInboundEvents(ctx: ProcessorContext<Store>) {
  let transfersToPolkadot: TransferStatusToPolkadot[] = [],
    processedMessages: MessageProcessedOnPolkadot[] = [];
  for (let block of ctx.blocks) {
    let foreignAssetIssued = false;
    let processedMessage: MessageProcessedOnPolkadot;
    for (let event of block.events) {
      if (event.name == events.foreignAssets.issued.name) {
        let rec: {
          assetId: V3MultiLocation;
        };
        if (events.foreignAssets.issued.v1002000.is(event)) {
          rec = events.foreignAssets.issued.v1002000.decode(event);
          if (
            rec.assetId.parents == 2 &&
            rec.assetId.interior.__kind == "X2" &&
            rec.assetId.interior.value[0].__kind == "GlobalConsensus" &&
            rec.assetId.interior.value[0].value.__kind == "Ethereum" &&
            rec.assetId.interior.value[1].__kind == "AccountKey20"
          ) {
            foreignAssetIssued = true;
          }
        } else if (events.foreignAssets.issued.v1003004.is(event)) {
          let rec: {
            assetId: V4Location1003004;
          };
          if (events.foreignAssets.issued.v1003004.is(event)) {
            rec = events.foreignAssets.issued.v1003004.decode(event);
            if (
              rec.assetId.parents == 2 &&
              rec.assetId.interior.__kind == "X2" &&
              rec.assetId.interior.value[0].__kind == "GlobalConsensus" &&
              rec.assetId.interior.value[0].value.__kind == "Ethereum" &&
              rec.assetId.interior.value[1].__kind == "AccountKey20"
            ) {
              foreignAssetIssued = true;
            }
          } else {
            throw new Error("Unsupported spec");
          }
        }
      } else if (event.name == events.messageQueue.processed.name) {
        let rec: {
          id: Bytes;
          origin: AggregateMessageOrigin;
          success?: boolean;
          error?: ProcessMessageError;
        };
        if (events.messageQueue.processed.v1002000.is(event)) {
          rec = events.messageQueue.processed.v1002000.decode(event);
        } else {
          throw new Error("Unsupported spec");
        }
        // Filter message from non system parachain
        if (
          rec.origin.__kind == "Sibling" &&
          rec.origin.value == BridgeHubParaId
        ) {
          processedMessage = new MessageProcessedOnPolkadot({
            id: event.id,
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            messageId: rec.id.toString().toLowerCase(),
            paraId: AssetHubParaId,
            success: rec.success,
          });
        }
      }
    }

    if (processedMessage!) {
      processedMessages.push(processedMessage);
    }
    if (foreignAssetIssued && processedMessage!) {
      let transfer = await ctx.store.findOneBy(TransferStatusToPolkadot, {
        id: processedMessage.messageId,
      });
      if (transfer!) {
        if (transfer.destinationParaId == AssetHubParaId) {
          // Terminated on AH
          transfer.destinationBlockNumber = block.header.height;
          transfer.status = TransferStatusEnum.Processed;
        } else {
          // Forward to 3rd Parachain
          transfer.forwardedBlockNumber = block.header.height;
          if (
            transfer.status == TransferStatusEnum.Sent ||
            transfer.status == TransferStatusEnum.Bridged
          ) {
            transfer.status = TransferStatusEnum.Forwarded;
          }
        }
        transfersToPolkadot.push(transfer);
      }
    }
  }

  if (processedMessages.length > 0) {
    ctx.log.debug("saving messageQueue processed messages");
    await ctx.store.save(processedMessages);
  }
  if (transfersToPolkadot.length > 0) {
    ctx.log.debug("saving transfer messages from ethereum to polkadot");
    await ctx.store.save(transfersToPolkadot);
  }
}
