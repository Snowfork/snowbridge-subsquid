import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v115 from '../v115'

export const withdrawn =  {
    name: 'Tokens.Withdrawn',
    /**
     * Some balances were withdrawn (e.g. pay for transaction fee)
     */
    v115: new EventType(
        'Tokens.Withdrawn',
        sts.struct({
            currencyId: sts.number(),
            who: v115.AccountId32,
            amount: sts.bigint(),
        })
    ),
}

export const deposited =  {
    name: 'Tokens.Deposited',
    /**
     * Deposited some balance into an account
     */
    v115: new EventType(
        'Tokens.Deposited',
        sts.struct({
            currencyId: sts.number(),
            who: v115.AccountId32,
            amount: sts.bigint(),
        })
    ),
}
