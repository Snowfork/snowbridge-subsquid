import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v9382 from '../v9382'

export const transfer =  {
    name: 'Balances.Transfer',
    /**
     * Transfer succeeded.
     */
    v9382: new EventType(
        'Balances.Transfer',
        sts.struct({
            from: v9382.AccountId32,
            to: v9382.AccountId32,
            amount: sts.bigint(),
        })
    ),
}
