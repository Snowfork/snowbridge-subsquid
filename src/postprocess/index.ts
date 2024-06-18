import { createOrmConfig } from "@subsquid/typeorm-config";
import { registerTsNodeIfRequired } from "@subsquid/util-internal-ts-node";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import { TransferStatus, InboundMessage, MessageProcessed } from "../model";
import { TransferStatusE2S } from "../common";

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
    let updated: TransferStatus[] = [];
    let transfers = await connection.manager.find(TransferStatus, {
      where: [
        { status: TransferStatusE2S.Sent },
        { status: TransferStatusE2S.InboundQueueReceived },
      ],
    });
    for (let transfer of transfers) {
      let inboundMessage = await connection.manager.findOneBy(InboundMessage, {
        messageId: transfer.id,
      });
      if (inboundMessage!) {
        transfer.status = TransferStatusE2S.InboundQueueReceived;
        updated.push(transfer);
      }
      let processedMessage = await connection.manager.findOneBy(
        MessageProcessed,
        {
          messageId: transfer.id,
        }
      );
      if (processedMessage!) {
        if (processedMessage.success) {
          transfer.status = TransferStatusE2S.Processed;
        } else {
          transfer.status = TransferStatusE2S.ProcessFailed;
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
