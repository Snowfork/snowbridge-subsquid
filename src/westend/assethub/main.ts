import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { processor, ProcessorContext } from "./processor";
import {
  MessageProcessedOnPolkadot,
  TransferStatusToPolkadot,
  TransferStatusToEthereum,
} from "../../model";
import { events } from "./types";
import { Bytes } from "./types/support";
import { AggregateMessageOrigin, ProcessMessageError } from "./types/v1004000";
import { V4Instruction } from "./types/v1007000";
import {
  AggregateMessageOrigin as AggregateMessageOriginV1013000,
  ProcessMessageError as ProcessMessageErrorV1013000,
} from "./types/v1013000";
import { V4Location } from "./types/v1016000";
import {
  V4Location as V4LocationV1016005,
  V5Location,
  V5Instruction,
} from "./types/v1016005";
import {
  V5Location as V5LocationV1016006,
  V5Instruction as V5InstructionV1016006,
} from "./types/v1016006";
import {
  V5Location as V5LocationV1017003,
  V5Instruction as V5InstructionV1017003,
} from "./types/v1017003";
import {
  TransferStatusEnum,
  BridgeHubParaId,
  AssetHubParaId,
  toSubscanEventID,
} from "../../common";

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
          origin: AggregateMessageOrigin | AggregateMessageOriginV1013000;
          success?: boolean;
          error?: ProcessMessageError | ProcessMessageErrorV1013000;
        };
        if (events.messageQueue.processed.v1004000.is(event)) {
          rec = events.messageQueue.processed.v1004000.decode(event);
        } else if (events.messageQueue.processingFailed.v1004000.is(event)) {
          rec = events.messageQueue.processingFailed.v1004000.decode(event);
        } else if (events.messageQueue.processingFailed.v1013000.is(event)) {
          rec = events.messageQueue.processingFailed.v1013000.decode(event);
        } else {
          throw Object.assign(new Error("Unsupported spec"), event);
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
          origin:
            | V4Location
            | V4LocationV1016005
            | V5Location
            | V5LocationV1016006
            | V5LocationV1017003;
          destination:
            | V4Location
            | V4LocationV1016005
            | V5Location
            | V5LocationV1016006
            | V5LocationV1017003;
          messageId: Bytes;
          message:
            | V4Instruction[]
            | V5Instruction[]
            | V5InstructionV1016006[]
            | V5InstructionV1017003[];
        };
        if (events.polkadotXcm.sent.v1007000.is(event)) {
          rec = events.polkadotXcm.sent.v1007000.decode(event);
        } else if (events.polkadotXcm.sent.v1016005.is(event)) {
          rec = events.polkadotXcm.sent.v1016005.decode(event);
        } else if (events.polkadotXcm.sent.v1016006.is(event)) {
          rec = events.polkadotXcm.sent.v1016006.decode(event);
        } else if (events.polkadotXcm.sent.v1017003.is(event)) {
          rec = events.polkadotXcm.sent.v1017003.decode(event);
        } else {
          throw Object.assign(new Error("Unsupported spec"), event);
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
          origin: AggregateMessageOrigin | AggregateMessageOriginV1013000;
          success?: boolean;
          error?: ProcessMessageError | ProcessMessageErrorV1013000;
        };
        if (events.messageQueue.processed.v1004000.is(event)) {
          rec = events.messageQueue.processed.v1004000.decode(event);
        } else if (events.messageQueue.processingFailed.v1004000.is(event)) {
          rec = events.messageQueue.processingFailed.v1004000.decode(event);
        } else if (events.messageQueue.processingFailed.v1013000.is(event)) {
          rec = events.messageQueue.processingFailed.v1013000.decode(event);
        } else {
          throw Object.assign(new Error("Unsupported spec"), event);
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
            transfer.toAssetHubMessageQueue = processedMessage;
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
