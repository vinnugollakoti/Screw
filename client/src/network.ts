import { createNetworkConfig } from '@mysten/dapp-kit'
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc'

export const PACKAGE_ID =
  import.meta.env.VITE_SUI_PACKAGE_ID ??
  '0x49e7a4ce00573e53b6f1105bb0e15adc1a4c4e96d076915cf534fe143d8be781'
export const ESCROW_MODULE = 'simple_escrew'
export const ESCROW_STRUCT = 'Escrew'

export const { networkConfig } = createNetworkConfig({
  testnet: {
    url: getJsonRpcFullnodeUrl('testnet'),
    network: 'testnet',
  },
})

export const TESTNET_CHAIN = 'sui:testnet'
export const ESCROW_TARGET = `${PACKAGE_ID}::${ESCROW_MODULE}::create_escrew`
export const RELEASE_ESCROW_TARGET = `${PACKAGE_ID}::${ESCROW_MODULE}::release_escrew`
export const REFUND_ESCROW_TARGET = `${PACKAGE_ID}::${ESCROW_MODULE}::refund`
export const REQUEST_CANCEL_TARGET = `${PACKAGE_ID}::${ESCROW_MODULE}::request_cancel`
export const APPROVE_CANCEL_TARGET = `${PACKAGE_ID}::${ESCROW_MODULE}::approve_cancel`
export const ESCROW_TYPE_PREFIX = `${PACKAGE_ID}::${ESCROW_MODULE}::${ESCROW_STRUCT}`
