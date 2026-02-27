import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { SUI_TYPE_ARG } from '@mysten/sui/utils'
import {
  ESCROW_MODULE,
  ESCROW_TARGET,
  PACKAGE_ID,
  TESTNET_CHAIN,
} from '../network'

const MS_PER_HOUR = 60 * 60 * 1000

export function CreateEscrowPage() {
  const client = useSuiClient()
  const account = useCurrentAccount()
  const [seller, setSeller] = useState('')
  const [amountSui, setAmountSui] = useState('')
  const [timeoutHours, setTimeoutHours] = useState('24')
  const [message, setMessage] = useState('')

  const signAndExecuteTransaction = useSignAndExecuteTransaction()

  const canSubmit = useMemo(() => {
    return (
      !!account &&
      seller.trim().startsWith('0x') &&
      Number(amountSui) > 0 &&
      Number(timeoutHours) > 0 &&
      !signAndExecuteTransaction.isPending
    )
  }, [account, seller, amountSui, timeoutHours, signAndExecuteTransaction.isPending])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!account) {
      setMessage('Connect wallet first.')
      return
    }

    try {
      setMessage('Submitting transaction...')
      await client.getNormalizedMoveFunction({
        package: PACKAGE_ID,
        module: ESCROW_MODULE,
        function: 'create_escrew',
      })

      const amountMist = toMist(amountSui)
      const timeoutMs = BigInt(Math.floor(Number(timeoutHours) * MS_PER_HOUR))

      const tx = new Transaction()
      tx.setSender(account.address)
      const [escrowCoin] = tx.splitCoins(tx.gas, [amountMist])

      tx.moveCall({
        target: ESCROW_TARGET,
        typeArguments: [SUI_TYPE_ARG],
        arguments: [
          tx.pure.address(seller.trim()),
          escrowCoin,
          tx.object.clock(),
          tx.pure.u64(timeoutMs),
        ],
      })

      const result = await signAndExecuteTransaction.mutateAsync({
        transaction: tx,
        chain: TESTNET_CHAIN,
      })

      setMessage(`Escrow created. Digest: ${result.digest}`)
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error)
      setMessage(`Failed to create escrow: ${details}`)
    }
  }

  return (
    <section className="panel">
      <h2>Create Escrow</h2>
      <p className="panel-copy">
        This form currently creates escrow with <strong>SUI</strong> as the coin
        type on <strong>testnet</strong>.
      </p>

      {!account && (
        <p className="notice">Connect your wallet from the top right to continue.</p>
      )}

      <form className="escrow-form" onSubmit={onSubmit}>
        <label>
          Seller Address
          <input
            type="text"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            placeholder="0x..."
            required
          />
        </label>

        <label>
          Amount (SUI)
          <input
            type="number"
            min="0"
            step="0.000001"
            value={amountSui}
            onChange={(e) => setAmountSui(e.target.value)}
            placeholder="1"
            required
          />
        </label>

        <label>
          Timeout (hours)
          <input
            type="number"
            min="1"
            step="1"
            value={timeoutHours}
            onChange={(e) => setTimeoutHours(e.target.value)}
            required
          />
        </label>

        <button className="primary-btn" type="submit" disabled={!canSubmit}>
          {signAndExecuteTransaction.isPending ? 'Creating...' : 'Create Escrow'}
        </button>
      </form>

      {message && <p className="status-text">{message}</p>}
    </section>
  )
}

function toMist(suiAmount: string) {
  const value = Number(suiAmount)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  return BigInt(Math.floor(value * 1_000_000_000))
}
