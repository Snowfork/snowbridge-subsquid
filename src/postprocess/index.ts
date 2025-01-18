import { createOrmConfig } from "@subsquid/typeorm-config";
import { DataSource } from "typeorm";
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
    await processToPolkadot(connection);
    await processToEthereum(connection);
  } finally {
    await connection.destroy().catch(() => null);
  }
};

const processToPolkadot = async (connection: DataSource) => {
  let updated: TransferStatusToPolkadot[] = [];
  let transfers = await connection.manager.find(TransferStatusToPolkadot, {
    where: [{ status: TransferStatusEnum.Pending }],
  });
  for (let transfer of transfers) {
    let changed = false;
    if (!transfer.toBridgeHubInboundQueue) {
      let inboundMessage = await connection.manager.findOneBy(
        InboundMessageReceivedOnBridgeHub,
        {
          messageId: transfer.id,
        }
      );
      if (inboundMessage!) {
        transfer.toBridgeHubInboundQueue = inboundMessage;
        changed = true;
      }
    }

    // Before Patch#2409 when transfer processed on AH, treat it as succeed
    let processedMessage = await connection.manager.findOneBy(
      MessageProcessedOnPolkadot,
      {
        messageId: transfer.id,
      }
    );
    if (processedMessage!) {
      if (transfer.destinationParaId == AssetHubParaId) {
        transfer.toDestination = processedMessage;
      } else {
        transfer.toAssetHubMessageQueue = processedMessage;
      }
      if (processedMessage.success) {
        transfer.status = TransferStatusEnum.Complete;
      } else {
        transfer.status = TransferStatusEnum.Failed;
      }
      changed = true;
    }
    if (changed) {
      updated.push(transfer);
    }
  }
  if (updated.length) {
    await connection.manager.save(updated);
    console.log("To polkadot transfer updated");
  }
};

const processToEthereum = async (connection: DataSource) => {
  let updated: TransferStatusToEthereum[] = [];
  let transfers = await connection.manager.find(TransferStatusToEthereum, {
    where: [{ status: TransferStatusEnum.Pending }],
  });
  for (let transfer of transfers) {
    let changed = false;
    // Update toAssetHubMessageQueue
    if (
      transfer.sourceParaId != AssetHubParaId &&
      !transfer.toAssetHubMessageQueue
    ) {
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
        changed = true;
      }
    }
    // Update toBridgeHubMessageQueue
    if (!transfer.toBridgeHubMessageQueue) {
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
        changed = true;
      }
    }
    // Update toBridgeHubOutboundQueue
    if (!transfer.toBridgeHubOutboundQueue) {
      let outboundAccepted = await connection.manager.findOneBy(
        OutboundMessageAcceptedOnBridgeHub,
        {
          messageId: transfer.id,
        }
      );
      if (outboundAccepted!) {
        transfer.toBridgeHubOutboundQueue = outboundAccepted;
        changed = true;
      }
    }
    // Update the final status
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
      changed = true;
    }
    if (changed) {
      updated.push(transfer);
    }
  }
  if (updated.length) {
    await connection.manager.save(updated);
    console.log("To ethereum transfer status updated");
  }
};
