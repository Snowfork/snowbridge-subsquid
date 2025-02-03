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
import {
  AssetHubParaId,
  forwardedTopicId,
  TransferStatusEnum,
} from "../common";

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
    await processToPolkadotOnBridgeHub(connection);
    await processToPolkadotOnAssetHub(connection);
    await processToEthereumForwardOnAssetHub(connection);
    await processToEthereumOnBridgeHubMessageQueue(connection);
    await processToEthereumOnBridgeHubOutboundQueue(connection);
    await processToEthereumOnDestination(connection);
  } finally {
    await connection.destroy().catch(() => null);
  }
};

const processToPolkadotOnBridgeHub = async (connection: DataSource) => {
  let updated: TransferStatusToPolkadot[] = [];
  let transfers = await connection.manager.find(TransferStatusToPolkadot, {
    relations: {
      toBridgeHubInboundQueue: true,
    },
    where: {
      toBridgeHubInboundQueue: IsNull(),
    },
  });
  for (let transfer of transfers) {
    let inboundMessage = await connection.manager.findOneBy(
      InboundMessageReceivedOnBridgeHub,
      {
        messageId: transfer.id,
      }
    );
    if (inboundMessage!) {
      transfer.toBridgeHubInboundQueue = inboundMessage;
      updated.push(transfer);
    }
  }
  if (updated.length) {
    await connection.manager.save(updated);
    console.log("To polkadot transfer on BH updated");
  }
};

// Before Patch#2409 when transfer processed on AH, treat it as succeed
const processToPolkadotOnAssetHub = async (connection: DataSource) => {
  let updated: TransferStatusToPolkadot[] = [];
  let transfers = await connection.manager.find(TransferStatusToPolkadot, {
    relations: {
      toAssetHubMessageQueue: true,
    },
    where: {
      toAssetHubMessageQueue: IsNull(),
    },
  });
  for (let transfer of transfers) {
    let processedMessage = await connection.manager.findOneBy(
      MessageProcessedOnPolkadot,
      {
        messageId: transfer.id,
      }
    );
    if (processedMessage!) {
      if (transfer.destinationParaId == AssetHubParaId) {
        transfer.toAssetHubMessageQueue = processedMessage;
        transfer.toDestination = processedMessage;
      } else {
        transfer.toAssetHubMessageQueue = processedMessage;
      }
      if (processedMessage.success) {
        transfer.status = TransferStatusEnum.Complete;
      } else {
        transfer.status = TransferStatusEnum.Failed;
      }
      updated.push(transfer);
    }
  }
  if (updated.length) {
    await connection.manager.save(updated);
    console.log("To polkadot transfer on AH updated");
  }
};

const processToEthereumForwardOnAssetHub = async (connection: DataSource) => {
  let updated: TransferStatusToEthereum[] = [];
  let transfers = await connection.manager.find(TransferStatusToEthereum, {
    relations: {
      toAssetHubMessageQueue: true,
    },
    where: {
      sourceParaId: Not(AssetHubParaId),
      toAssetHubMessageQueue: IsNull(),
    },
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
        transfer.toAssetHubMessageQueue = processedMessage;
      } else {
        transfer.status = TransferStatusEnum.Failed;
      }
      updated.push(transfer);
    }
  }
  if (updated.length) {
    await connection.manager.save(updated);
    console.log("To ethereum transfer forward on AH updated");
  }
};

const processToEthereumOnBridgeHubMessageQueue = async (
  connection: DataSource
) => {
  let updated: TransferStatusToEthereum[] = [];
  let transfers = await connection.manager.find(TransferStatusToEthereum, {
    relations: {
      toBridgeHubMessageQueue: true,
    },
    where: {
      toBridgeHubMessageQueue: IsNull(),
    },
  });
  for (let transfer of transfers) {
    let bridgeHubId = forwardedTopicId(transfer.id);
    let processedMessage = await connection.manager.findOneBy(
      MessageProcessedOnPolkadot,
      {
        messageId: bridgeHubId,
      }
    );
    if (processedMessage!) {
      if (processedMessage.success) {
        transfer.toBridgeHubMessageQueue = processedMessage;
      } else {
        transfer.status = TransferStatusEnum.Failed;
      }
      updated.push(transfer);
    }
  }
  if (updated.length) {
    await connection.manager.save(updated);
    console.log("To ethereum transfer on bridgehub message queue updated");
  }
};

const processToEthereumOnBridgeHubOutboundQueue = async (
  connection: DataSource
) => {
  let updated: TransferStatusToEthereum[] = [];
  let transfers = await connection.manager.find(TransferStatusToEthereum, {
    relations: {
      toBridgeHubOutboundQueue: true,
    },
    where: {
      toBridgeHubOutboundQueue: IsNull(),
    },
  });
  for (let transfer of transfers) {
    let outboundAccepted = await connection.manager.findOneBy(
      OutboundMessageAcceptedOnBridgeHub,
      {
        messageId: transfer.id,
      }
    );
    if (outboundAccepted!) {
      transfer.nonce = outboundAccepted.nonce;
      transfer.toBridgeHubOutboundQueue = outboundAccepted;
      updated.push(transfer);
    }
  }
  if (updated.length) {
    await connection.manager.save(updated);
    console.log("To ethereum transfer on bridgehub outbound queue updated");
  }
};

const processToEthereumOnDestination = async (connection: DataSource) => {
  let updated: TransferStatusToEthereum[] = [];
  let transfers = await connection.manager.find(TransferStatusToEthereum, {
    relations: {
      toDestination: true,
    },
    where: {
      toDestination: IsNull(),
    },
  });
  for (let transfer of transfers) {
    let inboundDispatched = await connection.manager.findOneBy(
      InboundMessageDispatchedOnEthereum,
      {
        messageId: transfer.id,
      }
    );
    if (inboundDispatched!) {
      if (inboundDispatched.success) {
        transfer.status = TransferStatusEnum.Complete;
      } else {
        transfer.status = TransferStatusEnum.Failed;
      }
      transfer.channelId = inboundDispatched.channelId;
      transfer.toDestination = inboundDispatched;
      updated.push(transfer);
    }
  }
  if (updated.length) {
    await connection.manager.save(updated);
    console.log("To ethereum transfer on destination updated");
  }
};
