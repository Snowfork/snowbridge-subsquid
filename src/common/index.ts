export enum TransferStatusEnum {
  Sent = "Sent",
  InboundQueueReceived = "InboundQueueReceived",
  OutboundQueueReceived = "OutboundQueueReceived",
  Processed = "Processed",
  ProcessFailed = "ProcessFailed",
  AssetHubForwarded = "AssetHubForwarded",
}

export const BridgeHubParaId = 1002;

export const AssetHubParaId = 1000;

export const MoonBeamParaId = 2004;

export const HydrationParaId = 2034;

export interface EthereumNativeAsset {
  address: string;
  amount: bigint;
}
