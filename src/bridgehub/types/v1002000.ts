import {sts, Result, Option, Bytes, BitSequence} from './support'

export const Weight: sts.Type<Weight> = sts.struct(() => {
    return  {
        refTime: sts.bigint(),
        proofSize: sts.bigint(),
    }
})

export interface Weight {
    refTime: bigint
    proofSize: bigint
}

export const ProcessMessageError: sts.Type<ProcessMessageError> = sts.closedEnum(() => {
    return  {
        BadFormat: sts.unit(),
        Corrupt: sts.unit(),
        Overweight: Weight,
        Unsupported: sts.unit(),
        Yield: sts.unit(),
    }
})

export type ProcessMessageError = ProcessMessageError_BadFormat | ProcessMessageError_Corrupt | ProcessMessageError_Overweight | ProcessMessageError_Unsupported | ProcessMessageError_Yield

export interface ProcessMessageError_BadFormat {
    __kind: 'BadFormat'
}

export interface ProcessMessageError_Corrupt {
    __kind: 'Corrupt'
}

export interface ProcessMessageError_Overweight {
    __kind: 'Overweight'
    value: Weight
}

export interface ProcessMessageError_Unsupported {
    __kind: 'Unsupported'
}

export interface ProcessMessageError_Yield {
    __kind: 'Yield'
}

export const AggregateMessageOrigin: sts.Type<AggregateMessageOrigin> = sts.closedEnum(() => {
    return  {
        Here: sts.unit(),
        Parent: sts.unit(),
        Sibling: Id,
        Snowbridge: ChannelId,
    }
})

export const Id = sts.number()

export type AggregateMessageOrigin = AggregateMessageOrigin_Here | AggregateMessageOrigin_Parent | AggregateMessageOrigin_Sibling | AggregateMessageOrigin_Snowbridge

export interface AggregateMessageOrigin_Here {
    __kind: 'Here'
}

export interface AggregateMessageOrigin_Parent {
    __kind: 'Parent'
}

export interface AggregateMessageOrigin_Sibling {
    __kind: 'Sibling'
    value: Id
}

export interface AggregateMessageOrigin_Snowbridge {
    __kind: 'Snowbridge'
    value: ChannelId
}

export type ChannelId = Bytes

export type Id = number

export const H256 = sts.bytes()

export const ChannelId = sts.bytes()
