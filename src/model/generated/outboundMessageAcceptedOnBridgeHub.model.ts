import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_} from "@subsquid/typeorm-store"

/**
 * Outbound message sent on BridgeHub
 */
@Entity_()
export class OutboundMessageAcceptedOnBridgeHub {
    constructor(props?: Partial<OutboundMessageAcceptedOnBridgeHub>) {
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
    @StringColumn_({nullable: true})
    channelId!: string | undefined | null

    @Index_()
    @IntColumn_({nullable: false})
    nonce!: number

    @StringColumn_({nullable: true})
    eventId!: string | undefined | null
}
