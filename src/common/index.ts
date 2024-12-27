export enum TransferStatusEnum {
  // Sent on source chain
  Sent = "Sent",
  // Bridged on BH
  Bridged = "Bridged",
  // Forwarded on AH
  Forwarded = "Forwarded",
  // Processed | ProcessFailed on destination
  Processed = "Processed",
  ProcessFailed = "ProcessFailed",
}

export const BridgeHubParaId = 1002;

export const AssetHubParaId = 1000;

export const MoonBeamParaId = 2004;

export const HydrationParaId = 2034;

export interface EthereumNativeAsset {
  address: string;
  amount: bigint;
}
