import { hexToU8a, stringToU8a, u8aToHex } from "@polkadot/util";
import { blake2AsU8a } from "@polkadot/util-crypto";

export enum TransferStatusEnum {
  Pending,
  Complete,
  Failed,
}

export const BridgeHubParaId = 1002;

export const AssetHubParaId = 1000;

export const MoonBeamParaId = 2004;

export const HydrationParaId = 2034;

export interface ToEthereumAsset {
  location: string;
  address: string;
  amount: bigint;
}

export const toSubscanEventID = (id: string) => {
  let parts = id.split("-");
  let blockNumber = parseInt(parts[0]);
  let eventIndex = parseInt(parts[2]);
  return `${blockNumber}-${eventIndex}`;
};

export const forwardedTopicId = (messageId: string): string => {
  // From rust code
  // (b"forward_id_for", original_id).using_encoded(sp_io::hashing::blake2_256)
  const typeEncoded = stringToU8a("forward_id_for");
  const paraIdEncoded = hexToU8a(messageId);
  const joined = new Uint8Array([...typeEncoded, ...paraIdEncoded]);
  const newTopicId = blake2AsU8a(joined, 256);
  return u8aToHex(newTopicId);
};
