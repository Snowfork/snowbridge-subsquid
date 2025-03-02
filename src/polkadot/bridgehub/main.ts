import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { processor, ProcessorContext } from "./processor";
import {
  InboundMessageReceivedOnBridgeHub,
  MessageProcessedOnPolkadot,
  OutboundMessageAcceptedOnBridgeHub,
  TransferStatusToEthereum,
  TransferStatusToPolkadot,
} from "../../model";
import { events } from "./types";
import { Bytes } from "./types/support";
import {
  AssetHubParaId,
  BridgeHubParaId,
  toSubscanEventID,
} from "../../common";
import { AggregateMessageOrigin, ProcessMessageError } from "./types/v1002000";
import { ProcessMessageError as ProcessMessageErrorV1003000 } from "./types/v1003000";

processor.run(
  new TypeormDatabase({
    supportHotBlocks: true,
    stateSchema: "bridgehub_processor",
  }),
  async (ctx) => {
    await processInboundEvents(ctx);
    await processOutboundEvents(ctx);
  }
);

async function processInboundEvents(ctx: ProcessorContext<Store>) {
  let inboundMessages: InboundMessageReceivedOnBridgeHub[] = [],
    transfersToPolkadot: TransferStatusToPolkadot[] = [];
  for (let block of ctx.blocks) {
    for (let event of block.events) {
      if (event.name == events.ethereumInboundQueue.messageReceived.name) {
        let rec: { messageId: Bytes; channelId: Bytes; nonce: bigint };
        if (events.ethereumInboundQueue.messageReceived.v1002000.is(event)) {
          rec =
            events.ethereumInboundQueue.messageReceived.v1002000.decode(event);
        } else {
          throw Object.assign(new Error("Unsupported spec"), event);
        }
        let message = new InboundMessageReceivedOnBridgeHub({
          id: event.id,
          blockNumber: block.header.height,
          timestamp: new Date(block.header.timestamp!),
          messageId: rec.messageId.toString().toLowerCase(),
          channelId: rec.channelId.toString(),
          nonce: Number(rec.nonce),
          eventId: toSubscanEventID(event.id),
          txHash: event.extrinsic?.hash,
        });
        inboundMessages.push(message);
        let transfer = await ctx.store.findOneBy(TransferStatusToPolkadot, {
          id: message.messageId,
        });
        if (transfer!) {
          transfer.channelId = message.channelId;
          transfer.nonce = message.nonce;
          transfer.toBridgeHubInboundQueue = message;
          transfersToPolkadot.push(transfer);
        }
      }
    }
  }
  if (inboundMessages.length > 0) {
    ctx.log.debug("saving inbound messages");
    await ctx.store.save(inboundMessages);
  }

  if (transfersToPolkadot.length > 0) {
    ctx.log.debug("updating transfer messages");
    await ctx.store.save(transfersToPolkadot);
  }
}

async function processOutboundEvents(ctx: ProcessorContext<Store>) {
  let outboundMessages: OutboundMessageAcceptedOnBridgeHub[] = [],
    processedMessages: MessageProcessedOnPolkadot[] = [],
    transfersToEthereum: TransferStatusToEthereum[] = [];
  for (let block of ctx.blocks) {
    for (let event of block.events) {
      if (event.name == events.ethereumOutboundQueue.messageAccepted.name) {
        let rec: { id: Bytes; nonce: bigint; channelId?: Bytes };
        if (events.ethereumOutboundQueue.messageAccepted.v1002000.is(event)) {
          rec =
            events.ethereumOutboundQueue.messageAccepted.v1002000.decode(event);
        } else {
          throw Object.assign(new Error("Unsupported spec"), event);
        }
        let message = new OutboundMessageAcceptedOnBridgeHub({
          id: event.id,
          blockNumber: block.header.height,
          timestamp: new Date(block.header.timestamp!),
          messageId: rec.id.toString().toLowerCase(),
          nonce: Number(rec.nonce),
          channelId: rec.channelId,
          eventId: toSubscanEventID(event.id),
        });
        outboundMessages.push(message);

        let transfer = await ctx.store.findOneBy(TransferStatusToEthereum, {
          id: message.messageId,
        });
        if (transfer!) {
          transfer.channelId = rec.channelId;
          transfer.nonce = Number(rec.nonce);
          transfer.toBridgeHubOutboundQueue = message;
          transfersToEthereum.push(transfer);
        }
      }
      if (
        event.name == events.messageQueue.processed.name ||
        event.name == events.messageQueue.processingFailed.name
      ) {
        let rec: {
          id: Bytes;
          origin: AggregateMessageOrigin;
          success?: boolean;
          error?: ProcessMessageError | ProcessMessageErrorV1003000;
        };
        if (events.messageQueue.processed.v1002000.is(event)) {
          rec = events.messageQueue.processed.v1002000.decode(event);
        } else if (events.messageQueue.processingFailed.v1002000.is(event)) {
          rec = events.messageQueue.processingFailed.v1002000.decode(event);
        } else if (events.messageQueue.processingFailed.v1003000.is(event)) {
          rec = events.messageQueue.processingFailed.v1003000.decode(event);
        } else {
          throw Object.assign(new Error("Unsupported spec"), event);
        }
        // Filter message from AH
        if (
          rec.origin.__kind == "Sibling" &&
          rec.origin.value == AssetHubParaId
        ) {
          let processedMessage = new MessageProcessedOnPolkadot({
            id: event.id,
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            messageId: rec.id.toString().toLowerCase(),
            paraId: BridgeHubParaId,
            success: rec.success,
            eventId: toSubscanEventID(event.id),
          });
          processedMessages.push(processedMessage);
        }
      }
    }
  }

  if (outboundMessages.length > 0) {
    ctx.log.debug("saving outbound messages");
    await ctx.store.save(outboundMessages);
  }

  if (processedMessages.length > 0) {
    ctx.log.debug("saving messageQueue processed messages");
    await ctx.store.save(processedMessages);
  }

  if (transfersToEthereum.length > 0) {
    ctx.log.debug("updating transfer messages");
    await ctx.store.save(transfersToEthereum);
  }
}
