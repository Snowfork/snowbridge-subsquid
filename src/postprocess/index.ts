import { createOrmConfig } from "@subsquid/typeorm-config";
import { DataSource, IsNull, Not } from "typeorm";
import {
  TransferStatusToPolkadot,
  TransferStatusToEthereum,
  MessageProcessedOnPolkadot,
  InboundMessageDispatchedOnEthereum,
  InboundMessageReceivedOnBridgeHub,
  OutboundMessageAcceptedOnBridgeHub,
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
    await processToPolkadotStatus(connection);
    await processToEthereumStatus(connection);
    await processToPolkadotWithBridgedBlock(connection);
    await processToEthereumWithBridgedBlock(connection);
    await processToPolkadotWithForwardBlock(connection);
    await processToEthereumWithForwardBlock(connection);
    await processToPolkadotWithDestinationBlock(connection);
    await processToEthereumWithDestinationBlock(connection);
  } finally {
    await connection.destroy().catch(() => null);
  }
};

const processToPolkadotStatus = async (connection: DataSource) => {
  let updated: TransferStatusToPolkadot[] = [];
  let transfers = await connection.manager.find(TransferStatusToPolkadot, {
    where: [
      { status: TransferStatusEnum.Sent },
      { status: TransferStatusEnum.Bridged },
      { status: TransferStatusEnum.Forwarded },
    ],
  });
  for (let transfer of transfers) {
    let processedMessage = await connection.manager.findOneBy(
      MessageProcessedOnPolkadot,
      {
        messageId: transfer.id,
        paraId: AssetHubParaId,
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
  console.log("To polkadot transfer status updated");
};

const processToEthereumStatus = async (connection: DataSource) => {
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

const processToPolkadotWithBridgedBlock = async (connection: DataSource) => {
  let updated: TransferStatusToPolkadot[] = [];
  let transfers = await connection.manager.find(TransferStatusToPolkadot, {
    where: { bridgedBlockNumber: IsNull() },
  });
  for (let transfer of transfers) {
    let processedMessage = await connection.manager.findOneBy(
      InboundMessageReceivedOnBridgeHub,
      {
        messageId: transfer.id,
      }
    );
    if (processedMessage!) {
      transfer.bridgedBlockNumber = processedMessage.blockNumber;
      updated.push(transfer);
    }
  }
  await connection.manager.save(updated);
  console.log("To polkadot transfer bridge block updated");
};

const processToEthereumWithBridgedBlock = async (connection: DataSource) => {
  let updated: TransferStatusToEthereum[] = [];
  let transfers = await connection.manager.find(TransferStatusToEthereum, {
    where: { bridgedBlockNumber: IsNull() },
  });
  for (let transfer of transfers) {
    let processedMessage = await connection.manager.findOneBy(
      OutboundMessageAcceptedOnBridgeHub,
      {
        messageId: transfer.id,
      }
    );
    if (processedMessage!) {
      transfer.bridgedBlockNumber = processedMessage.blockNumber;
      updated.push(transfer);
    }
  }
  await connection.manager.save(updated);
  console.log("To ethereum transfer bridge block updated");
};

const processToPolkadotWithForwardBlock = async (connection: DataSource) => {
  let updated: TransferStatusToPolkadot[] = [];
  let transfers = await connection.manager.find(TransferStatusToPolkadot, {
    where: {
      forwardedBlockNumber: IsNull(),
      destinationParaId: Not(AssetHubParaId),
    },
  });
  for (let transfer of transfers) {
    let processedMessage = await connection.manager.findOneBy(
      MessageProcessedOnPolkadot,
      {
        messageId: transfer.id,
        paraId: AssetHubParaId,
      }
    );
    if (processedMessage!) {
      transfer.forwardedBlockNumber = processedMessage.blockNumber;
      updated.push(transfer);
    }
  }
  await connection.manager.save(updated);
  console.log("To polkadot transfer forward block updated");
};

const processToEthereumWithForwardBlock = async (connection: DataSource) => {
  let updated: TransferStatusToEthereum[] = [];
  let transfers = await connection.manager.find(TransferStatusToEthereum, {
    where: {
      forwardedBlockNumber: IsNull(),
      sourceParaId: Not(AssetHubParaId),
    },
  });
  for (let transfer of transfers) {
    let processedMessage = await connection.manager.findOneBy(
      MessageProcessedOnPolkadot,
      {
        messageId: transfer.id,
        paraId: AssetHubParaId,
      }
    );
    if (processedMessage!) {
      transfer.forwardedBlockNumber = processedMessage.blockNumber;
      updated.push(transfer);
    }
  }
  await connection.manager.save(updated);
  console.log("To ethereum transfer forward block updated");
};

const processToPolkadotWithDestinationBlock = async (
  connection: DataSource
) => {
  let updated: TransferStatusToPolkadot[] = [];
  let transfers = await connection.manager.find(TransferStatusToPolkadot, {
    where: {
      destinationBlockNumber: IsNull(),
      destinationParaId: AssetHubParaId,
    },
  });
  for (let transfer of transfers) {
    let processedMessage = await connection.manager.findOneBy(
      MessageProcessedOnPolkadot,
      {
        messageId: transfer.id,
        paraId: AssetHubParaId,
      }
    );
    if (processedMessage!) {
      transfer.destinationBlockNumber = processedMessage.blockNumber;
      updated.push(transfer);
    }
  }
  await connection.manager.save(updated);
  console.log("To polkadot transfer destination block updated");
};

const processToEthereumWithDestinationBlock = async (
  connection: DataSource
) => {
  let updated: TransferStatusToEthereum[] = [];
  let transfers = await connection.manager.find(TransferStatusToEthereum, {
    where: {
      destinationBlockNumber: IsNull(),
    },
  });
  for (let transfer of transfers) {
    let processedMessage = await connection.manager.findOneBy(
      InboundMessageDispatchedOnEthereum,
      {
        messageId: transfer.id,
      }
    );
    if (processedMessage!) {
      transfer.destinationBlockNumber = processedMessage.blockNumber;
      updated.push(transfer);
    }
  }
  await connection.manager.save(updated);
  console.log("To ethereum transfer destination block updated");
};
