import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { processor, ProcessorContext } from "./processor";
import { MessageProcessed, TransferStatus } from "../model";
import { events } from "./types";
import { Bytes } from "./types/support";
import { AggregateMessageOrigin } from "./types/v1002000";
import { TransferStatusE2S } from "../common";

export type Messages = {
  processed: MessageProcessed[];
  transfers: TransferStatus[];
};

processor.run(
  new TypeormDatabase({
    supportHotBlocks: true,
    stateSchema: "assethub_processor",
  }),
  async (ctx) => {
    let messages: Messages = await fetchBridgeEvents(ctx);

    if (messages.processed.length > 0) {
      ctx.log.debug("saving sibling messages from bridge hub");
      await ctx.store.save(messages.processed);
    }

    if (messages.transfers.length > 0) {
      ctx.log.debug("saving transfer messages from bridge hub");
      await ctx.store.save(messages.transfers);
    }
  }
);

async function fetchBridgeEvents(
  ctx: ProcessorContext<Store>
): Promise<Messages> {
  // Filters and decodes the arriving events
  let processed: MessageProcessed[] = [],
    transfers: TransferStatus[] = [];
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
          let message = new MessageProcessed({
            id: event.id,
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            messageId: rec.id.toString().toLowerCase(),
            success: rec.success,
          });
          processed.push(message);
          let transfer = await ctx.store.findOneBy(TransferStatus, {
            id: message.messageId,
          });
          if (transfer!) {
            if (rec.success) {
              transfer.status = TransferStatusE2S.Processed;
            } else {
              transfer.status = TransferStatusE2S.ProcessFailed;
            }
            transfers.push(transfer);
          }
        }
      }
    }
  }
  return { processed, transfers };
}
