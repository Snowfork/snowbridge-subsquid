import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1201 from '../v1201'
import * as v2302 from '../v2302'

export const created =  {
    name: 'Assets.Created',
    /**
     * Some asset class was created.
     */
    v1201: new EventType(
        'Assets.Created',
        sts.struct({
            assetId: sts.bigint(),
            creator: v1201.AccountId20,
            owner: v1201.AccountId20,
        })
    ),
}

export const issued =  {
    name: 'Assets.Issued',
    /**
     * Some assets were issued.
     */
    v1201: new EventType(
        'Assets.Issued',
        sts.struct({
            assetId: sts.bigint(),
            owner: v1201.AccountId20,
            totalSupply: sts.bigint(),
        })
    ),
    /**
     * Some assets were issued.
     */
    v2302: new EventType(
        'Assets.Issued',
        sts.struct({
            assetId: sts.bigint(),
            owner: v2302.AccountId20,
            amount: sts.bigint(),
        })
    ),
}

export const burned =  {
    name: 'Assets.Burned',
    /**
     * Some assets were destroyed.
     */
    v1201: new EventType(
        'Assets.Burned',
        sts.struct({
            assetId: sts.bigint(),
            owner: v1201.AccountId20,
            balance: sts.bigint(),
        })
    ),
}
