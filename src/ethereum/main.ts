import { TypeormDatabase } from "@subsquid/typeorm-store";
import { OutboundMessageAccepted, TokenSent } from "../model";
import * as gateway from "./abi/Gateway";
import { processor, GATEWAY_ADDRESS } from "./processor";

processor.run(
  new TypeormDatabase({ supportHotBlocks: true, stateSchema: "eth_processor" }),
  async (ctx) => {
    const transfers: TokenSent[] = [];
    const outboundMessages: OutboundMessageAccepted[] = [];
    for (let c of ctx.blocks) {
      for (let log of c.logs) {
        if (
          log.address !== GATEWAY_ADDRESS ||
          (log.topics[0] !== gateway.events.TokenSent.topic &&
            log.topics[0] !== gateway.events.OutboundMessageAccepted.topic)
        )
          continue;
        if (log.topics[0] == gateway.events.TokenSent.topic) {
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
        } else if (
          log.topics[0] == gateway.events.OutboundMessageAccepted.topic
        ) {
          let { channelID, messageID, nonce } =
            gateway.events.OutboundMessageAccepted.decode(log);
          outboundMessages.push(
            new OutboundMessageAccepted({
              id: log.id,
              blockNumber: c.header.height,
              txHash: log.transactionHash,
              timestamp: new Date(c.header.timestamp),
              channelId: channelID,
              messageId: messageID,
              nonce: Number(nonce),
            })
          );
        }
      }
    }
    await ctx.store.save(transfers);
    await ctx.store.save(outboundMessages);
  }
);
