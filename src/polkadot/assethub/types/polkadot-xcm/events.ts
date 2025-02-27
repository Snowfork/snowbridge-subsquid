import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v601 from '../v601'
import * as v700 from '../v700'
import * as v9370 from '../v9370'
import * as v9420 from '../v9420'
import * as v1000000 from '../v1000000'
import * as v1002000 from '../v1002000'

export const sent =  {
    name: 'PolkadotXcm.Sent',
    /**
     * A XCM message was sent.
     * 
     * \[ origin, destination, message \]
     */
    v601: new EventType(
        'PolkadotXcm.Sent',
        sts.tuple([v601.V1MultiLocation, v601.V1MultiLocation, sts.array(() => v601.V2Instruction)])
    ),
    /**
     * A XCM message was sent.
     * 
     * \[ origin, destination, message \]
     */
    v700: new EventType(
        'PolkadotXcm.Sent',
        sts.tuple([v700.V1MultiLocation, v700.V1MultiLocation, sts.array(() => v700.V2Instruction)])
    ),
    /**
     * A XCM message was sent.
     * 
     * \[ origin, destination, message \]
     */
    v9370: new EventType(
        'PolkadotXcm.Sent',
        sts.tuple([v9370.V1MultiLocation, v9370.V1MultiLocation, sts.array(() => v9370.V2Instruction)])
    ),
    /**
     * A XCM message was sent.
     * 
     * \[ origin, destination, message \]
     */
    v9420: new EventType(
        'PolkadotXcm.Sent',
        sts.tuple([v9420.V3MultiLocation, v9420.V3MultiLocation, sts.array(() => v9420.V3Instruction)])
    ),
    /**
     * A XCM message was sent.
     */
    v1000000: new EventType(
        'PolkadotXcm.Sent',
        sts.struct({
            origin: v1000000.V3MultiLocation,
            destination: v1000000.V3MultiLocation,
            message: sts.array(() => v1000000.V3Instruction),
            messageId: sts.bytes(),
        })
    ),
    /**
     * A XCM message was sent.
     */
    v1002000: new EventType(
        'PolkadotXcm.Sent',
        sts.struct({
            origin: v1002000.V4Location,
            destination: v1002000.V4Location,
            message: sts.array(() => v1002000.V4Instruction),
            messageId: sts.bytes(),
        })
    ),
}
