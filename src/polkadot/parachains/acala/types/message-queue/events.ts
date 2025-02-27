import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v2240 from '../v2240'
import * as v2270 from '../v2270'

export const processingFailed =  {
    name: 'MessageQueue.ProcessingFailed',
    v2240: new EventType(
        'MessageQueue.ProcessingFailed',
        sts.struct({
            id: v2240.H256,
            origin: v2240.AggregateMessageOrigin,
            error: v2240.ProcessMessageError,
        })
    ),
    v2270: new EventType(
        'MessageQueue.ProcessingFailed',
        sts.struct({
            id: v2270.H256,
            origin: v2270.AggregateMessageOrigin,
            error: v2270.ProcessMessageError,
        })
    ),
}

export const processed =  {
    name: 'MessageQueue.Processed',
    v2240: new EventType(
        'MessageQueue.Processed',
        sts.struct({
            id: v2240.H256,
            origin: v2240.AggregateMessageOrigin,
            weightUsed: v2240.Weight,
            success: sts.boolean(),
        })
    ),
}
