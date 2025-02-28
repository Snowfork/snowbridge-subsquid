import {sts, Block, Bytes, Option, Result, EventType, RuntimeCtx} from '../support'
import * as v1016000 from '../v1016000'

export const messageReceived =  {
    name: 'EthereumInboundQueue.MessageReceived',
    /**
     * A message was received from Ethereum
     */
    v1016000: new EventType(
        'EthereumInboundQueue.MessageReceived',
        sts.struct({
            /**
             * The message channel
             */
            channelId: v1016000.ChannelId,
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
