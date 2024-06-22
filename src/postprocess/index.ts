import { createOrmConfig } from "@subsquid/typeorm-config";
import { registerTsNodeIfRequired } from "@subsquid/util-internal-ts-node";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import {
  TransferStatusToPolkadot,
  InboundMessageReceivedOnBridgeHub,
  MessageProcessedOnPolkadot,
} from "../model";
import { TransferStatusEnum } from "../common";

export const post_process = async () => {
  dotenv.config();

  await registerTsNodeIfRequired();

  let connection = new DataSource({
    ...createOrmConfig(),
    subscribers: [],
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
    logging: ["query", "error", "schema"],
  });

  await connection.initialize();

  try {
    let updated: TransferStatusToPolkadot[] = [];
    let transfers = await connection.manager.find(TransferStatusToPolkadot, {
      where: [
        { status: TransferStatusEnum.Sent },
        { status: TransferStatusEnum.InboundQueueReceived },
      ],
    });
    for (let transfer of transfers) {
      let inboundMessage = await connection.manager.findOneBy(
        InboundMessageReceivedOnBridgeHub,
        {
          messageId: transfer.id,
        }
      );
      if (inboundMessage!) {
        transfer.status = TransferStatusEnum.InboundQueueReceived;
        updated.push(transfer);
      }
      let processedMessage = await connection.manager.findOneBy(
        MessageProcessedOnPolkadot,
        {
          messageId: transfer.id,
        }
      );
      if (processedMessage!) {
        if (processedMessage.success) {
          transfer.status = TransferStatusEnum.Processed;
        } else {
          transfer.status = TransferStatusEnum.ProcessFailed;
        }
        updated.push(transfer);
      }
    }
    await connection.manager.save(updated);
    console.log("updated");
  } finally {
    await connection.destroy().catch(() => null);
  }
};

post_process()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
