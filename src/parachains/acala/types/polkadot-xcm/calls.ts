import {sts, Block, Bytes, Option, Result, CallType, RuntimeCtx} from '../support'
import * as v2270 from '../v2270'

export const transferAssetsUsingTypeAndThen =  {
    name: 'PolkadotXcm.transfer_assets_using_type_and_then',
    v2270: new CallType(
        'PolkadotXcm.transfer_assets_using_type_and_then',
        sts.struct({
            dest: v2270.VersionedLocation,
            assets: v2270.VersionedAssets,
            assetsTransferType: v2270.TransferType,
            remoteFeesId: v2270.VersionedAssetId,
            feesTransferType: v2270.TransferType,
            customXcmOnDest: v2270.VersionedXcm,
            weightLimit: v2270.V3WeightLimit,
        })
    ),
}
