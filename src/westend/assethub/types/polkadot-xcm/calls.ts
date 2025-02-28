import {sts, Block, Bytes, Option, Result, CallType, RuntimeCtx} from '../support'
import * as v1003000 from '../v1003000'
import * as v1005000 from '../v1005000'
import * as v1007000 from '../v1007000'
import * as v1016005 from '../v1016005'

export const reserveTransferAssets =  {
    name: 'PolkadotXcm.reserve_transfer_assets',
    /**
     * See [`Pallet::reserve_transfer_assets`].
     */
    v1003000: new CallType(
        'PolkadotXcm.reserve_transfer_assets',
        sts.struct({
            dest: v1003000.VersionedMultiLocation,
            beneficiary: v1003000.VersionedMultiLocation,
            assets: v1003000.VersionedMultiAssets,
            feeAssetItem: sts.number(),
        })
    ),
    /**
     * See [`Pallet::reserve_transfer_assets`].
     */
    v1005000: new CallType(
        'PolkadotXcm.reserve_transfer_assets',
        sts.struct({
            dest: v1005000.VersionedMultiLocation,
            beneficiary: v1005000.VersionedMultiLocation,
            assets: v1005000.VersionedMultiAssets,
            feeAssetItem: sts.number(),
        })
    ),
    /**
     * See [`Pallet::reserve_transfer_assets`].
     */
    v1007000: new CallType(
        'PolkadotXcm.reserve_transfer_assets',
        sts.struct({
            dest: v1007000.VersionedLocation,
            beneficiary: v1007000.VersionedLocation,
            assets: v1007000.VersionedAssets,
            feeAssetItem: sts.number(),
        })
    ),
    /**
     * Transfer some assets from the local chain to the destination chain through their local,
     * destination or remote reserve.
     * 
     * `assets` must have same reserve location and may not be teleportable to `dest`.
     *  - `assets` have local reserve: transfer assets to sovereign account of destination
     *    chain and forward a notification XCM to `dest` to mint and deposit reserve-based
     *    assets to `beneficiary`.
     *  - `assets` have destination reserve: burn local assets and forward a notification to
     *    `dest` chain to withdraw the reserve assets from this chain's sovereign account and
     *    deposit them to `beneficiary`.
     *  - `assets` have remote reserve: burn local assets, forward XCM to reserve chain to move
     *    reserves from this chain's SA to `dest` chain's SA, and forward another XCM to `dest`
     *    to mint and deposit reserve-based assets to `beneficiary`.
     * 
     * **This function is deprecated: Use `limited_reserve_transfer_assets` instead.**
     * 
     * Fee payment on the destination side is made from the asset in the `assets` vector of
     * index `fee_asset_item`. The weight limit for fees is not provided and thus is unlimited,
     * with all fees taken as needed from the asset.
     * 
     * - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
     * - `dest`: Destination context for the assets. Will typically be `[Parent,
     *   Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
     *   relay to parachain.
     * - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
     *   generally be an `AccountId32` value.
     * - `assets`: The assets to be withdrawn. This should include the assets used to pay the
     *   fee on the `dest` (and possibly reserve) chains.
     * - `fee_asset_item`: The index into `assets` of the item which should be used to pay
     *   fees.
     */
    v1016005: new CallType(
        'PolkadotXcm.reserve_transfer_assets',
        sts.struct({
            dest: v1016005.VersionedLocation,
            beneficiary: v1016005.VersionedLocation,
            assets: v1016005.VersionedAssets,
            feeAssetItem: sts.number(),
        })
    ),
}

