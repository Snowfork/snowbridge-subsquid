import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1003000 from '../v1003000'
import * as v1005000 from '../v1005000'
import * as v1016000 from '../v1016000'
import * as v1016005 from '../v1016005'

export const created =  {
    name: 'ForeignAssets.Created',
    /**
     * Some asset class was created.
     */
    v1003000: new EventType(
        'ForeignAssets.Created',
        sts.struct({
            assetId: v1003000.V3MultiLocation,
            creator: v1003000.AccountId32,
            owner: v1003000.AccountId32,
        })
    ),
    /**
     * Some asset class was created.
     */
    v1005000: new EventType(
        'ForeignAssets.Created',
        sts.struct({
            assetId: v1005000.V3MultiLocation,
            creator: v1005000.AccountId32,
            owner: v1005000.AccountId32,
        })
    ),
    /**
     * Some asset class was created.
     */
    v1016000: new EventType(
        'ForeignAssets.Created',
        sts.struct({
            assetId: v1016000.V4Location,
            creator: v1016000.AccountId32,
            owner: v1016000.AccountId32,
        })
    ),
    /**
     * Some asset class was created.
     */
    v1016005: new EventType(
        'ForeignAssets.Created',
        sts.struct({
            assetId: v1016005.V5Location,
            creator: v1016005.AccountId32,
            owner: v1016005.AccountId32,
        })
    ),
}

export const issued =  {
    name: 'ForeignAssets.Issued',
    /**
     * Some assets were issued.
     */
    v1003000: new EventType(
        'ForeignAssets.Issued',
        sts.struct({
            assetId: v1003000.V3MultiLocation,
            owner: v1003000.AccountId32,
            amount: sts.bigint(),
        })
    ),
    /**
     * Some assets were issued.
     */
    v1005000: new EventType(
        'ForeignAssets.Issued',
        sts.struct({
            assetId: v1005000.V3MultiLocation,
            owner: v1005000.AccountId32,
            amount: sts.bigint(),
        })
    ),
    /**
     * Some assets were issued.
     */
    v1016000: new EventType(
        'ForeignAssets.Issued',
        sts.struct({
            assetId: v1016000.V4Location,
            owner: v1016000.AccountId32,
            amount: sts.bigint(),
        })
    ),
    /**
     * Some assets were issued.
     */
    v1016005: new EventType(
        'ForeignAssets.Issued',
        sts.struct({
            assetId: v1016005.V5Location,
            owner: v1016005.AccountId32,
            amount: sts.bigint(),
        })
    ),
}

export const burned =  {
    name: 'ForeignAssets.Burned',
    /**
     * Some assets were destroyed.
     */
    v1003000: new EventType(
        'ForeignAssets.Burned',
        sts.struct({
            assetId: v1003000.V3MultiLocation,
            owner: v1003000.AccountId32,
            balance: sts.bigint(),
        })
    ),
    /**
     * Some assets were destroyed.
     */
    v1005000: new EventType(
        'ForeignAssets.Burned',
        sts.struct({
            assetId: v1005000.V3MultiLocation,
            owner: v1005000.AccountId32,
            balance: sts.bigint(),
        })
    ),
    /**
     * Some assets were destroyed.
     */
    v1016000: new EventType(
        'ForeignAssets.Burned',
        sts.struct({
            assetId: v1016000.V4Location,
            owner: v1016000.AccountId32,
            balance: sts.bigint(),
        })
    ),
    /**
     * Some assets were destroyed.
     */
    v1016005: new EventType(
        'ForeignAssets.Burned',
        sts.struct({
            assetId: v1016005.V5Location,
            owner: v1016005.AccountId32,
            balance: sts.bigint(),
        })
    ),
}
