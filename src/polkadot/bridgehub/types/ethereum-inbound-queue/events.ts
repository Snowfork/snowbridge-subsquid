import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1002000 from '../v1002000'

export const messageReceived =  {
    name: 'EthereumInboundQueue.MessageReceived',
    /**
     * A message was received from Ethereum
     */
    v1002000: new EventType(
        'EthereumInboundQueue.MessageReceived',
        sts.struct({
            /**
             * The message channel
             */
            channelId: v1002000.ChannelId,
            /**
             * The message nonce
             */
            nonce: sts.bigint(),
            /**
             * ID of the XCM message which was forwarded to the final destination parachain
             */
            messageId: sts.bytes(),
            /**
             * Fee burned for the teleport
             */
            feeBurned: sts.bigint(),
        })
    ),
}
