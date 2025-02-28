import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    AgentCreated: event("0x7c96960a1ebd8cc753b10836ea25bd7c9c4f8cd43590db1e8b3648cb0ec4cc89", "AgentCreated(bytes32,address)", {"agentID": p.bytes32, "agent": p.address}),
    AgentFundsWithdrawn: event("0xf953871855f78d5ccdd6268f2d9d69fc67f26542a35d2bba1c615521aed57054", "AgentFundsWithdrawn(bytes32,address,uint256)", {"agentID": indexed(p.bytes32), "recipient": indexed(p.address), "amount": p.uint256}),
    ChannelCreated: event("0xe7e6b36c9bc4c7817d3879c45d6ce1edd3c61b1966c488f1817697bb0b704525", "ChannelCreated(bytes32)", {"channelID": indexed(p.bytes32)}),
    ChannelUpdated: event("0x66e174b5e03ba247add8660a34e70bdd484239fe794c2567772e8e93a5c1696b", "ChannelUpdated(bytes32)", {"channelID": indexed(p.bytes32)}),
    InboundMessageDispatched: event("0x617fdb0cb78f01551a192a3673208ec5eb09f20a90acf673c63a0dcb11745a7a", "InboundMessageDispatched(bytes32,uint64,bytes32,bool)", {"channelID": indexed(p.bytes32), "nonce": p.uint64, "messageID": indexed(p.bytes32), "success": p.bool}),
    OperatingModeChanged: event("0x4016a1377b8961c4aa6f3a2d3de830a685ddbfe0f228ffc0208eb96304c4cf1a", "OperatingModeChanged(uint8)", {"mode": p.uint8}),
    OutboundMessageAccepted: event("0x7153f9357c8ea496bba60bf82e67143e27b64462b49041f8e689e1b05728f84f", "OutboundMessageAccepted(bytes32,uint64,bytes32,bytes)", {"channelID": indexed(p.bytes32), "nonce": p.uint64, "messageID": indexed(p.bytes32), "payload": p.bytes}),
    PricingParametersChanged: event("0x5e3c25378b5946068b94aa2ea10c4c1e215cc975f994322b159ddc9237a973d4", "PricingParametersChanged()", {}),
    TokenRegistrationSent: event("0xf78bb28d4b1d7da699e5c0bc2be29c2b04b5aab6aacf6298fe5304f9db9c6d7e", "TokenRegistrationSent(address)", {"token": p.address}),
    TokenSent: event("0x24c5d2de620c6e25186ae16f6919eba93b6e2c1a33857cc419d9f3a00d6967e9", "TokenSent(address,address,uint32,(uint8,bytes),uint128)", {"token": indexed(p.address), "sender": indexed(p.address), "destinationChain": indexed(p.uint32), "destinationAddress": p.struct({"kind": p.uint8, "data": p.bytes}), "amount": p.uint128}),
    TokenTransferFeesChanged: event("0x4793c0cb5bef4b1fdbbfbcf17e06991844eb881088b012442af17a12ff38d5cd", "TokenTransferFeesChanged()", {}),
    Upgraded: event("0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b", "Upgraded(address)", {"implementation": indexed(p.address)}),
}

