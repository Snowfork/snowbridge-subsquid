import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, Index as Index_, DateTimeColumn as DateTimeColumn_, StringColumn as StringColumn_, BooleanColumn as BooleanColumn_} from "@subsquid/typeorm-store"

/**
 * Message processed on polkadot chains
 */
@Entity_()
export class MessageProcessedOnPolkadot {
    constructor(props?: Partial<MessageProcessedOnPolkadot>) {
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

    @IntColumn_({nullable: true})
    paraId!: number | undefined | null

    @BooleanColumn_({nullable: true})
    success!: boolean | undefined | null
}
