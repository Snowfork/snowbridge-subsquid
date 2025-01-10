import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_} from "@subsquid/typeorm-store"

/**
 * Inbound message received on BridgeHub
 */
@Entity_()
export class InboundMessageReceivedOnBridgeHub {
    constructor(props?: Partial<InboundMessageReceivedOnBridgeHub>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @IntColumn_({nullable: false})
    blockNumber!: number

    @Index_()
    @DateTimeColumn_({nullable: false})
    timestamp!: Date

    @Index_()
    @StringColumn_({nullable: false})
    messageId!: string

    @Index_()
    @StringColumn_({nullable: false})
    channelId!: string

    @Index_()
    @IntColumn_({nullable: false})
    nonce!: number
}