export const functions = {
    AGENT_EXECUTOR: viewFun("0x423e69b6", "AGENT_EXECUTOR()", {}, p.address),
    BEEFY_CLIENT: viewFun("0x90ffc4f9", "BEEFY_CLIENT()", {}, p.address),
    agentExecute: fun("0x35ede969", "agentExecute(bytes)", {"data": p.bytes}, ),
    agentOf: viewFun("0x5e6dae26", "agentOf(bytes32)", {"agentID": p.bytes32}, p.address),
    channelNoncesOf: viewFun("0x2a6c3229", "channelNoncesOf(bytes32)", {"channelID": p.bytes32}, {"_0": p.uint64, "_1": p.uint64}),
    channelOperatingModeOf: viewFun("0x0705f465", "channelOperatingModeOf(bytes32)", {"channelID": p.bytes32}, p.uint8),
    createAgent: fun("0xc3b8ec8e", "createAgent(bytes)", {"data": p.bytes}, ),
    createChannel: fun("0x17abcf60", "createChannel(bytes)", {"data": p.bytes}, ),
    dropRescueAbility: fun("0xcd5a76de", "dropRescueAbility()", {}, ),
    implementation: viewFun("0x5c60da1b", "implementation()", {}, p.address),
    initialize: fun("0x439fab91", "initialize(bytes)", {"data": p.bytes}, ),
    isTokenRegistered: viewFun("0x26aa101f", "isTokenRegistered(address)", {"token": p.address}, p.bool),
    operatingMode: viewFun("0x38004f69", "operatingMode()", {}, p.uint8),
    pricingParameters: viewFun("0x0b617646", "pricingParameters()", {}, {"_0": p.uint256, "_1": p.uint128}),
    quoteRegisterTokenFee: viewFun("0x805ce31d", "quoteRegisterTokenFee()", {}, p.uint256),
    quoteSendTokenFee: viewFun("0x928bc49d", "quoteSendTokenFee(address,uint32,uint128)", {"token": p.address, "destinationChain": p.uint32, "destinationFee": p.uint128}, p.uint256),
    registerToken: fun("0x09824a80", "registerToken(address)", {"token": p.address}, ),
    rescue: fun("0x3c9c3b45", "rescue(address,bytes32,bytes)", {"impl": p.address, "implCodeHash": p.bytes32, "initializerParams": p.bytes}, ),
    rescueOperator: viewFun("0xeac09209", "rescueOperator()", {}, p.address),
    sendToken: fun("0x52054834", "sendToken(address,uint32,(uint8,bytes),uint128,uint128)", {"token": p.address, "destinationChain": p.uint32, "destinationAddress": p.struct({"kind": p.uint8, "data": p.bytes}), "destinationFee": p.uint128, "amount": p.uint128}, ),
    setOperatingMode: fun("0x8257f3d5", "setOperatingMode(bytes)", {"data": p.bytes}, ),
    setPricingParameters: fun("0x0c86ea46", "setPricingParameters(bytes)", {"data": p.bytes}, ),
    setTokenTransferFees: fun("0x5b2e9c4c", "setTokenTransferFees(bytes)", {"data": p.bytes}, ),
    submitV1: fun("0xdf4ed829", "submitV1((bytes32,uint64,uint8,bytes,uint64,uint256,uint256,bytes32),bytes32[],((bytes32,uint256,bytes32,bytes32,(uint256,bytes4,bytes)[]),(uint256,uint256,bytes32[]),(uint8,uint32,bytes32,uint64,uint32,bytes32),bytes32[],uint256))", {"message": p.struct({"channelID": p.bytes32, "nonce": p.uint64, "command": p.uint8, "params": p.bytes, "maxDispatchGas": p.uint64, "maxFeePerGas": p.uint256, "reward": p.uint256, "id": p.bytes32}), "leafProof": p.array(p.bytes32), "headerProof": p.struct({"header": p.struct({"parentHash": p.bytes32, "number": p.uint256, "stateRoot": p.bytes32, "extrinsicsRoot": p.bytes32, "digestItems": p.array(p.struct({"kind": p.uint256, "consensusEngineID": p.bytes4, "data": p.bytes}))}), "headProof": p.struct({"pos": p.uint256, "width": p.uint256, "proof": p.array(p.bytes32)}), "leafPartial": p.struct({"version": p.uint8, "parentNumber": p.uint32, "parentHash": p.bytes32, "nextAuthoritySetID": p.uint64, "nextAuthoritySetLen": p.uint32, "nextAuthoritySetRoot": p.bytes32}), "leafProof": p.array(p.bytes32), "leafProofOrder": p.uint256})}, ),
    transferNativeFromAgent: fun("0x9a870c8b", "transferNativeFromAgent(bytes)", {"data": p.bytes}, ),
    updateChannel: fun("0xafce33c4", "updateChannel(bytes)", {"data": p.bytes}, ),
    upgrade: fun("0x25394645", "upgrade(bytes)", {"data": p.bytes}, ),
}

