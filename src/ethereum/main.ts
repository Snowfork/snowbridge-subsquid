import { TypeormDatabase } from "@subsquid/typeorm-store";
import { OutboundMessageAccepted, TokenSent, TransferStatus } from "../model";
import * as gateway from "./abi/Gateway";
import { processor, GATEWAY_ADDRESS } from "./processor";
import { TransferStatusE2S } from "../common";

processor.run(
  new TypeormDatabase({ supportHotBlocks: true, stateSchema: "eth_processor" }),
  async (ctx) => {
    const tokenSents: TokenSent[] = [];
    const outboundMessages: OutboundMessageAccepted[] = [];
    const transferStatuses: TransferStatus[] = [];
    for (let c of ctx.blocks) {
      let tokenSent: TokenSent;
      let outboundMessageAccepted: OutboundMessageAccepted;
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
          tokenSent = new TokenSent({
            id: log.id,
            blockNumber: c.header.height,
            txHash: log.transactionHash,
            timestamp: new Date(c.header.timestamp),
            tokenAddress: token,
            senderAddress: sender,
            destinationParaId: destinationChain,
            destinationAddress: destinationAddress.data,
            amount: amount,
          });
          tokenSents.push(tokenSent);
        } else if (
          log.topics[0] == gateway.events.OutboundMessageAccepted.topic
        ) {
          let { channelID, messageID, nonce } =
            gateway.events.OutboundMessageAccepted.decode(log);
          outboundMessageAccepted = new OutboundMessageAccepted({
            id: log.id,
            blockNumber: c.header.height,
            txHash: log.transactionHash,
            timestamp: new Date(c.header.timestamp),
            channelId: channelID,
            messageId: messageID,
            nonce: Number(nonce),
          });
          outboundMessages.push(outboundMessageAccepted);
        }
      }
      if (
        outboundMessageAccepted! &&
        tokenSent! &&
        tokenSent.txHash == outboundMessageAccepted.txHash
      ) {
        transferStatuses.push(
          new TransferStatus({
            id: outboundMessageAccepted.messageId,
            txHash: outboundMessageAccepted.txHash,
            blockNumber: c.header.height,
            timestamp: new Date(c.header.timestamp),
            channelId: outboundMessageAccepted.channelId,
            nonce: outboundMessageAccepted.nonce,
            tokenAddress: tokenSent.tokenAddress,
            senderAddress: tokenSent.senderAddress,
            destinationParaId: tokenSent.destinationParaId,
            destinationAddress: tokenSent.destinationAddress,
            amount: tokenSent.amount,
            status: TransferStatusE2S.Sent,
          })
        );
      }
    }
    if (tokenSents.length > 0) {
      await ctx.store.save(tokenSents);
    }
    if (outboundMessages.length > 0) {
      await ctx.store.save(outboundMessages);
    }
    if (transferStatuses.length > 0) {
      await ctx.store.save(transferStatuses);
    }
  }
);
