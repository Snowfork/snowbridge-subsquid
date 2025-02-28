import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1004000 from '../v1004000'
import * as v1006000 from '../v1006000'
import * as v1013000 from '../v1013000'

export const processingFailed =  {
    name: 'MessageQueue.ProcessingFailed',
    /**
     * Message discarded due to an error in the `MessageProcessor` (usually a format error).
     */
    v1004000: new EventType(
        'MessageQueue.ProcessingFailed',
        sts.struct({
            id: sts.bytes(),
            origin: v1004000.AggregateMessageOrigin,
            error: v1004000.ProcessMessageError,
        })
    ),
    /**
     * Message discarded due to an error in the `MessageProcessor` (usually a format error).
     */
    v1006000: new EventType(
        'MessageQueue.ProcessingFailed',
        sts.struct({
            /**
             * The `blake2_256` hash of the message.
             */
            id: v1006000.H256,
            /**
             * The queue of the message.
             */
            origin: v1006000.AggregateMessageOrigin,
            /**
             * The error that occurred.
             * 
             * This error is pretty opaque. More fine-grained errors need to be emitted as events
             * by the `MessageProcessor`.
             */
            error: v1006000.ProcessMessageError,
        })
    ),
    /**
     * Message discarded due to an error in the `MessageProcessor` (usually a format error).
     */
    v1013000: new EventType(
        'MessageQueue.ProcessingFailed',
        sts.struct({
            /**
             * The `blake2_256` hash of the message.
             */
            id: v1013000.H256,
            /**
             * The queue of the message.
             */
            origin: v1013000.AggregateMessageOrigin,
            /**
             * The error that occurred.
             * 
             * This error is pretty opaque. More fine-grained errors need to be emitted as events
             * by the `MessageProcessor`.
             */
            error: v1013000.ProcessMessageError,
        })
    ),
}

export const processed =  {
    name: 'MessageQueue.Processed',
    /**
     * Message is processed.
     */
    v1004000: new EventType(
        'MessageQueue.Processed',
        sts.struct({
            id: sts.bytes(),
            origin: v1004000.AggregateMessageOrigin,
            weightUsed: v1004000.Weight,
            success: sts.boolean(),
        })
    ),
    /**
     * Message is processed.
     */
    v1006000: new EventType(
        'MessageQueue.Processed',
        sts.struct({
            /**
             * The `blake2_256` hash of the message.
             */
            id: v1006000.H256,
            /**
             * The queue of the message.
             */
            origin: v1006000.AggregateMessageOrigin,
            /**
             * How much weight was used to process the message.
             */
            weightUsed: v1006000.Weight,
            /**
             * Whether the message was processed.
             * 
             * Note that this does not mean that the underlying `MessageProcessor` was internally
             * successful. It *solely* means that the MQ pallet will treat this as a success
             * condition and discard the message. Any internal error needs to be emitted as events
             * by the `MessageProcessor`.
             */
            success: sts.boolean(),
        })
    ),
}
