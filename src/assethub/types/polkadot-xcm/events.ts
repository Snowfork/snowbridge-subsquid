import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1016000 from '../v1016000'
import * as v1016005 from '../v1016005'
import * as v1016006 from '../v1016006'
import * as v1017003 from '../v1017003'

export const sent =  {
    name: 'PolkadotXcm.Sent',
    /**
     * A XCM message was sent.
     */
    v1016000: new EventType(
        'PolkadotXcm.Sent',
        sts.struct({
            origin: v1016000.V4Location,
            destination: v1016000.V4Location,
            message: sts.array(() => v1016000.V4Instruction),
            messageId: sts.bytes(),
        })
    ),
    /**
     * A XCM message was sent.
     */
    v1016005: new EventType(
        'PolkadotXcm.Sent',
        sts.struct({
            origin: v1016005.V5Location,
            destination: v1016005.V5Location,
            message: sts.array(() => v1016005.V5Instruction),
            messageId: sts.bytes(),
        })
    ),
    /**
     * A XCM message was sent.
     */
    v1016006: new EventType(
        'PolkadotXcm.Sent',
        sts.struct({
            origin: v1016006.V5Location,
            destination: v1016006.V5Location,
            message: sts.array(() => v1016006.V5Instruction),
            messageId: sts.bytes(),
        })
    ),
    /**
     * A XCM message was sent.
     */
    v1017003: new EventType(
        'PolkadotXcm.Sent',
        sts.struct({
            origin: v1017003.V5Location,
            destination: v1017003.V5Location,
            message: sts.array(() => v1017003.V5Instruction),
            messageId: sts.bytes(),
        })
    ),
}
