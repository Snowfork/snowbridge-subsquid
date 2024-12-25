import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { processor, ProcessorContext } from "./processor";
import {
  MessageProcessedOnPolkadot,
  TransferStatusToPolkadot,
  TokenSentOnPolkadot,
  TransferStatusToEthereum,
} from "../model";
import { events } from "./types";
import { Bytes } from "./types/support";
import {
  AggregateMessageOrigin,
  V4Instruction,
  V4Location,
  ProcessMessageError,
} from "./types/v1002000";
import { TransferStatusEnum, BridgeHubParaId, AssetHubParaId } from "../common";

processor.run(
  new TypeormDatabase({
    supportHotBlocks: true,
    stateSchema: "assethub_processor",
  }),
  async (ctx) => {
    await processInboundEvents(ctx);
    await processOutboundEvents(ctx);
  }
);

async function processInboundEvents(ctx: ProcessorContext<Store>) {
  let processedMessages: MessageProcessedOnPolkadot[] = [],
    transfersFromEthereum: TransferStatusToPolkadot[] = [];
  for (let block of ctx.blocks) {
    for (let event of block.events) {
      if (
        event.name == events.messageQueue.processed.name ||
        event.name == events.messageQueue.processingFailed.name
      ) {
        let rec: {
          id: Bytes;
          origin: AggregateMessageOrigin;
          success?: boolean;
          error?: ProcessMessageError;
        };
        if (events.messageQueue.processed.v1002000.is(event)) {
          rec = events.messageQueue.processed.v1002000.decode(event);
        } else if (events.messageQueue.processingFailed.v1002000.is(event)) {
          rec = events.messageQueue.processingFailed.v1002000.decode(event);
        } else {
          throw new Error("Unsupported spec");
        }
        // Filter message from BH
        if (
          rec.origin.__kind == "Sibling" &&
          rec.origin.value == BridgeHubParaId
        ) {
          let message = new MessageProcessedOnPolkadot({
            id: event.id,
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            messageId: rec.id.toString().toLowerCase(),
            success: rec.success,
          });
          processedMessages.push(message);
          let transfer = await ctx.store.findOneBy(TransferStatusToPolkadot, {
            id: message.messageId,
          });
          if (transfer!) {
            if (rec.success) {
              transfer.status = TransferStatusEnum.Processed;
            } else {
              transfer.status = TransferStatusEnum.ProcessFailed;
            }
            transfersFromEthereum.push(transfer);
          }
        }
      }
    }
  }
  if (processedMessages.length > 0) {
    ctx.log.debug("saving transfer messages from bridge hub");
    await ctx.store.save(processedMessages);
  }
  if (transfersFromEthereum.length > 0) {
    ctx.log.debug("saving transfer messages from ethereum");
    await ctx.store.save(transfersFromEthereum);
  }
}

async function processOutboundEvents(ctx: ProcessorContext<Store>) {
  let tokenSentMessages: TokenSentOnPolkadot[] = [],
    transfersToEthereum: TransferStatusToEthereum[] = [];
  for (let block of ctx.blocks) {
    for (let event of block.events) {
      if (event.name == events.polkadotXcm.sent.name) {
        let rec: {
          origin: V4Location;
          destination: V4Location;
          messageId: Bytes;
          message: V4Instruction[];
        };
        if (events.polkadotXcm.sent.v1002000.is(event)) {
          rec = events.polkadotXcm.sent.v1002000.decode(event);
        } else {
          throw new Error("Unsupported spec");
        }
        if (
          rec.destination.parents == 2 &&
          rec.destination.interior.__kind == "X1" &&
          rec.destination.interior.value[0].__kind == "GlobalConsensus" &&
          rec.destination.interior.value[0].value.__kind == "Ethereum"
        ) {
          let amount: bigint;
          let senderAddress: Bytes;
          let tokenAddress: Bytes;
          let destinationAddress: Bytes;

          let messageId = rec.messageId.toString().toLowerCase();

          let instruction0 = rec.message[0];
          if (rec.origin.interior.__kind == "X1") {
            let val = rec.origin.interior.value[0];
            if (val.__kind == "AccountId32") {
              senderAddress = val.id;
            }
          }
          if (instruction0.__kind == "WithdrawAsset") {
            let asset = instruction0.value[0];
            if (asset.fun.__kind == "Fungible") {
              amount = asset.fun.value;
              if (asset.id.interior.__kind == "X1") {
                let val = asset.id.interior.value[0];
                if (val.__kind == "AccountKey20") {
                  tokenAddress = val.key;
                }
              }
            }
          }

          let instruction3 = rec.message[3];
          if (instruction3.__kind == "DepositAsset") {
            let beneficiary = instruction3.beneficiary;
            if (beneficiary.interior.__kind == "X1") {
              let val = beneficiary.interior.value[0];
              if (val.__kind == "AccountKey20") {
                destinationAddress = val.key;
              }
            }
          }

          let tokenSentMessage = new TokenSentOnPolkadot({
            id: event.id,
            txHash: event.extrinsic?.hash,
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            messageId: messageId,
            tokenAddress: tokenAddress!,
            sourceParaId: AssetHubParaId,
            senderAddress: senderAddress!,
            destinationAddress: destinationAddress!,
            amount: amount!,
          });
          tokenSentMessages.push(tokenSentMessage);

          let message = new TransferStatusToEthereum({
            id: messageId,
            txHash: event.extrinsic?.hash,
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            messageId: messageId,
            tokenAddress: tokenAddress!,
            sourceParaId: AssetHubParaId,
            senderAddress: senderAddress!,
            destinationAddress: destinationAddress!,
            amount: amount!,
            status: TransferStatusEnum.Sent,
          });
          transfersToEthereum.push(message);
        }
      }
    }
  }

  if (tokenSentMessages.length > 0) {
    ctx.log.debug("saving token sent messages to ethereum");
    await ctx.store.save(tokenSentMessages);
  }

  if (transfersToEthereum.length > 0) {
    ctx.log.debug("saving transfer messages to ethereum");
    await ctx.store.save(transfersToEthereum);
  }
}
