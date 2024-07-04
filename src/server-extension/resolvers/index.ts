import "reflect-metadata";
import { Field, ObjectType, Query, Resolver } from "type-graphql";
import type { EntityManager } from "typeorm";

@ObjectType()
export class ElapseResult {
  @Field(() => Number, { nullable: false })
  elapse!: number;
}

@Resolver()
export class TransferElapseResolver {
  constructor(private tx: () => Promise<EntityManager>) {}

  @Query(() => ElapseResult)
  async toPolkadotElapse(): Promise<ElapseResult> {
    const manager = await this.tx();

    const query = `with to_polkadot_elapse as
    (
        select transfer_status_to_polkadot.timestamp as ts1, message_processed_on_polkadot.timestamp as ts2 
        from transfer_status_to_polkadot join message_processed_on_polkadot 
        on transfer_status_to_polkadot.message_id = message_processed_on_polkadot.message_id 
    )
    SELECT EXTRACT(EPOCH FROM (select avg(ts2 - ts1) from to_polkadot_elapse)) as elapse
    `;

    const result: [ElapseResult] = await manager.query(query);
    return result[0];
  }

  @Query(() => ElapseResult)
  async toEthereumElapse(): Promise<ElapseResult> {
    const manager = await this.tx();

    const query = `with to_ethereum_elapse as
    (
        select transfer_status_to_ethereum.timestamp as ts1, inbound_message_dispatched_on_ethereum.timestamp as ts2 
        from transfer_status_to_ethereum join inbound_message_dispatched_on_ethereum 
        on transfer_status_to_ethereum.message_id = inbound_message_dispatched_on_ethereum.message_id 
    )
    SELECT EXTRACT(EPOCH FROM (select avg(ts2 - ts1) from to_ethereum_elapse)) as elapse
    `;

    const result: [ElapseResult] = await manager.query(query);
    return result[0];
  }
}