export const limitedReserveTransferAssets =  {
    name: 'PolkadotXcm.limited_reserve_transfer_assets',
    /**
     * See [`Pallet::limited_reserve_transfer_assets`].
     */
    v1003000: new CallType(
        'PolkadotXcm.limited_reserve_transfer_assets',
        sts.struct({
            dest: v1003000.VersionedMultiLocation,
            beneficiary: v1003000.VersionedMultiLocation,
            assets: v1003000.VersionedMultiAssets,
            feeAssetItem: sts.number(),
            weightLimit: v1003000.V3WeightLimit,
        })
    ),
    /**
     * See [`Pallet::limited_reserve_transfer_assets`].
     */
    v1005000: new CallType(
        'PolkadotXcm.limited_reserve_transfer_assets',
        sts.struct({
            dest: v1005000.VersionedMultiLocation,
            beneficiary: v1005000.VersionedMultiLocation,
            assets: v1005000.VersionedMultiAssets,
            feeAssetItem: sts.number(),
            weightLimit: v1005000.V3WeightLimit,
        })
    ),
    /**
     * See [`Pallet::limited_reserve_transfer_assets`].
     */
    v1007000: new CallType(
        'PolkadotXcm.limited_reserve_transfer_assets',
        sts.struct({
            dest: v1007000.VersionedLocation,
            beneficiary: v1007000.VersionedLocation,
            assets: v1007000.VersionedAssets,
            feeAssetItem: sts.number(),
            weightLimit: v1007000.V3WeightLimit,
        })
    ),
    /**
     * Transfer some assets from the local chain to the destination chain through their local,
     * destination or remote reserve.
     * 
     * `assets` must have same reserve location and may not be teleportable to `dest`.
     *  - `assets` have local reserve: transfer assets to sovereign account of destination
     *    chain and forward a notification XCM to `dest` to mint and deposit reserve-based
     *    assets to `beneficiary`.
     *  - `assets` have destination reserve: burn local assets and forward a notification to
     *    `dest` chain to withdraw the reserve assets from this chain's sovereign account and
     *    deposit them to `beneficiary`.
     *  - `assets` have remote reserve: burn local assets, forward XCM to reserve chain to move
     *    reserves from this chain's SA to `dest` chain's SA, and forward another XCM to `dest`
     *    to mint and deposit reserve-based assets to `beneficiary`.
     * 
     * Fee payment on the destination side is made from the asset in the `assets` vector of
     * index `fee_asset_item`, up to enough to pay for `weight_limit` of weight. If more weight
     * is needed than `weight_limit`, then the operation will fail and the sent assets may be
     * at risk.
     * 
     * - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
     * - `dest`: Destination context for the assets. Will typically be `[Parent,
     *   Parachain(..)]` to send from parachain to parachain, or `[Parachain(..)]` to send from
     *   relay to parachain.
     * - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
     *   generally be an `AccountId32` value.
     * - `assets`: The assets to be withdrawn. This should include the assets used to pay the
     *   fee on the `dest` (and possibly reserve) chains.
     * - `fee_asset_item`: The index into `assets` of the item which should be used to pay
     *   fees.
     * - `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
     */
    v1016005: new CallType(
        'PolkadotXcm.limited_reserve_transfer_assets',
        sts.struct({
            dest: v1016005.VersionedLocation,
            beneficiary: v1016005.VersionedLocation,
            assets: v1016005.VersionedAssets,
            feeAssetItem: sts.number(),
            weightLimit: v1016005.V3WeightLimit,
        })
    ),
}

export const transferAssets =  {
    name: 'PolkadotXcm.transfer_assets',
    /**
     * See [`Pallet::transfer_assets`].
     */
    v1005000: new CallType(
        'PolkadotXcm.transfer_assets',
        sts.struct({
            dest: v1005000.VersionedMultiLocation,
            beneficiary: v1005000.VersionedMultiLocation,
            assets: v1005000.VersionedMultiAssets,
            feeAssetItem: sts.number(),
            weightLimit: v1005000.V3WeightLimit,
        })
    ),
    /**
     * See [`Pallet::transfer_assets`].
     */
    v1007000: new CallType(
        'PolkadotXcm.transfer_assets',
        sts.struct({
            dest: v1007000.VersionedLocation,
            beneficiary: v1007000.VersionedLocation,
            assets: v1007000.VersionedAssets,
            feeAssetItem: sts.number(),
            weightLimit: v1007000.V3WeightLimit,
        })
    ),
    /**
     * Transfer some assets from the local chain to the destination chain through their local,
     * destination or remote reserve, or through teleports.
     * 
     * Fee payment on the destination side is made from the asset in the `assets` vector of
     * index `fee_asset_item` (hence referred to as `fees`), up to enough to pay for
     * `weight_limit` of weight. If more weight is needed than `weight_limit`, then the
     * operation will fail and the sent assets may be at risk.
     * 
     * `assets` (excluding `fees`) must have same reserve location or otherwise be teleportable
     * to `dest`, no limitations imposed on `fees`.
     *  - for local reserve: transfer assets to sovereign account of destination chain and
     *    forward a notification XCM to `dest` to mint and deposit reserve-based assets to
     *    `beneficiary`.
     *  - for destination reserve: burn local assets and forward a notification to `dest` chain
     *    to withdraw the reserve assets from this chain's sovereign account and deposit them
     *    to `beneficiary`.
     *  - for remote reserve: burn local assets, forward XCM to reserve chain to move reserves
     *    from this chain's SA to `dest` chain's SA, and forward another XCM to `dest` to mint
     *    and deposit reserve-based assets to `beneficiary`.
     *  - for teleports: burn local assets and forward XCM to `dest` chain to mint/teleport
     *    assets and deposit them to `beneficiary`.
     * 
     * - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
     * - `dest`: Destination context for the assets. Will typically be `X2(Parent,
     *   Parachain(..))` to send from parachain to parachain, or `X1(Parachain(..))` to send
     *   from relay to parachain.
     * - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will
     *   generally be an `AccountId32` value.
     * - `assets`: The assets to be withdrawn. This should include the assets used to pay the
     *   fee on the `dest` (and possibly reserve) chains.
     * - `fee_asset_item`: The index into `assets` of the item which should be used to pay
     *   fees.
     * - `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
     */
    v1016005: new CallType(
        'PolkadotXcm.transfer_assets',
        sts.struct({
            dest: v1016005.VersionedLocation,
            beneficiary: v1016005.VersionedLocation,
            assets: v1016005.VersionedAssets,
            feeAssetItem: sts.number(),
            weightLimit: v1016005.V3WeightLimit,
        })
    ),
}
