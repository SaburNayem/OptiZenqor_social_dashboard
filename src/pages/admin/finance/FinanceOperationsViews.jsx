import { extractItems } from '../../../services/apiClient'
import { DataList, FilterForm, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'

export function RevenueSnapshotView({ data, formatNumber, formatDate }) {
  return (
    <section className="stack">
      <article className="panel">
        <h3>Revenue Snapshot</h3>
        <DataList
          items={[
            ['Total revenue', data.totalRevenue],
            ['Completed transactions', data.completedTransactions],
            ['Active subscriptions', data.activeSubscriptions],
            ['Plans', data.plans?.length ?? 0],
          ]}
          formatNumber={formatNumber}
        />
      </article>
      <article className="panel">
        <h3>Recent Transactions</h3>
        <Table
          columns={['ID', 'Amount', 'Status', 'Created']}
          rows={(data.recentTransactions ?? []).map((item) => [
            item.id,
            formatNumber(item.amount),
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            formatDate(item.createdAt),
          ])}
        />
      </article>
    </section>
  )
}

export function WalletSubscriptionOperationsView({
  payload,
  filters,
  onLoadView,
  selectedWalletSubscriptionId,
  setSelectedWalletSubscriptionId,
  onUpdateWalletSubscription,
  formatDate,
  formatNumber,
}) {
  const items = extractItems(payload)
  const resolvedSelectedRecordId =
    items.some((item) => item.id === selectedWalletSubscriptionId)
      ? selectedWalletSubscriptionId
      : (items[0]?.id ?? null)
  const selectedRecord = items.find((item) => item.id === resolvedSelectedRecordId) ?? null

  return (
    <section className="stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Wallet & Subscription Activity</h3>
            <p className="panel-copy">Review finance-linked lifecycle records and apply admin status changes from one place.</p>
          </div>
          <FilterForm
            fields={[
              { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search user, label, transaction id' },
              { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'active', 'pending', 'cancelled', 'completed'] },
            ]}
            onSubmit={(query) => onLoadView('walletSubscriptions', { page: 1, limit: 20, ...query })}
          />
        </div>
        <Table
          columns={['Type', 'Label', 'User', 'Amount', 'Status', 'Created']}
          rows={items.map((item) => [
            <button type="button" className="link-button" key={`${item.id}-select`} onClick={() => setSelectedWalletSubscriptionId(item.id)}>
              {item.kind}
            </button>,
            item.label,
            item.userName ?? item.userId ?? 'N/A',
            item.amount == null ? 'N/A' : formatNumber(item.amount),
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            formatDate(item.createdAt),
          ])}
        />
        <PaginationMeta payload={payload} formatNumber={formatNumber} />
      </article>

      <article className="panel">
        <h3>Record Detail</h3>
        {selectedRecord ? (
          <dl className="detail-list">
            <div>
              <dt>Kind</dt>
              <dd>{selectedRecord.kind ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Label</dt>
              <dd>{selectedRecord.label ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>User</dt>
              <dd>{selectedRecord.userName ?? selectedRecord.userId ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedRecord.status ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{selectedRecord.amount == null ? 'N/A' : formatNumber(selectedRecord.amount)}</dd>
            </div>
            <div>
              <dt>Actions</dt>
              <dd>
                <div className="action-row">
                  <button type="button" onClick={() => onUpdateWalletSubscription(selectedRecord.id, { status: 'active' })}>
                    Activate
                  </button>
                  <button type="button" onClick={() => onUpdateWalletSubscription(selectedRecord.id, { status: 'cancelled' })}>
                    Cancel
                  </button>
                </div>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="empty-panel">Select a record to inspect and update wallet/subscription state.</div>
        )}
      </article>
    </section>
  )
}

export function WalletActivityView({
  payload,
  filters,
  onLoadView,
  selectedWalletId,
  setSelectedWalletId,
  formatDate,
  formatNumber,
}) {
  const items = extractItems(payload)
  const resolvedSelectedWalletId =
    items.some((item) => item.id === selectedWalletId)
      ? selectedWalletId
      : (items[0]?.id ?? null)
  const selectedWallet = items.find((item) => item.id === resolvedSelectedWalletId) ?? null

  return (
    <section className="stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Wallet Activity</h3>
            <p className="panel-copy">Track individual wallet transactions with a focused detail pane for reconciliation.</p>
          </div>
          <FilterForm
            fields={[
              { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search user or transaction id' },
              { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'pending', 'completed', 'failed'] },
            ]}
            onSubmit={(query) => onLoadView('wallet', { page: 1, limit: 20, ...query })}
          />
        </div>
        <Table
          columns={['User', 'Type', 'Amount', 'Currency', 'Status', 'Created']}
          rows={items.map((item) => [
            <button type="button" className="link-button" key={`${item.id}-select`} onClick={() => setSelectedWalletId(item.id)}>
              {item.userName ?? item.userId ?? 'N/A'}
            </button>,
            item.type,
            formatNumber(item.amount),
            item.currency ?? 'BDT',
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            formatDate(item.createdAt),
          ])}
        />
        <PaginationMeta payload={payload} formatNumber={formatNumber} />
      </article>

      <article className="panel">
        <h3>Transaction Detail</h3>
        {selectedWallet ? (
          <dl className="detail-list">
            <div>
              <dt>User</dt>
              <dd>{selectedWallet.userName ?? selectedWallet.userId ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{selectedWallet.type ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{formatNumber(selectedWallet.amount)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedWallet.status ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(selectedWallet.createdAt)}</dd>
            </div>
          </dl>
        ) : (
          <div className="empty-panel">Select a wallet transaction to inspect its live detail.</div>
        )}
      </article>
    </section>
  )
}

export function SubscriptionsOperationsView({
  payload,
  filters,
  onLoadView,
  selectedSubscriptionId,
  setSelectedSubscriptionId,
  onUpdateWalletSubscription,
  formatDate,
  formatNumber,
}) {
  const items = extractItems(payload)
  const resolvedSelectedSubscriptionId =
    items.some((item) => item.id === selectedSubscriptionId)
      ? selectedSubscriptionId
      : (items[0]?.id ?? null)
  const selectedSubscription = items.find((item) => item.id === resolvedSelectedSubscriptionId) ?? null

  return (
    <section className="stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Subscriptions</h3>
            <p className="panel-copy">Review subscriber status, renewal posture, and period-end timing with direct admin actions.</p>
          </div>
          <FilterForm
            fields={[
              { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search user, plan, provider' },
              { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'active', 'paused', 'cancelled', 'expired'] },
            ]}
            onSubmit={(query) => onLoadView('subscriptions', { page: 1, limit: 20, ...query })}
          />
        </div>
        <Table
          columns={['User', 'Plan', 'Provider', 'Status', 'Auto Renew', 'Period End']}
          rows={items.map((item) => [
            <button type="button" className="link-button" key={`${item.id}-select`} onClick={() => setSelectedSubscriptionId(item.id)}>
              {item.userName ?? item.userId ?? 'N/A'}
            </button>,
            item.planName ?? item.planCode ?? 'N/A',
            item.provider,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.autoRenew ? 'Yes' : 'No',
            formatDate(item.currentPeriodEnd),
          ])}
        />
        <PaginationMeta payload={payload} formatNumber={formatNumber} />
      </article>

      <article className="panel">
        <h3>Subscription Detail</h3>
        {selectedSubscription ? (
          <dl className="detail-list">
            <div>
              <dt>User</dt>
              <dd>{selectedSubscription.userName ?? selectedSubscription.userId ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>{selectedSubscription.planName ?? selectedSubscription.planCode ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedSubscription.status ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{selectedSubscription.provider ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Actions</dt>
              <dd>
                <div className="action-row">
                  <button type="button" onClick={() => onUpdateWalletSubscription(selectedSubscription.id, { status: 'active' })}>
                    Activate
                  </button>
                  <button type="button" onClick={() => onUpdateWalletSubscription(selectedSubscription.id, { status: 'cancelled' })}>
                    Cancel
                  </button>
                </div>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="empty-panel">Select a subscription to inspect and administer it.</div>
        )}
      </article>
    </section>
  )
}
