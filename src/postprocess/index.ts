import { createOrmConfig } from "@subsquid/typeorm-config";
import { DataSource, Not } from "typeorm";
import {
  TransferStatusToPolkadot,
  TransferStatusToEthereum,
  MessageProcessedOnPolkadot,
  InboundMessageDispatchedOnEthereum,
} from "../model";
import { AssetHubParaId, TransferStatusEnum } from "../common";

export const postProcess = async () => {
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
    await processToPolkadot(connection);
    await processToEthereum(connection);
  } finally {
    await connection.destroy().catch(() => null);
  }
};

const processToPolkadot = async (connection: DataSource) => {
  let updated: TransferStatusToPolkadot[] = [];
  let transfers = await connection.manager.find(TransferStatusToPolkadot, {
    where: [
      { status: TransferStatusEnum.Sent },
      { status: TransferStatusEnum.Bridged },
      { status: TransferStatusEnum.Forwarded },
    ],
  });
  for (let transfer of transfers) {
    let processedMessage;
    processedMessage = await connection.manager.findOneBy(
      MessageProcessedOnPolkadot,
      {
        messageId: transfer.id,
        paraId: Not(AssetHubParaId),
      }
    );
    if (!processedMessage) {
      processedMessage = await connection.manager.findOneBy(
        MessageProcessedOnPolkadot,
        {
          messageId: transfer.id,
        }
      );
    }
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
  console.log("To polkadot transfer status updated");
};

const processToEthereum = async (connection: DataSource) => {
  let updated: TransferStatusToEthereum[] = [];
  let transfers = await connection.manager.find(TransferStatusToEthereum, {
    where: [
      { status: TransferStatusEnum.Sent },
      { status: TransferStatusEnum.Bridged },
      { status: TransferStatusEnum.Forwarded },
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
    }
  }
  await connection.manager.save(updated);
  console.log("To ethereum transfer status updated");
};
