import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class TransferStatusToEthereum {
    constructor(props?: Partial<TransferStatusToEthereum>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @StringColumn_({nullable: false})
    messageId!: string

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
    tokenAddress!: string

    @Index_()
    @StringColumn_({nullable: false})
    senderAddress!: string

    @Index_()
    @IntColumn_({nullable: false})
    sourceParaId!: number

    @Index_()
    @StringColumn_({nullable: false})
    destinationAddress!: string

    @BigIntColumn_({nullable: false})
    amount!: bigint

    @Index_()
    @StringColumn_({nullable: true})
    channelId!: string | undefined | null

    @Index_()
    @IntColumn_({nullable: true})
    nonce!: number | undefined | null

    @Index_()
    @StringColumn_({nullable: false})
    status!: string

    @IntColumn_({nullable: true})
    forwardedBlockNumber!: number | undefined | null

    @IntColumn_({nullable: true})
    bridgedBlockNumber!: number | undefined | null

    @IntColumn_({nullable: true})
    destinationBlockNumber!: number | undefined | null
}
