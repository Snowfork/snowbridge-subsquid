import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v9430 from '../v9430'
import * as v1002000 from '../v1002000'
import * as v1003004 from '../v1003004'

export const created =  {
    name: 'ForeignAssets.Created',
    /**
     * Some asset class was created.
     */
    v9430: new EventType(
        'ForeignAssets.Created',
        sts.struct({
            assetId: v9430.V3MultiLocation,
            creator: v9430.AccountId32,
            owner: v9430.AccountId32,
        })
    ),
    /**
     * Some asset class was created.
     */
    v1002000: new EventType(
        'ForeignAssets.Created',
        sts.struct({
            assetId: v1002000.V3MultiLocation,
            creator: v1002000.AccountId32,
            owner: v1002000.AccountId32,
        })
    ),
    /**
     * Some asset class was created.
     */
    v1003004: new EventType(
        'ForeignAssets.Created',
        sts.struct({
            assetId: v1003004.V4Location,
            creator: v1003004.AccountId32,
            owner: v1003004.AccountId32,
        })
    ),
}

export const issued =  {
    name: 'ForeignAssets.Issued',
    /**
     * Some assets were issued.
     */
    v9430: new EventType(
        'ForeignAssets.Issued',
        sts.struct({
            assetId: v9430.V3MultiLocation,
            owner: v9430.AccountId32,
            amount: sts.bigint(),
        })
    ),
    /**
     * Some assets were issued.
     */
    v1002000: new EventType(
        'ForeignAssets.Issued',
        sts.struct({
            assetId: v1002000.V3MultiLocation,
            owner: v1002000.AccountId32,
            amount: sts.bigint(),
        })
    ),
    /**
     * Some assets were issued.
     */
    v1003004: new EventType(
        'ForeignAssets.Issued',
        sts.struct({
            assetId: v1003004.V4Location,
            owner: v1003004.AccountId32,
            amount: sts.bigint(),
        })
    ),
}

export const burned =  {
    name: 'ForeignAssets.Burned',
    /**
     * Some assets were destroyed.
     */
    v9430: new EventType(
        'ForeignAssets.Burned',
        sts.struct({
            assetId: v9430.V3MultiLocation,
            owner: v9430.AccountId32,
            balance: sts.bigint(),
        })
    ),
    /**
     * Some assets were destroyed.
     */
    v1002000: new EventType(
        'ForeignAssets.Burned',
        sts.struct({
            assetId: v1002000.V3MultiLocation,
            owner: v1002000.AccountId32,
            balance: sts.bigint(),
        })
    ),
    /**
     * Some assets were destroyed.
     */
    v1003004: new EventType(
        'ForeignAssets.Burned',
        sts.struct({
            assetId: v1003004.V4Location,
            owner: v1003004.AccountId32,
            balance: sts.bigint(),
        })
    ),
}
