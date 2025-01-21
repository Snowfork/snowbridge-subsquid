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
} from "./types/v1002000";
import {
  TransferStatusEnum,
  BridgeHubParaId,
  AssetHubParaId,
  toSubscanEventID,
} from "../common";

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
    let xcmpMessageSent = false;
    let messageForwarded: MessageProcessedOnPolkadot;
    let transferToEthereum: TransferStatusToEthereum;
    for (let event of block.events) {
      if (event.name == events.xcmpQueue.xcmpMessageSent.name) {
        xcmpMessageSent = true;
      } else if (
        event.name == events.messageQueue.processed.name ||
        event.name == events.messageQueue.processingFailed.name
      ) {
        let rec: {
          id: Bytes;
          origin: AggregateMessageOrigin;
          success?: boolean;
          error?: ProcessMessageError;
        };
        if (events.messageQueue.processed.v1002000.is(event)) {
          rec = events.messageQueue.processed.v1002000.decode(event);
        } else if (events.messageQueue.processingFailed.v1002000.is(event)) {
          rec = events.messageQueue.processingFailed.v1002000.decode(event);
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
            eventId: toSubscanEventID(event.id),
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
          let amount: bigint = BigInt(0);
          let senderAddress: Bytes = "";
          let tokenAddress: Bytes = "";
          let tokenLocation: Bytes = "";
          let destinationAddress: Bytes = "";

          let messageId = rec.messageId.toString().toLowerCase();
          if (rec.origin.interior.__kind == "X1") {
            let val = rec.origin.interior.value[0];
            if (val.__kind == "AccountId32") {
              senderAddress = val.id;
            }
          }

          let instruction0 = rec.message[0];
          // WithdrawAsset for ENA and ReserveAssetDeposited for PNA
          if (
            instruction0.__kind == "WithdrawAsset" ||
            instruction0.__kind == "ReserveAssetDeposited"
          ) {
            let asset = instruction0.value[0];
            tokenLocation = JSON.stringify(asset.id, (key, value) =>
              typeof value === "bigint" ? value.toString() : value
            );
            if (asset.fun.__kind == "Fungible") {
              amount = asset.fun.value;
              // For ENA extract the token address
              if (
                instruction0.__kind == "WithdrawAsset" &&
                asset.id.interior.__kind == "X1"
              ) {
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
            tokenAddress,
            tokenLocation,
            sourceParaId: AssetHubParaId,
            senderAddress,
            destinationAddress,
            amount,
            status: TransferStatusEnum.Pending,
          });
        }
      }
    }
    if (messageForwarded!) {
      forwardMessages.push(messageForwarded);
    }
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
    if (xcmpMessageSent && messageForwarded!) {
      let transfer = await ctx.store.findOneBy(TransferStatusToEthereum, {
        id: messageForwarded.messageId,
      });
      if (transfer!) {
        transfer.toAssetHubMessageQueue = messageForwarded;
        if (!messageForwarded.success) {
          transfer.status = TransferStatusEnum.Failed;
        }
        transfersToEthereum.push(transfer);
      }
    }
  }

  if (forwardMessages.length > 0) {
    ctx.log.debug("saving forward messages to ethereum");
    await ctx.store.save(forwardMessages);
  }

  if (transfersToEthereum.length > 0) {
    ctx.log.debug("saving transfer messages to ethereum");
    await ctx.store.save(transfersToEthereum);
  }
}

async function processInboundEvents(ctx: ProcessorContext<Store>) {
  let transfersToPolkadot: TransferStatusToPolkadot[] = [],
    processedMessages: MessageProcessedOnPolkadot[] = [];
  for (let block of ctx.blocks) {
    let processedMessage: MessageProcessedOnPolkadot;
    for (let event of block.events) {
      if (
        event.name == events.messageQueue.processed.name ||
        event.name == events.messageQueue.processingFailed.name
      ) {
        let rec: {
          id: Bytes;
          origin: AggregateMessageOrigin;
          success?: boolean;
          error?: ProcessMessageError;
        };
        if (events.messageQueue.processed.v1002000.is(event)) {
          rec = events.messageQueue.processed.v1002000.decode(event);
        } else if (events.messageQueue.processingFailed.v1002000.is(event)) {
          rec = events.messageQueue.processingFailed.v1002000.decode(event);
        } else {
          throw new Error("Unsupported spec");
        }
        // Filter message from BH
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
            eventId: toSubscanEventID(event.id),
          });
        }
      }
    }

    if (processedMessage!) {
      processedMessages.push(processedMessage);
      let transfer = await ctx.store.findOneBy(TransferStatusToPolkadot, {
        id: processedMessage.messageId,
      });
      if (transfer!) {
        if (!processedMessage.success) {
          transfer.status = TransferStatusEnum.Failed;
        } else {
          transfer.status = TransferStatusEnum.Complete;
          if (transfer.destinationParaId == AssetHubParaId) {
            // Terminated on AH
            transfer.toDestination = processedMessage;
          } else {
            // Forward to 3rd Parachain
            transfer.toAssetHubMessageQueue = processedMessage;
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
