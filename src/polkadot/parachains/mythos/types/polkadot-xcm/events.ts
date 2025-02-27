import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1000 from '../v1000'

export const sent =  {
    name: 'PolkadotXcm.Sent',
    /**
     * A XCM message was sent.
     */
    v1000: new EventType(
        'PolkadotXcm.Sent',
        sts.struct({
            origin: v1000.V4Location,
            destination: v1000.V4Location,
            message: sts.array(() => v1000.V4Instruction),
            messageId: sts.bytes(),
        })
    ),
}
