import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1016000 from '../v1016000'

export const messageAccepted =  {
    name: 'EthereumOutboundQueue.MessageAccepted',
    /**
     * Message will be committed at the end of current block. From now on, to track the
     * progress the message, use the `nonce` of `id`.
     */
    v1016000: new EventType(
        'EthereumOutboundQueue.MessageAccepted',
        sts.struct({
            /**
             * ID of the message
             */
            id: v1016000.H256,
            /**
             * The nonce assigned to this message
             */
            nonce: sts.bigint(),
        })
    ),
}
