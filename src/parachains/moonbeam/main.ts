import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { processor, ProcessorContext } from "./processor";
import {
  MessageProcessedOnPolkadot,
  TransferStatusToPolkadot,
  TransferStatusToEthereum,
} from "../../model";
import { events } from "./types";
import { Bytes } from "./types/support";
import {
  V4Instruction,
  V4Location,
  AggregateMessageOrigin,
  ProcessMessageError,
} from "./types/v2901";
import {
  TransferStatusEnum,
  AssetHubParaId,
  MoonBeamParaId,
  EthereumNativeAsset,
} from "../../common";

processor.run(
  new TypeormDatabase({
    supportHotBlocks: true,
    stateSchema: "moonbeam_processor",
  }),
  async (ctx) => {
    await processOutboundEvents(ctx);
    await processInboundEvents(ctx);
  }
);

const isDestinationToAssetHub = (destination: V4Location): boolean => {
  if (
    destination.parents == 1 &&
    destination.interior.__kind == "X1" &&
    destination.interior.value[0].__kind == "Parachain" &&
    destination.interior.value[0].value == AssetHubParaId
  ) {
    return true;
  }
  return false;
};

const matchEthereumNativeAsset = (
  instruction: V4Instruction
): EthereumNativeAsset => {
  let nullAsset = { address: "", amount: BigInt(0) };
  if (instruction.__kind != "WithdrawAsset" || instruction.value.length < 2) {
    return nullAsset;
  }
  let asset = instruction.value[1];
  if (
    asset.fun.__kind == "Fungible" &&
    asset.id.interior.__kind == "X2" &&
    asset.id.interior.value[0].__kind == "GlobalConsensus" &&
    asset.id.interior.value[0].value.__kind == "Ethereum" &&
    asset.id.interior.value[1].__kind == "AccountKey20"
  ) {
    return {
      address: asset.id.interior.value[1].key,
      amount: asset.fun.value,
    };
  }
  return nullAsset;
};

const matchReserveTransferToEthereum = (
  instruction: V4Instruction
): boolean => {
  if (
    instruction.__kind == "InitiateReserveWithdraw" &&
    instruction.reserve.parents == 2 &&
    instruction.reserve.interior.__kind == "X1" &&
    instruction.reserve.interior.value[0].__kind == "GlobalConsensus" &&
    instruction.reserve.interior.value[0].value.__kind == "Ethereum"
  ) {
    return true;
  }
  return false;
};

const matchEthereumBeneficiary = (instruction: V4Instruction): string => {
  if (
    instruction.__kind == "InitiateReserveWithdraw" &&
    instruction.reserve.parents == 2 &&
    instruction.reserve.interior.__kind == "X1" &&
    instruction.reserve.interior.value[0].__kind == "GlobalConsensus" &&
    instruction.reserve.interior.value[0].value.__kind == "Ethereum" &&
    instruction.xcm.length >= 2 &&
    instruction.xcm[1].__kind == "DepositAsset" &&
    instruction.xcm[1].beneficiary.interior.__kind == "X1" &&
    instruction.xcm[1].beneficiary.interior.value[0].__kind == "AccountKey20"
  ) {
    return instruction.xcm[1].beneficiary.interior.value[0].key;
  }
  return "";
};

