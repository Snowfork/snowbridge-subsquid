import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { processor, ProcessorContext } from "./processor";
import { InboundMessage, OutboundMessage, TransferStatus } from "../model";
import { events } from "./types";
import { Bytes } from "./types/support";
import { TransferStatusE2S } from "../common";

export type Messages = {
  inboundMessages: InboundMessage[];
  outboundMessages: OutboundMessage[];
  transfers: TransferStatus[];
};

processor.run(
  new TypeormDatabase({
    supportHotBlocks: true,
    stateSchema: "bridgehub_processor",
  }),
  async (ctx) => {
    let messages: Messages = await fetchBridgeEvents(ctx);

    if (messages.inboundMessages.length > 0) {
      ctx.log.debug("saving inbound messages");
      await ctx.store.save(messages.inboundMessages);
    }

    if (messages.outboundMessages.length > 0) {
      ctx.log.debug("saving outbound messages");
      await ctx.store.save(messages.outboundMessages);
    }

    if (messages.transfers.length > 0) {
      ctx.log.debug("updating transfer messages");
      await ctx.store.save(messages.transfers);
    }
  }
);

async function fetchBridgeEvents(
  ctx: ProcessorContext<Store>
): Promise<Messages> {
  // Filters and decodes the arriving events
  let inboundMessages: InboundMessage[] = [],
    outboundMessages: OutboundMessage[] = [],
    transfers: TransferStatus[] = [];
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
        let message = new InboundMessage({
          id: event.id,
          blockNumber: block.header.height,
          timestamp: new Date(block.header.timestamp!),
          messageId: rec.messageId.toString().toLowerCase(),
          channelId: rec.channelId.toString(),
          nonce: Number(rec.nonce),
        });

        inboundMessages.push(message);
        let transfer = await ctx.store.findOneBy(TransferStatus, {
          id: message.messageId,
        });
        if (transfer!) {
          transfer.status = TransferStatusE2S.InboundQueueReceived;
          transfers.push(transfer);
        }
      }

      if (event.name == events.ethereumOutboundQueue.messageAccepted.name) {
        let rec: { id: Bytes; nonce: bigint };
        if (events.ethereumOutboundQueue.messageAccepted.v1002000.is(event)) {
          rec =
            events.ethereumOutboundQueue.messageAccepted.v1002000.decode(event);
        } else {
          throw new Error("Unsupported spec");
        }

        outboundMessages.push(
          new OutboundMessage({
            id: event.id,
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            messageId: rec.id.toString().toLowerCase(),
            // Wait for https://github.com/Snowfork/polkadot-sdk/pull/147
            // channelId: rec.channelId.toString(),
            nonce: Number(rec.nonce),
          })
        );
      }
    }
  }
  return { inboundMessages, outboundMessages, transfers };
}
