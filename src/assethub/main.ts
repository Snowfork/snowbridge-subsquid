import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { processor, ProcessorContext } from "./processor";
import { MessageProcessed } from "../model";
import { events } from "./types";
import { Bytes } from "./types/support";
import { AggregateMessageOrigin } from "./types/v1002000";

processor.run(
  new TypeormDatabase({
    supportHotBlocks: true,
    stateSchema: "assethub_processor",
  }),
  async (ctx) => {
    let messages: MessageProcessed[] = fetchBridgeEvents(ctx);

    console.log("saving xcmp messages");
    await ctx.store.save(messages);
  }
);

function fetchBridgeEvents(ctx: ProcessorContext<Store>): MessageProcessed[] {
  // Filters and decodes the arriving events
  let messages: MessageProcessed[] = [];
  for (let block of ctx.blocks) {
    for (let event of block.events) {
      if (event.name == events.messageQueue.processed.name) {
        let rec: {
          id: Bytes;
          origin: AggregateMessageOrigin;
          success: boolean;
        };
        if (events.messageQueue.processed.v1002000.is(event)) {
          rec = events.messageQueue.processed.v1002000.decode(event);
        } else {
          throw new Error("Unsupported spec");
        }
        // Filter message from BH
        if (rec.origin.__kind == "Sibling" && rec.origin.value == 1002) {
          messages.push(
            new MessageProcessed({
              id: rec.id,
              blockNumber: block.header.height,
              timestamp: new Date(block.header.timestamp!),
              messageId: rec.id.toString(),
              success: rec.success,
            })
          );
        }
      }
    }
  }
  return messages;
}