async function processOutboundEvents(ctx: ProcessorContext<Store>) {
  let transfersToEthereum: TransferStatusToEthereum[] = [];
  for (let block of ctx.blocks) {
    for (let event of block.events) {
      if (event.name == events.polkadotXcm.sent.name) {
        let rec: {
          origin: V4Location;
          destination: V4Location;
          messageId: Bytes;
          message: V4Instruction[];
        };
        if (events.polkadotXcm.sent.v2901.is(event)) {
          rec = events.polkadotXcm.sent.v2901.decode(event);
        } else {
          throw new Error("Unsupported spec");
        }
        // Filter message which contains instructions:
        // [WithdrawAsset,ClearOrigin,BuyExecution,SetAppendix,InitiateReserveWithdraw,SetTopic]
        if (rec.message.length < 6) {
          continue;
        }
        let amount: bigint;
        let senderAddress: Bytes = "";
        let tokenAddress: Bytes = "";
        let destinationAddress: Bytes = "";
        let messageId: Bytes = "";
        // Filter message destination to AH
        if (!isDestinationToAssetHub(rec.destination)) {
          continue;
        }
        // Get sender address
        if (rec.origin.interior.__kind == "X1") {
          let val = rec.origin.interior.value[0];
          if (val.__kind == "AccountId32") {
            senderAddress = val.id;
          } else if (val.__kind == "AccountKey20") {
            senderAddress = val.key;
          }
        }
        if (!senderAddress) {
          ctx.log.error("sender address not supported");
          continue;
        }
        // Get tokenAddress and tokenAmount from WithdrawAsset
        // Asset with index 0 is fee, asset with index 1 is the transferred asset
        // Fiter with ENA
        let instruction0 = rec.message[0];
        let ethereumAsset = matchEthereumNativeAsset(instruction0);
        if (!ethereumAsset.address) {
          continue;
        }
        tokenAddress = ethereumAsset.address;
        amount = ethereumAsset.amount;

        // Filter the inner InitiateReserveWithdraw with destination to Ethereum
        let instruction4 = rec.message[4];
        let toEthereum = matchReserveTransferToEthereum(instruction4);
        if (!toEthereum) {
          ctx.log.error("no reserve transfer to ethereum");
          continue;
        }
        // Get beneficiary from the inner InitiateReserveWithdraw
        let ethreumBeneficiary = matchEthereumBeneficiary(instruction4);
        if (!ethreumBeneficiary) {
          ctx.log.error("no beneficiary");
          continue;
        }
        destinationAddress = ethreumBeneficiary;

        // Get messageId from SetTopic
        let instruction5 = rec.message[5];
        if (instruction5.__kind == "SetTopic") {
          messageId = instruction5.value;
        }
        if (!messageId) {
          ctx.log.error("no messageId");
          continue;
        }

        let message = new TransferStatusToEthereum({
          id: messageId!,
          txHash: event.extrinsic?.hash,
          blockNumber: block.header.height,
          timestamp: new Date(block.header.timestamp!),
          messageId: messageId!,
          tokenAddress: tokenAddress!,
          sourceParaId: MoonBeamParaId,
          senderAddress: senderAddress!,
          destinationAddress: destinationAddress!,
          amount: amount!,
          status: TransferStatusEnum.Sent,
        });
        transfersToEthereum.push(message);
      }
    }
  }

  if (transfersToEthereum.length > 0) {
    ctx.log.debug("saving transfer messages to ethereum");
    await ctx.store.save(transfersToEthereum);
  }
}

async function processInboundEvents(ctx: ProcessorContext<Store>) {
  let processedMessages: MessageProcessedOnPolkadot[] = [],
    transfersToPolkadot: TransferStatusToPolkadot[] = [];
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
        if (events.messageQueue.processed.v2901.is(event)) {
          rec = events.messageQueue.processed.v2901.decode(event);
        } else if (events.messageQueue.processingFailed.v2901.is(event)) {
          rec = events.messageQueue.processingFailed.v2901.decode(event);
        } else {
          ctx.log.error("Unsupported spec");
        }
        // Filter message from AH
        if (
          rec! &&
          rec.origin.__kind == "Sibling" &&
          rec.origin.value == AssetHubParaId
        ) {
          let message = new MessageProcessedOnPolkadot({
            id: event.id,
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            messageId: rec.id.toString().toLowerCase(),
            paraId: MoonBeamParaId,
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
            transfer.destinationBlockNumber = block.header.height;
            transfersToPolkadot.push(transfer);
          }
        }
      }
    }
  }
  if (processedMessages.length > 0) {
    ctx.log.debug("saving messageQueue processed messages");
    await ctx.store.save(processedMessages);
  }
  if (transfersToPolkadot.length > 0) {
    ctx.log.debug("saving transfer messages from ethereum to polkadot");
    await ctx.store.save(transfersToPolkadot);
  }
}
