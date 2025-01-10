import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, BooleanColumn as BooleanColumn_} from "@subsquid/typeorm-store"

/**
 * Inbound message dispatched on Ethereum
 */
@Entity_()
export class InboundMessageDispatchedOnEthereum {
    constructor(props?: Partial<InboundMessageDispatchedOnEthereum>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    txHash!: string

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

    @Index_()
    @BooleanColumn_({nullable: false})
    success!: boolean
}
