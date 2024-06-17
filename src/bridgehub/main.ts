import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { processor, ProcessorContext } from "./processor";
import { InboundMessage, OutboundMessage } from "../model";
import { events } from "./types";
import { Bytes } from "./types/support";
import assert from "assert";

export type Messages = {
  inboundMessages: InboundMessage[];
  outboundMessages: OutboundMessage[];
};

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
  let messages: Messages = fetchBridgeEvents(ctx);

  console.log("saving inbound messages")
  await ctx.store.save(messages.inboundMessages);

  console.log("saving outbound messages")
  await ctx.store.save(messages.outboundMessages);

});

function fetchBridgeEvents(ctx: ProcessorContext<Store>): Messages {
  // Filters and decodes the arriving events
  let inboundMessages: InboundMessage[] = [],
    outboundMessages: OutboundMessage[] = [];
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

        inboundMessages.push(
          new InboundMessage({
            id: event.id,
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            messageId: rec.messageId.toString(),
            channelId: rec.channelId.toString(),
            nonce: Number(rec.nonce),
          })
        );
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
            messageId: rec.id.toString(),
            // Wait for https://github.com/Snowfork/polkadot-sdk/pull/147
            // channelId: rec.channelId.toString(),
            nonce: Number(rec.nonce),
          })
        );
      }
    }
  }
  return { inboundMessages, outboundMessages };
}
