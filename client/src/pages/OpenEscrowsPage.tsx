import { useCallback, useEffect, useState } from 'react'
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import {
  APPROVE_CANCEL_TARGET,
  ESCROW_MODULE,
  ESCROW_TYPE_PREFIX,
  PACKAGE_ID,
  REFUND_ESCROW_TARGET,
  RELEASE_ESCROW_TARGET,
  REQUEST_CANCEL_TARGET,
  TESTNET_CHAIN,
} from '../network'

type EscrowItem = {
  objectId: string
  buyer: string
  seller: string
  createdAt: string
  timeoutMs: string
  cancelRequest: boolean
  cancelApproved: boolean
  typeArg: string
}

export function OpenEscrowsPage() {
  const client = useSuiClient()
  const account = useCurrentAccount()
  const signAndExecuteTransaction = useSignAndExecuteTransaction()
  const [items, setItems] = useState<EscrowItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyObjectId, setBusyObjectId] = useState('')

  const loadEscrows = useCallback(async () => {
    if (!account) {
      setItems([])
      setError('')
      setMessage('')
      return
    }

    try {
      setLoading(true)
      setError('')
      setMessage('')

      const createdIds = new Set<string>()
      let cursor: string | null | undefined = null
      let pageCount = 0
      const MAX_PAGES = 20

      while (pageCount < MAX_PAGES) {
        const txs = await client.queryTransactionBlocks({
          filter: {
            MoveFunction: {
              package: PACKAGE_ID,
              module: ESCROW_MODULE,
              function: 'create_escrew',
            },
          },
          options: { showEffects: true },
          limit: 50,
          order: 'descending',
          cursor,
        })

        for (const tx of txs.data) {
          for (const created of tx.effects?.created ?? []) {
            createdIds.add(created.reference.objectId)
          }
        }

        if (!txs.hasNextPage || !txs.nextCursor) {
          break
        }

        cursor = txs.nextCursor
        pageCount += 1
      }

      if (createdIds.size === 0) {
        setItems([])
        return
      }

      const ids = [...createdIds]
      const objects = []

      for (let index = 0; index < ids.length; index += 50) {
        const chunk = ids.slice(index, index + 50)
        const response = await client.multiGetObjects({
          ids: chunk,
          options: {
            showType: true,
            showContent: true,
            showOwner: true,
          },
        })
        objects.push(...response)
      }

      const escrows: EscrowItem[] = objects
        .map((obj) => obj.data)
        .filter((obj): obj is NonNullable<typeof obj> => !!obj)
        .filter((obj) => obj.type?.startsWith(`${ESCROW_TYPE_PREFIX}<`) ?? false)
        .map((obj) => {
          const fields =
            obj.content && 'fields' in obj.content ? (obj.content.fields as Record<string, unknown>) : {}
          const typeArg = extractTypeArg(obj.type ?? '')
          const buyer = asString(fields.buyer, '-')
          const seller = asString(fields.seller, '-')

          return {
            objectId: obj.objectId,
            buyer,
            seller,
            createdAt: asString(fields.created_at, '0'),
            timeoutMs: asString(fields.timeout_ms, '0'),
            cancelRequest: fields.cancel_request === true || fields.cancel_request === 'true',
            cancelApproved: fields.cancel_approved === true || fields.cancel_approved === 'true',
            typeArg,
          }
        })
        .filter((item) => {
          const address = account.address.toLowerCase()
          return item.buyer.toLowerCase() === address || item.seller.toLowerCase() === address
        })
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))

      setItems(escrows)
    } catch (e) {
      const details = e instanceof Error ? e.message : String(e)
      setError(`Failed to load escrows: ${details}`)
    } finally {
      setLoading(false)
    }
  }, [account, client])

  useEffect(() => {
    void loadEscrows()
  }, [loadEscrows])

  const executeAction = useCallback(
    async (item: EscrowItem, action: 'release' | 'refund' | 'request_cancel' | 'approve_cancel') => {
      if (!account) {
        setMessage('Connect wallet first.')
        return
      }

      try {
        setBusyObjectId(item.objectId)
        setMessage('Submitting transaction...')
        setError('')

        const tx = new Transaction()
        tx.setSender(account.address)

        if (action === 'release') {
          tx.moveCall({
            target: RELEASE_ESCROW_TARGET,
            typeArguments: [item.typeArg],
            arguments: [tx.object(item.objectId)],
          })
        } else if (action === 'refund') {
          tx.moveCall({
            target: REFUND_ESCROW_TARGET,
            typeArguments: [item.typeArg],
            arguments: [tx.object(item.objectId), tx.object.clock()],
          })
        } else if (action === 'request_cancel') {
          tx.moveCall({
            target: REQUEST_CANCEL_TARGET,
            typeArguments: [item.typeArg],
            arguments: [tx.object(item.objectId)],
          })
        } else {
          tx.moveCall({
            target: APPROVE_CANCEL_TARGET,
            typeArguments: [item.typeArg],
            arguments: [tx.object(item.objectId)],
          })
        }

        const result = await signAndExecuteTransaction.mutateAsync({
          transaction: tx,
          chain: TESTNET_CHAIN,
        })

        setMessage(`Transaction succeeded. Digest: ${result.digest}`)
        await loadEscrows()
      } catch (e) {
        const details = e instanceof Error ? e.message : String(e)
        setError(`Action failed: ${details}`)
      } finally {
        setBusyObjectId('')
      }
    },
    [account, loadEscrows, signAndExecuteTransaction],
  )

  return (
    <section className="panel">
      <div className="section-head">
        <h2>Open Escrows</h2>
        <button className="secondary-btn" onClick={() => void loadEscrows()}>
          Refresh
        </button>
      </div>

      <p className="panel-copy">
        Shows open escrow objects where your connected address is the buyer or
        seller.
      </p>

      {!account && (
        <p className="notice">Connect wallet to view your open escrows.</p>
      )}

      {loading && <p className="status-text">Loading escrows...</p>}
      {error && <p className="status-text error-text">{error}</p>}
      {message && <p className="status-text">{message}</p>}

      {!loading && !error && account && items.length === 0 && (
        <p className="status-text">No open escrows found.</p>
      )}

      <div className="escrow-list">
        {items.map((item) => (
          <article className="escrow-card" key={item.objectId}>
            <p><strong>Object:</strong> {item.objectId}</p>
            <p><strong>Buyer:</strong> {item.buyer}</p>
            <p><strong>Seller:</strong> {item.seller}</p>
            <p><strong>Created At (ms):</strong> {item.createdAt}</p>
            <p><strong>Timeout (ms):</strong> {item.timeoutMs}</p>
            <p><strong>Cancel Requested:</strong> {String(item.cancelRequest)}</p>
            <p><strong>Cancel Approved:</strong> {String(item.cancelApproved)}</p>
            <div className="escrow-actions">
              {account && account.address.toLowerCase() === item.buyer.toLowerCase() && (
                <>
                  <button
                    className="primary-btn"
                    onClick={() => void executeAction(item, 'release')}
                    disabled={busyObjectId === item.objectId || signAndExecuteTransaction.isPending}
                  >
                    Release
                  </button>
                  {!item.cancelRequest && (
                    <button
                      className="secondary-btn"
                      onClick={() => void executeAction(item, 'request_cancel')}
                      disabled={busyObjectId === item.objectId || signAndExecuteTransaction.isPending}
                    >
                      Request Cancel
                    </button>
                  )}
                  {item.cancelRequest && !item.cancelApproved && (
                    <p className="status-text">Cancellation requested. Waiting for seller approval.</p>
                  )}
                  <button
                    className="secondary-btn"
                    onClick={() => void executeAction(item, 'refund')}
                    disabled={busyObjectId === item.objectId || signAndExecuteTransaction.isPending}
                  >
                    Refund
                  </button>
                </>
              )}
              {account && account.address.toLowerCase() === item.seller.toLowerCase() && (
                <>
                  {item.cancelRequest && !item.cancelApproved && (
                    <button
                      className="secondary-btn"
                      onClick={() => void executeAction(item, 'approve_cancel')}
                      disabled={busyObjectId === item.objectId || signAndExecuteTransaction.isPending}
                    >
                      Approve Cancel
                    </button>
                  )}
                  {item.cancelRequest && (
                    <button
                      className="secondary-btn"
                      onClick={() => void executeAction(item, 'refund')}
                      disabled={busyObjectId === item.objectId || signAndExecuteTransaction.isPending}
                    >
                      Refund
                    </button>
                  )}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function extractTypeArg(typeTag: string) {
  const start = typeTag.indexOf('<')
  const end = typeTag.lastIndexOf('>')
  if (start === -1 || end === -1 || end <= start + 1) {
    throw new Error(`Unexpected escrow type: ${typeTag}`)
  }

  return typeTag.slice(start + 1, end).trim()
}

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}