export class Contract extends ContractBase {

    AGENT_EXECUTOR() {
        return this.eth_call(functions.AGENT_EXECUTOR, {})
    }

    BEEFY_CLIENT() {
        return this.eth_call(functions.BEEFY_CLIENT, {})
    }

    agentOf(agentID: AgentOfParams["agentID"]) {
        return this.eth_call(functions.agentOf, {agentID})
    }

    channelNoncesOf(channelID: ChannelNoncesOfParams["channelID"]) {
        return this.eth_call(functions.channelNoncesOf, {channelID})
    }

    channelOperatingModeOf(channelID: ChannelOperatingModeOfParams["channelID"]) {
        return this.eth_call(functions.channelOperatingModeOf, {channelID})
    }

    implementation() {
        return this.eth_call(functions.implementation, {})
    }

    isTokenRegistered(token: IsTokenRegisteredParams["token"]) {
        return this.eth_call(functions.isTokenRegistered, {token})
    }

    operatingMode() {
        return this.eth_call(functions.operatingMode, {})
    }

    pricingParameters() {
        return this.eth_call(functions.pricingParameters, {})
    }

    quoteRegisterTokenFee() {
        return this.eth_call(functions.quoteRegisterTokenFee, {})
    }

    quoteSendTokenFee(token: QuoteSendTokenFeeParams["token"], destinationChain: QuoteSendTokenFeeParams["destinationChain"], destinationFee: QuoteSendTokenFeeParams["destinationFee"]) {
        return this.eth_call(functions.quoteSendTokenFee, {token, destinationChain, destinationFee})
    }

    rescueOperator() {
        return this.eth_call(functions.rescueOperator, {})
    }
}

/// Event types
export type AgentCreatedEventArgs = EParams<typeof events.AgentCreated>
export type AgentFundsWithdrawnEventArgs = EParams<typeof events.AgentFundsWithdrawn>
export type ChannelCreatedEventArgs = EParams<typeof events.ChannelCreated>
export type ChannelUpdatedEventArgs = EParams<typeof events.ChannelUpdated>
export type InboundMessageDispatchedEventArgs = EParams<typeof events.InboundMessageDispatched>
export type OperatingModeChangedEventArgs = EParams<typeof events.OperatingModeChanged>
export type OutboundMessageAcceptedEventArgs = EParams<typeof events.OutboundMessageAccepted>
export type PricingParametersChangedEventArgs = EParams<typeof events.PricingParametersChanged>
export type TokenRegistrationSentEventArgs = EParams<typeof events.TokenRegistrationSent>
export type TokenSentEventArgs = EParams<typeof events.TokenSent>
export type TokenTransferFeesChangedEventArgs = EParams<typeof events.TokenTransferFeesChanged>
export type UpgradedEventArgs = EParams<typeof events.Upgraded>

/// Function types
export type AGENT_EXECUTORParams = FunctionArguments<typeof functions.AGENT_EXECUTOR>
export type AGENT_EXECUTORReturn = FunctionReturn<typeof functions.AGENT_EXECUTOR>

export type BEEFY_CLIENTParams = FunctionArguments<typeof functions.BEEFY_CLIENT>
export type BEEFY_CLIENTReturn = FunctionReturn<typeof functions.BEEFY_CLIENT>

export type AgentExecuteParams = FunctionArguments<typeof functions.agentExecute>
export type AgentExecuteReturn = FunctionReturn<typeof functions.agentExecute>

export type AgentOfParams = FunctionArguments<typeof functions.agentOf>
export type AgentOfReturn = FunctionReturn<typeof functions.agentOf>

export type ChannelNoncesOfParams = FunctionArguments<typeof functions.channelNoncesOf>
export type ChannelNoncesOfReturn = FunctionReturn<typeof functions.channelNoncesOf>

