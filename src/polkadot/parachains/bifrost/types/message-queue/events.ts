import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v10000 from '../v10000'
import * as v12001 from '../v12001'

export const processingFailed =  {
    name: 'MessageQueue.ProcessingFailed',
    /**
     * Message discarded due to an error in the `MessageProcessor` (usually a format error).
     */
    v10000: new EventType(
        'MessageQueue.ProcessingFailed',
        sts.struct({
            /**
             * The `blake2_256` hash of the message.
             */
            id: v10000.H256,
            /**
             * The queue of the message.
             */
            origin: v10000.AggregateMessageOrigin,
            /**
             * The error that occurred.
             * 
             * This error is pretty opaque. More fine-grained errors need to be emitted as events
             * by the `MessageProcessor`.
             */
            error: v10000.ProcessMessageError,
        })
    ),
    /**
     * Message discarded due to an error in the `MessageProcessor` (usually a format error).
     */
    v12001: new EventType(
        'MessageQueue.ProcessingFailed',
        sts.struct({
            /**
             * The `blake2_256` hash of the message.
             */
            id: v12001.H256,
            /**
             * The queue of the message.
             */
            origin: v12001.AggregateMessageOrigin,
            /**
             * The error that occurred.
             * 
             * This error is pretty opaque. More fine-grained errors need to be emitted as events
             * by the `MessageProcessor`.
             */
            error: v12001.ProcessMessageError,
        })
    ),
}

export const processed =  {
    name: 'MessageQueue.Processed',
    /**
     * Message is processed.
     */
    v10000: new EventType(
        'MessageQueue.Processed',
        sts.struct({
            /**
             * The `blake2_256` hash of the message.
             */
            id: v10000.H256,
            /**
             * The queue of the message.
             */
            origin: v10000.AggregateMessageOrigin,
            /**
             * How much weight was used to process the message.
             */
            weightUsed: v10000.Weight,
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
