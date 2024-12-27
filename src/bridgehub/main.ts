import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { processor, ProcessorContext } from "./processor";
import {
  InboundMessageReceivedOnBridgeHub,
  OutboundMessageAcceptedOnBridgeHub,
  TransferStatusToEthereum,
  TransferStatusToPolkadot,
} from "../model";
import { events } from "./types";
import { Bytes } from "./types/support";
import { TransferStatusEnum } from "../common";

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
          throw new Error("Unsupported spec");
        }
        let message = new InboundMessageReceivedOnBridgeHub({
          id: event.id,
          blockNumber: block.header.height,
          timestamp: new Date(block.header.timestamp!),
          messageId: rec.messageId.toString().toLowerCase(),
          channelId: rec.channelId.toString(),
          nonce: Number(rec.nonce),
        });
        inboundMessages.push(message);
        let transfer = await ctx.store.findOneBy(TransferStatusToPolkadot, {
          id: message.messageId,
        });
        if (transfer!) {
          transfer.bridgedBlockNumber = block.header.height;
          if (transfer.status == TransferStatusEnum.Sent) {
            transfer.status = TransferStatusEnum.Bridged;
          }
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
    transfersToEthereum: TransferStatusToEthereum[] = [];
  for (let block of ctx.blocks) {
    for (let event of block.events) {
      if (event.name == events.ethereumOutboundQueue.messageAccepted.name) {
        let rec: { id: Bytes; nonce: bigint; channelId?: Bytes };
        if (events.ethereumOutboundQueue.messageAccepted.v1002000.is(event)) {
          rec =
            events.ethereumOutboundQueue.messageAccepted.v1002000.decode(event);
        } else {
          throw new Error("Unsupported spec");
        }
        let message = new OutboundMessageAcceptedOnBridgeHub({
          id: event.id,
          blockNumber: block.header.height,
          timestamp: new Date(block.header.timestamp!),
          messageId: rec.id.toString().toLowerCase(),
          nonce: Number(rec.nonce),
          channelId: rec.channelId,
        });
        outboundMessages.push(message);

        let transfer = await ctx.store.findOneBy(TransferStatusToEthereum, {
          id: message.messageId,
        });
        if (transfer!) {
          transfer.channelId = rec.channelId;
          transfer.nonce = Number(rec.nonce);
          transfer.bridgedBlockNumber = block.header.height;
          if (
            transfer.status == TransferStatusEnum.Sent ||
            transfer.status == TransferStatusEnum.Forwarded
          ) {
            transfer.status = TransferStatusEnum.Bridged;
          }
          transfersToEthereum.push(transfer);
        }
      }
    }
  }

  if (outboundMessages.length > 0) {
    ctx.log.debug("saving outbound messages");
    await ctx.store.save(outboundMessages);
  }

  if (transfersToEthereum.length > 0) {
    ctx.log.debug("updating transfer messages");
    await ctx.store.save(transfersToEthereum);
  }
}
