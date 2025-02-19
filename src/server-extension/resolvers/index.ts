import "reflect-metadata";
import { Arg, Field, ObjectType, Query, Resolver } from "type-graphql";
import type { EntityManager } from "typeorm";

const AssetHubChannelId =
  "0xc173fac324158e77fb5840738a1a541f633cbec8884c6a601c567d2b376a0539";

@ObjectType()
export class ElapseResult {
  @Field(() => Number, { nullable: false })
  elapse!: number;
}

@ObjectType()
export class ChainStatus {
  @Field(() => String, { nullable: false })
  name!: string;
  @Field(() => Number, { nullable: false })
  height!: number;
}

@Resolver()
export class TransferElapseResolver {
  constructor(private tx: () => Promise<EntityManager>) {}

  @Query(() => ElapseResult)
  async toPolkadotElapse(
    @Arg("channelId", {
      nullable: true,
      defaultValue: AssetHubChannelId,
    })
    channelId: string
  ): Promise<ElapseResult> {
    const manager = await this.tx();

    const query = `with to_polkadot_elapse as
    (
        select transfer_status_to_polkadot.timestamp as ts1, message_processed_on_polkadot.timestamp as ts2 
        from transfer_status_to_polkadot join message_processed_on_polkadot 
        on transfer_status_to_polkadot.message_id = message_processed_on_polkadot.message_id
        where transfer_status_to_polkadot.channel_id = '${channelId}'
    )
    SELECT EXTRACT(EPOCH FROM (select avg(ts2 - ts1) from to_polkadot_elapse)) as elapse
    `;

    const result: [ElapseResult] = await manager.query(query);
    return result[0];
  }

  @Query(() => ElapseResult)
  async toEthereumElapse(
    @Arg("channelId", {
      nullable: true,
      defaultValue: AssetHubChannelId,
    })
    channelId: string
  ): Promise<ElapseResult> {
    const manager = await this.tx();

    const query = `with to_ethereum_elapse as
    (
        select transfer_status_to_ethereum.timestamp as ts1, inbound_message_dispatched_on_ethereum.timestamp as ts2 
        from transfer_status_to_ethereum join inbound_message_dispatched_on_ethereum 
        on transfer_status_to_ethereum.message_id = inbound_message_dispatched_on_ethereum.message_id
        where transfer_status_to_ethereum.channel_id = '${channelId}' 
    )
    SELECT EXTRACT(EPOCH FROM (select avg(ts2 - ts1) from to_ethereum_elapse)) as elapse
    `;

    const result: [ElapseResult] = await manager.query(query);
    return result[0];
  }
}

@Resolver()
export class SyncStatusResolver {
  constructor(private tx: () => Promise<EntityManager>) {}

  @Query(() => [ChainStatus])
  async latestBlocks(): Promise<ChainStatus[]> {
    const manager = await this.tx();
    let query = `select 'assethub' as name, height FROM assethub_processor.status LIMIT 1`;
    let assethub_status: [ChainStatus] = await manager.query(query);
    query = `select 'bridgehub' as name, height FROM bridgehub_processor.status LIMIT 1`;
    let bridgehub_status: [ChainStatus] = await manager.query(query);
    query = `select 'ethereum' as name, height FROM eth_processor.status LIMIT 1`;
    let ethereum_status: [ChainStatus] = await manager.query(query);
    return assethub_status.concat(bridgehub_status).concat(ethereum_status);
  }
}
