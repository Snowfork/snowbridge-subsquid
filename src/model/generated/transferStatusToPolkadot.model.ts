import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, Index as Index_, IntColumn as IntColumn_, DateTimeColumn as DateTimeColumn_, BigIntColumn as BigIntColumn_} from "@subsquid/typeorm-store"

/**
 * Transfers from Ethereum to Polkadot
 */
@Entity_()
export class TransferStatusToPolkadot {
    constructor(props?: Partial<TransferStatusToPolkadot>) {
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
    @IntColumn_({nullable: true})
    nonce!: number | undefined | null

    @Index_()
    @StringColumn_({nullable: false})
    status!: string

    @StringColumn_({nullable: true})
    tokenAddress!: string | undefined | null

    @StringColumn_({nullable: true})
    tokenLocation!: string | undefined | null

    @StringColumn_({nullable: true})
    senderAddress!: string | undefined | null

    @IntColumn_({nullable: true})
    destinationParaId!: number | undefined | null

    @StringColumn_({nullable: true})
    destinationAddress!: string | undefined | null

    @BigIntColumn_({nullable: true})
    amount!: bigint | undefined | null

    @StringColumn_({nullable: true})
    channelId!: string | undefined | null

    @IntColumn_({nullable: true})
    forwardedBlockNumber!: number | undefined | null

    @IntColumn_({nullable: true})
    bridgedBlockNumber!: number | undefined | null

    @IntColumn_({nullable: true})
    destinationBlockNumber!: number | undefined | null
}
