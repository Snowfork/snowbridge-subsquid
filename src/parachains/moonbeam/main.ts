import { TypeormDatabase, Store } from "@subsquid/typeorm-store";
import { processor, ProcessorContext } from "./processor";
import {
  MessageProcessedOnPolkadot,
  TransferStatusToPolkadot,
  TokenSentOnPolkadot,
  TransferStatusToEthereum,
} from "../../model";
import { events } from "./types";
import { Bytes } from "./types/support";
import { V4Instruction, V4Location } from "./types/v3100";
import {
  TransferStatusEnum,
  AssetHubParaId,
  MoonBeamParaId,
} from "../../common";

processor.run(
  new TypeormDatabase({
    supportHotBlocks: true,
    stateSchema: "moonbeam_processor",
  }),
  async (ctx) => {
    await processBridgeEvents(ctx);
  }
);

async function processBridgeEvents(ctx: ProcessorContext<Store>) {
  await processOutboundEvents(ctx);
  await processInboundEvents(ctx);
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
        if (events.polkadotXcm.sent.v2901.is(event)) {
          rec = events.polkadotXcm.sent.v2901.decode(event);
        } else {
          throw new Error("Unsupported spec");
        }
        // Filter message to AH only
        if (
          rec.destination.parents == 1 &&
          rec.destination.interior.__kind == "X1" &&
          rec.destination.interior.value[0].__kind == "Parachain" &&
          rec.destination.interior.value[0].value == AssetHubParaId
        ) {
          let amount: bigint;
          let senderAddress: Bytes;
          let tokenAddress: Bytes;
          let destinationAddress: Bytes;
          let messageId: Bytes;

          if (rec.origin.interior.__kind == "X1") {
            let val = rec.origin.interior.value[0];
            if (val.__kind == "AccountId32") {
              senderAddress = val.id;
            } else if (val.__kind == "AccountKey20") {
              senderAddress = val.key;
            }
          }

          // Filter message which contains InitiateReserveWithdraw|DepositReserveAsset
          if (rec.message.length > 5) {
            let instruction0 = rec.message[0];
            if (instruction0.__kind == "WithdrawAsset") {
              if (instruction0.value.length != 2) {
                continue;
              }
              let asset = instruction0.value[1];
              if (asset.fun.__kind == "Fungible") {
                if (asset.id.interior.__kind == "X2") {
                  let val = asset.id.interior.value[0];
                  // Filter only with ENA and will add PNA later
                  if (
                    val.__kind != "GlobalConsensus" ||
                    val.value.__kind != "Ethereum"
                  ) {
                    continue;
                  }
                  let token_val = asset.id.interior.value[1];
                  if (token_val.__kind == "AccountKey20") {
                    tokenAddress = token_val.key;
                  }
                  amount = asset.fun.value;
                }
              }
            }

            // Filter for ENA
            let instruction4 = rec.message[4];
            if (instruction4.__kind == "InitiateReserveWithdraw") {
              let reserve = instruction4.reserve;
              if (
                reserve.parents == 2 &&
                reserve.interior.__kind == "X1" &&
                reserve.interior.value[0].__kind == "GlobalConsensus" &&
                reserve.interior.value[0].value.__kind == "Ethereum"
              ) {
                let instruction5 = rec.message[5];
                if (instruction5.__kind == "SetTopic") {
                  messageId = instruction5.value;
                }
                if (instruction4.xcm.length < 2) {
                  continue;
                }
                let instruction3 = instruction4.xcm[1];
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
                  messageId: messageId!,
                  tokenAddress: tokenAddress!,
                  sourceParaId: MoonBeamParaId,
                  senderAddress: senderAddress!,
                  destinationAddress: destinationAddress!,
                  amount: amount!,
                });
                tokenSentMessages.push(tokenSentMessage);

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

async function processInboundEvents(ctx: ProcessorContext<Store>) {}
