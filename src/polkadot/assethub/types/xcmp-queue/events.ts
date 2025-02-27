import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v601 from '../v601'
import * as v9270 from '../v9270'

export const xcmpMessageSent =  {
    name: 'XcmpQueue.XcmpMessageSent',
    /**
     * An HRMP message was sent to a sibling parachain.
     */
    v601: new EventType(
        'XcmpQueue.XcmpMessageSent',
        sts.option(() => v601.H256)
    ),
    /**
     * An HRMP message was sent to a sibling parachain.
     */
    v9270: new EventType(
        'XcmpQueue.XcmpMessageSent',
        sts.struct({
            messageHash: sts.option(() => v9270.H256),
        })
    ),
    /**
     * An HRMP message was sent to a sibling parachain.
     */
    v1000000: new EventType(
        'XcmpQueue.XcmpMessageSent',
        sts.struct({
            messageHash: sts.bytes(),
        })
    ),
}
