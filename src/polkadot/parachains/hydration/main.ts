import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { processor, ProcessorContext } from "./processor";
import {
  MessageProcessedOnPolkadot,
  TransferStatusToPolkadot,
  TransferStatusToEthereum,
} from "../../../model";
import { events } from "./types";
import { Bytes } from "./types/support";
import {
  V4Instruction,
  V4Location,
  AggregateMessageOrigin,
  ProcessMessageError,
} from "./types/v244";
import {
  TransferStatusEnum,
  AssetHubParaId,
  ToEthereumAsset,
  HydrationParaId,
  toSubscanEventID,
} from "../../../common";

processor.run(
  new TypeormDatabase({
    supportHotBlocks: true,
    stateSchema: "hydration_processor",
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

const matchToEthereumAsset = (
  instruction: V4Instruction
): ToEthereumAsset | undefined => {
  let ethereumAsset;
  if (instruction.__kind == "WithdrawAsset" && instruction.value.length > 1) {
    let asset = instruction.value[1];
    if (asset.fun.__kind == "Fungible") {
      let location = JSON.stringify(asset.id, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      );
      let amount = asset.fun.value;
      if (
        asset.id.interior.__kind == "X2" &&
        asset.id.interior.value[0].__kind == "GlobalConsensus" &&
        asset.id.interior.value[0].value.__kind == "Ethereum" &&
        asset.id.interior.value[1].__kind == "AccountKey20"
      ) {
        // ENA
        ethereumAsset = {
          address: asset.id.interior.value[1].key,
          amount,
          location,
        };
      } else {
        // PNA
        ethereumAsset = {
          address: "",
          amount,
          location,
        };
      }
    }
  }
  return ethereumAsset;
};

const matchReserveTransferENAToEthereum = (
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

const matchReserveTransferPNAToEthereum = (
  instruction: V4Instruction
): boolean => {
  if (
    instruction.__kind == "DepositReserveAsset" &&
    instruction.dest.parents == 2 &&
    instruction.dest.interior.__kind == "X1" &&
    instruction.dest.interior.value[0].__kind == "GlobalConsensus" &&
    instruction.dest.interior.value[0].value.__kind == "Ethereum"
  ) {
    return true;
  }
  return false;
};

const matchEthereumBeneficiary = (instruction: V4Instruction): string => {
  if (
    (instruction.__kind == "InitiateReserveWithdraw" ||
      instruction.__kind == "DepositReserveAsset") &&
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
        if (events.polkadotXcm.sent.v244.is(event)) {
          rec = events.polkadotXcm.sent.v244.decode(event);
        } else {
          throw Object.assign(new Error("Unsupported spec"), event);
        }
        // Filter message which contains instructions:
        // ENA:[WithdrawAsset,ClearOrigin,BuyExecution,SetAppendix,InitiateReserveWithdraw,SetTopic]
        // PNA:[WithdrawAsset,ClearOrigin,BuyExecution,SetAppendix,DepositReserveAsset,SetTopic]
        if (rec.message.length < 6) {
          continue;
        }
        let amount: bigint;
        let senderAddress: Bytes = "";
        let tokenAddress: Bytes = "";
        let tokenLocation: Bytes = "";
        let destinationAddress: Bytes = "";
        let messageId: Bytes = "";
        // Filter message destination to AH
        if (!isDestinationToAssetHub(rec.destination)) {
          continue;
        }

        // Filter transfer PNA|ENA with destination to Ethereum
        let instruction4 = rec.message[4];
        let transferENAtoEthereum =
          matchReserveTransferENAToEthereum(instruction4);
        let transferPNAtoEthereum =
          matchReserveTransferPNAToEthereum(instruction4);
        if (!transferENAtoEthereum && !transferPNAtoEthereum) {
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
          throw new Error("no sender address");
        }
        // Get tokenAddress and tokenAmount
        // Asset with index 0 is fee, asset with index 1 is the transferred asset
        // For PNA the token address is not known beforehand, leave it empty for now
        // may need to index tokenInfo from the register event for the mapping from tokenLocation<->foreignTokenId<->tokenAddress
        let instruction0 = rec.message[0];
        let ethereumAsset = matchToEthereumAsset(instruction0);
        if (!ethereumAsset) {
          throw new Error("to ethereum unkown token info");
        }
        tokenAddress = ethereumAsset.address;
        tokenLocation = ethereumAsset.location;
        amount = ethereumAsset.amount;

        // Get beneficiary from the inner InitiateReserveWithdraw
        let ethreumBeneficiary = matchEthereumBeneficiary(instruction4);
        destinationAddress = ethreumBeneficiary;
        if (!destinationAddress) {
          throw new Error("no destination address");
        }

        // Get messageId from SetTopic
        let instruction5 = rec.message[5];
        if (instruction5.__kind == "SetTopic") {
          messageId = instruction5.value;
        }
        if (!messageId) {
          throw new Error("no message id in SetTopic instruction");
        }

        let transferToEthereum = new TransferStatusToEthereum({
          id: messageId!,
          txHash: event.extrinsic?.hash,
          blockNumber: block.header.height,
          timestamp: new Date(block.header.timestamp!),
          messageId: messageId!,
          tokenAddress: tokenAddress,
          tokenLocation: tokenLocation,
          sourceParaId: HydrationParaId,
          senderAddress: senderAddress!,
          destinationAddress: destinationAddress!,
          amount: amount!,
          status: TransferStatusEnum.Pending,
        });
        let transfer = await ctx.store.findOneBy(TransferStatusToPolkadot, {
          id: transferToEthereum.messageId,
        });
        if (!transfer) {
          transfersToEthereum.push(transferToEthereum);
        }
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
        if (events.messageQueue.processed.v244.is(event)) {
          rec = events.messageQueue.processed.v244.decode(event);
        } else if (events.messageQueue.processingFailed.v244.is(event)) {
          rec = events.messageQueue.processingFailed.v244.decode(event);
        } else {
          throw Object.assign(new Error("Unsupported spec"), event);
        }
        // Filter message from AH
        if (
          rec.origin.__kind == "Sibling" &&
          rec.origin.value == AssetHubParaId
        ) {
          let message = new MessageProcessedOnPolkadot({
            id: event.id,
            blockNumber: block.header.height,
            timestamp: new Date(block.header.timestamp!),
            messageId: rec.id.toString().toLowerCase(),
            paraId: HydrationParaId,
            success: rec.success,
            eventId: toSubscanEventID(event.id),
          });
          processedMessages.push(message);
          let transfer = await ctx.store.findOneBy(TransferStatusToPolkadot, {
            id: message.messageId,
          });
          if (transfer!) {
            if (message.success) {
              transfer.status = TransferStatusEnum.Complete;
            } else {
              transfer.status = TransferStatusEnum.Failed;
            }
            transfer.toDestination = message;
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
