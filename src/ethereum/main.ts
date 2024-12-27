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
import { Context } from "./processor";

processor.run(
  new TypeormDatabase({ supportHotBlocks: true, stateSchema: "eth_processor" }),
  async (ctx) => {
    await processInboundEvents(ctx);
    await processOutboundEvents(ctx);
  }
);

async function processOutboundEvents(ctx: Context) {
  let outboundMessages: OutboundMessageAcceptedOnEthereum[] = [],
    transfersToPolkadot: TransferStatusToPolkadot[] = [];
  for (let c of ctx.blocks) {
    let tokenSent: TokenSentOnEthereum;
    let outboundMessageAccepted: OutboundMessageAcceptedOnEthereum;
    for (let log of c.logs) {
      if (
        log.address == GATEWAY_ADDRESS &&
        (log.topics[0] == gateway.events.TokenSent.topic ||
          log.topics[0] == gateway.events.OutboundMessageAccepted.topic)
      ) {
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
        }
      }
    }
    // Merge OutboundMessageAccepted event with TokenSent event to generate the TransferStatusToPolkadot
    if (
      outboundMessageAccepted! &&
      tokenSent! &&
      tokenSent.txHash == outboundMessageAccepted.txHash
    ) {
      outboundMessages.push(outboundMessageAccepted);
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
  if (outboundMessages.length > 0) {
    await ctx.store.save(outboundMessages);
  }
  if (transfersToPolkadot.length > 0) {
    await ctx.store.save(transfersToPolkadot);
  }
}

async function processInboundEvents(ctx: Context) {
  let inboundMessages: InboundMessageDispatchedOnEthereum[] = [],
    transfersToEthereum: TransferStatusToEthereum[] = [];
  for (let c of ctx.blocks) {
    let inboundMessage: InboundMessageDispatchedOnEthereum;
    let transferToEthreum: TransferStatusToEthereum | undefined;
    for (let log of c.logs) {
      if (
        log.address == GATEWAY_ADDRESS &&
        log.topics[0] == gateway.events.InboundMessageDispatched.topic
      ) {
        if (log.topics[0] == gateway.events.InboundMessageDispatched.topic) {
          let { channelID, messageID, nonce, success } =
            gateway.events.InboundMessageDispatched.decode(log);
          inboundMessage = new InboundMessageDispatchedOnEthereum({
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

          transferToEthreum = await ctx.store.findOneBy(
            TransferStatusToEthereum,
            {
              id: inboundMessage.messageId,
            }
          );
          if (transferToEthreum!) {
            transferToEthreum.channelId = inboundMessage.channelId;
            transferToEthreum.destinationBlockNumber = c.header.height;
            if (inboundMessage.success) {
              transferToEthreum.status = TransferStatusEnum.Processed;
            } else {
              transferToEthreum.status = TransferStatusEnum.ProcessFailed;
            }
            transfersToEthereum.push(transferToEthreum);
          }
        }
      }
    }
  }
  if (inboundMessages.length > 0) {
    await ctx.store.save(inboundMessages);
  }
  if (transfersToEthereum.length > 0) {
    await ctx.store.save(transfersToEthereum);
  }
}
