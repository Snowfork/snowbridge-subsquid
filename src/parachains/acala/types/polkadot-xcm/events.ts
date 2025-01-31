import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v2000 from '../v2000'
import * as v2032 from '../v2032'
import * as v2180 from '../v2180'
import * as v2200 from '../v2200'
import * as v2240 from '../v2240'
import * as v2250 from '../v2250'

export const sent =  {
    name: 'PolkadotXcm.Sent',
    /**
     * A XCM message was sent.
     * 
     * \[ origin, destination, message \]
     */
    v2000: new EventType(
        'PolkadotXcm.Sent',
        sts.tuple([v2000.V1MultiLocation, v2000.V1MultiLocation, sts.array(() => v2000.V2Instruction)])
    ),
    /**
     * A XCM message was sent.
     * 
     * \[ origin, destination, message \]
     */
    v2032: new EventType(
        'PolkadotXcm.Sent',
        sts.tuple([v2032.V1MultiLocation, v2032.V1MultiLocation, sts.array(() => v2032.V2Instruction)])
    ),
    v2180: new EventType(
        'PolkadotXcm.Sent',
        sts.tuple([v2180.V3MultiLocation, v2180.V3MultiLocation, sts.array(() => v2180.V3Instruction)])
    ),
    v2200: new EventType(
        'PolkadotXcm.Sent',
        sts.struct({
            origin: v2200.V3MultiLocation,
            destination: v2200.V3MultiLocation,
            message: sts.array(() => v2200.V3Instruction),
            messageId: sts.bytes(),
        })
    ),
    v2240: new EventType(
        'PolkadotXcm.Sent',
        sts.struct({
            origin: v2240.V3MultiLocation,
            destination: v2240.V3MultiLocation,
            message: sts.array(() => v2240.V3Instruction),
            messageId: sts.bytes(),
        })
    ),
    v2250: new EventType(
        'PolkadotXcm.Sent',
        sts.struct({
            origin: v2250.V4Location,
            destination: v2250.V4Location,
            message: sts.array(() => v2250.V4Instruction),
            messageId: sts.bytes(),
        })
    ),
}
