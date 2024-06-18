import { TypeormDatabase } from "@subsquid/typeorm-store";
import { TokenSent } from "../model";
import * as gateway from "./abi/Gateway";
import { processor, GATEWAY_ADDRESS } from "./processor";

processor.run(
  new TypeormDatabase({ supportHotBlocks: true, stateSchema: "eth_processor" }),
  async (ctx) => {
    const transfers: TokenSent[] = [];
    for (let c of ctx.blocks) {
      for (let log of c.logs) {
        if (
          log.address !== GATEWAY_ADDRESS ||
          log.topics[0] !== gateway.events.TokenSent.topic
        )
          continue;
        let { token, sender, destinationChain, destinationAddress, amount } =
          gateway.events.TokenSent.decode(log);
        transfers.push(
          new TokenSent({
            id: log.id,
            blockNumber: c.header.height,
            txHash: log.transactionHash,
            timestamp: new Date(c.header.timestamp),
            tokenAddress: token,
            senderAddress: sender,
            destinationParaId: destinationChain,
            destinationAddress: destinationAddress.data,
            amount: amount,
          })
        );
      }
    }
    await ctx.store.upsert(transfers);
  }
);
