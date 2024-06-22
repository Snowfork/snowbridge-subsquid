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
    await processBridgeEvents(ctx);
  }
);

async function processBridgeEvents(ctx: ProcessorContext<Store>) {
  let inboundMessages: InboundMessageReceivedOnBridgeHub[] = [],
    outboundMessages: OutboundMessageAcceptedOnBridgeHub[] = [],
    transfersToPolkadot: TransferStatusToPolkadot[] = [],
    transfersToEthereum: TransferStatusToEthereum[] = [];
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
          transfer.channelId = transfer.status =
            TransferStatusEnum.InboundQueueReceived;
          transfersToPolkadot.push(transfer);
        }
      }

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
          // Todo: Wait for https://github.com/Snowfork/polkadot-sdk/pull/147 and re-index
          channelId: rec.channelId,
        });
        outboundMessages.push(message);

        let transfer = await ctx.store.findOneBy(TransferStatusToEthereum, {
          id: message.messageId,
        });
        if (transfer!) {
          transfer.channelId = rec.channelId;
          transfer.nonce = Number(rec.nonce);
          transfer.status = TransferStatusEnum.OutboundQueueReceived;
          transfersToEthereum.push(transfer);
        }
      }
    }
  }
  if (inboundMessages.length > 0) {
    ctx.log.debug("saving inbound messages");
    await ctx.store.save(inboundMessages);
  }

  if (outboundMessages.length > 0) {
    ctx.log.debug("saving outbound messages");
    await ctx.store.save(outboundMessages);
  }

  if (transfersToPolkadot.length > 0) {
    ctx.log.debug("updating transfer messages");
    await ctx.store.save(transfersToPolkadot);
  }

  if (transfersToEthereum.length > 0) {
    ctx.log.debug("updating transfer messages");
    await ctx.store.save(transfersToEthereum);
  }
}