export type ChannelOperatingModeOfParams = FunctionArguments<typeof functions.channelOperatingModeOf>
export type ChannelOperatingModeOfReturn = FunctionReturn<typeof functions.channelOperatingModeOf>

export type CreateAgentParams = FunctionArguments<typeof functions.createAgent>
export type CreateAgentReturn = FunctionReturn<typeof functions.createAgent>

export type CreateChannelParams = FunctionArguments<typeof functions.createChannel>
export type CreateChannelReturn = FunctionReturn<typeof functions.createChannel>

export type DropRescueAbilityParams = FunctionArguments<typeof functions.dropRescueAbility>
export type DropRescueAbilityReturn = FunctionReturn<typeof functions.dropRescueAbility>

export type ImplementationParams = FunctionArguments<typeof functions.implementation>
export type ImplementationReturn = FunctionReturn<typeof functions.implementation>

export type InitializeParams = FunctionArguments<typeof functions.initialize>
export type InitializeReturn = FunctionReturn<typeof functions.initialize>

export type IsTokenRegisteredParams = FunctionArguments<typeof functions.isTokenRegistered>
export type IsTokenRegisteredReturn = FunctionReturn<typeof functions.isTokenRegistered>

export type OperatingModeParams = FunctionArguments<typeof functions.operatingMode>
export type OperatingModeReturn = FunctionReturn<typeof functions.operatingMode>

export type PricingParametersParams = FunctionArguments<typeof functions.pricingParameters>
export type PricingParametersReturn = FunctionReturn<typeof functions.pricingParameters>

export type QuoteRegisterTokenFeeParams = FunctionArguments<typeof functions.quoteRegisterTokenFee>
export type QuoteRegisterTokenFeeReturn = FunctionReturn<typeof functions.quoteRegisterTokenFee>

export type QuoteSendTokenFeeParams = FunctionArguments<typeof functions.quoteSendTokenFee>
export type QuoteSendTokenFeeReturn = FunctionReturn<typeof functions.quoteSendTokenFee>

export type RegisterTokenParams = FunctionArguments<typeof functions.registerToken>
export type RegisterTokenReturn = FunctionReturn<typeof functions.registerToken>

export type RescueParams = FunctionArguments<typeof functions.rescue>
export type RescueReturn = FunctionReturn<typeof functions.rescue>

export type RescueOperatorParams = FunctionArguments<typeof functions.rescueOperator>
export type RescueOperatorReturn = FunctionReturn<typeof functions.rescueOperator>

export type SendTokenParams = FunctionArguments<typeof functions.sendToken>
export type SendTokenReturn = FunctionReturn<typeof functions.sendToken>

export type SetOperatingModeParams = FunctionArguments<typeof functions.setOperatingMode>
export type SetOperatingModeReturn = FunctionReturn<typeof functions.setOperatingMode>

export type SetPricingParametersParams = FunctionArguments<typeof functions.setPricingParameters>
export type SetPricingParametersReturn = FunctionReturn<typeof functions.setPricingParameters>

export type SetTokenTransferFeesParams = FunctionArguments<typeof functions.setTokenTransferFees>
export type SetTokenTransferFeesReturn = FunctionReturn<typeof functions.setTokenTransferFees>

export type SubmitV1Params = FunctionArguments<typeof functions.submitV1>
export type SubmitV1Return = FunctionReturn<typeof functions.submitV1>

export type TransferNativeFromAgentParams = FunctionArguments<typeof functions.transferNativeFromAgent>
export type TransferNativeFromAgentReturn = FunctionReturn<typeof functions.transferNativeFromAgent>

export type UpdateChannelParams = FunctionArguments<typeof functions.updateChannel>
export type UpdateChannelReturn = FunctionReturn<typeof functions.updateChannel>

export type UpgradeParams = FunctionArguments<typeof functions.upgrade>
export type UpgradeReturn = FunctionReturn<typeof functions.upgrade>

