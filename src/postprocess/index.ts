import { createOrmConfig } from "@subsquid/typeorm-config";
import { registerTsNodeIfRequired } from "@subsquid/util-internal-ts-node";
import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import {
  TransferStatusToPolkadot,
  TransferStatusToEthereum,
  InboundMessageReceivedOnBridgeHub,
  OutboundMessageAcceptedOnBridgeHub,
  MessageProcessedOnPolkadot,
  InboundMessageDispatchedOnEthereum,
} from "../model";
import { TransferStatusEnum } from "../common";

export const postProcess = async () => {
  dotenv.config();

  let direction: string;

  if (process.argv.length == 3) {
    direction = process.argv[2];
  }

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
    if (direction! == "toPolkadot") {
      await processToPolkadot(connection);
    } else if (direction! == "toEthereum") {
      await processToEthereum(connection);
    }
  } finally {
    await connection.destroy().catch(() => null);
  }
};

const processToPolkadot = async (connection: DataSource) => {
  let updated: TransferStatusToPolkadot[] = [];
  let transfers = await connection.manager.find(TransferStatusToPolkadot, {
    where: [
      { status: TransferStatusEnum.Sent },
      { status: TransferStatusEnum.InboundQueueReceived },
    ],
  });
  for (let transfer of transfers) {
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
    } else {
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
    }
  }
  await connection.manager.save(updated);
  console.log("To polkadot transfer status updated");
};

const processToEthereum = async (connection: DataSource) => {
  let updated: TransferStatusToEthereum[] = [];
  let transfers = await connection.manager.find(TransferStatusToEthereum, {
    where: [
      { status: TransferStatusEnum.Sent },
      { status: TransferStatusEnum.OutboundQueueReceived },
    ],
  });
  for (let transfer of transfers) {
    let processedMessage = await connection.manager.findOneBy(
      InboundMessageDispatchedOnEthereum,
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
    } else {
      let outboundMessage = await connection.manager.findOneBy(
        OutboundMessageAcceptedOnBridgeHub,
        {
          messageId: transfer.id,
        }
      );
      if (outboundMessage!) {
        transfer.status = TransferStatusEnum.OutboundQueueReceived;
        updated.push(transfer);
      }
    }
  }
  await connection.manager.save(updated);
  console.log("To ethereum transfer status updated");
};

postProcess()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
