import { TypeormDatabase } from "@subsquid/typeorm-store";
import {
  OutboundMessageAcceptedOnEthereum,
  TokenSentOnEthereum,
  TransferStatusToPolkadot,
  InboundMessageDispatchedOnEthereum,
  TransferStatusToEthereum,
} from "../model";
import * as gateway from "./abi/Gateway";
import { processor, GATEWAY_ADDRESS } from "./processor";
import { TransferStatusEnum } from "../common";

processor.run(
  new TypeormDatabase({ supportHotBlocks: true, stateSchema: "eth_processor" }),
  async (ctx) => {
    let tokenSents: TokenSentOnEthereum[] = [],
      outboundMessages: OutboundMessageAcceptedOnEthereum[] = [],
      transfersToPolkadot: TransferStatusToPolkadot[] = [],
      inboundMessages: InboundMessageDispatchedOnEthereum[] = [],
      transfersToEthereum: TransferStatusToEthereum[] = [];
    for (let c of ctx.blocks) {
      let tokenSent: TokenSentOnEthereum;
      let outboundMessageAccepted: OutboundMessageAcceptedOnEthereum;
      for (let log of c.logs) {
        if (
          log.address !== GATEWAY_ADDRESS ||
          (log.topics[0] !== gateway.events.TokenSent.topic &&
            log.topics[0] !== gateway.events.OutboundMessageAccepted.topic &&
            log.topics[0] !== gateway.events.InboundMessageDispatched.topic)
        )
          continue;
        if (log.topics[0] == gateway.events.TokenSent.topic) {
          let { token, sender, destinationChain, destinationAddress, amount } =
            gateway.events.TokenSent.decode(log);
          tokenSent = new TokenSentOnEthereum({
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
          outboundMessageAccepted = new OutboundMessageAcceptedOnEthereum({
            id: log.id,
            blockNumber: c.header.height,
            txHash: log.transactionHash,
            timestamp: new Date(c.header.timestamp),
            channelId: channelID,
            messageId: messageID.toString().toLowerCase(),
            nonce: Number(nonce),
          });
          outboundMessages.push(outboundMessageAccepted);
        } else if (
          log.topics[0] == gateway.events.InboundMessageDispatched.topic
        ) {
          let { channelID, messageID, nonce, success } =
            gateway.events.InboundMessageDispatched.decode(log);
          let inboundMessage = new InboundMessageDispatchedOnEthereum({
            id: log.id,
            blockNumber: c.header.height,
            txHash: log.transactionHash,
            timestamp: new Date(c.header.timestamp),
            channelId: channelID,
            messageId: messageID.toString().toLowerCase(),
            nonce: Number(nonce),
            success: success,
          });
          inboundMessages.push(inboundMessage);

          let transfer = await ctx.store.findOneBy(TransferStatusToEthereum, {
            id: inboundMessage.messageId,
          });
          if (transfer!) {
            transfer.channelId = inboundMessage.channelId;
            if (inboundMessage.success) {
              transfer.status = TransferStatusEnum.Processed;
            } else {
              transfer.status = TransferStatusEnum.ProcessFailed;
            }
            transfersToEthereum.push(transfer);
          }
        }
      }
      // Merge OutboundMessageAccepted event with TokenSent event to generate the TransferStatusToPolkadot
      if (
        outboundMessageAccepted! &&
        tokenSent! &&
        tokenSent.txHash == outboundMessageAccepted.txHash
      ) {
        transfersToPolkadot.push(
          new TransferStatusToPolkadot({
            id: outboundMessageAccepted.messageId,
            messageId: outboundMessageAccepted.messageId,
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
            status: TransferStatusEnum.Sent,
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
    if (transfersToPolkadot.length > 0) {
      await ctx.store.save(transfersToPolkadot);
    }
    if (inboundMessages.length > 0) {
      await ctx.store.save(inboundMessages);
    }
    if (transfersToEthereum.length > 0) {
      await ctx.store.save(transfersToEthereum);
    }
  }
);
