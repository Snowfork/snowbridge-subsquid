import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { In } from "typeorm";
import * as ss58 from "@subsquid/ss58";
import assert from "assert";

import { processor, ProcessorContext } from "./processor";
import { InboundMessage } from "./model";
import { events } from "./types";
import { Bytes } from "./types/support";

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
  let messages: InboundMessage[] = getTransferEvents(ctx);

  await ctx.store.insert(messages);
});

function getTransferEvents(ctx: ProcessorContext<Store>): InboundMessage[] {
  // Filters and decodes the arriving events
  let messages: InboundMessage[] = [];
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

        assert(
          block.header.timestamp,
          `Got an undefined timestamp at block ${block.header.height}`
        );

        messages.push({
          id: event.id,
          blockNumber: block.header.height,
          timestamp: new Date(block.header.timestamp),
          messageId: Buffer.from(rec.messageId).toString("hex"),
          channelId: Buffer.from(rec.channelId).toString("hex"),
          nonce: Number(rec.nonce),
        });
      }
    }
  }
  return messages;
}
