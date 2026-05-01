import { extractItems } from '../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

function formatCell(value) {
  if (value == null || value === '') {
    return '—'
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

function resolveColumns(items) {
  const first = items[0]
  if (!first || typeof first !== 'object') {
    return ['Message']
  }
  return Object.keys(first).slice(0, 6)
}

export function DashboardView({
  viewId,
  payload,
  settingsDraft,
  setSettingsDraft,
  onUpdateUser,
  onModerateContent,
  onUpdateReport,
  onSaveSettings,
}) {
  const data = payload?.data ?? {}

  if (viewId === 'overview') {
    const totals = data.totals ?? {}
    const cards = [
      { label: 'Users', value: totals.users },
      { label: 'Active Users', value: totals.activeUsers },
      { label: 'Posts', value: totals.posts },
      { label: 'Open Reports', value: totals.openReports },
      { label: 'Support Queue', value: totals.supportTickets },
      { label: 'Revenue', value: totals.revenue },
    ]

    return (
      <section className="stack">
        <div className="card-grid">
          {cards.map((card) => (
            <article key={card.label} className="metric-card">
              <span>{card.label}</span>
              <strong>{formatNumber(card.value)}</strong>
            </article>
          ))}
        </div>
        <article className="panel">
          <h3>Operational Health</h3>
          <DataList
            items={[
              ['Moderation queue', data.health?.moderationQueue],
              ['Support queue', data.health?.supportQueue],
              ['Report queue', data.health?.reportQueue],
            ]}
          />
        </article>
      </section>
    )
  }

  if (viewId === 'users') {
    const items = extractItems(payload)
    return (
      <section className="stack">
        <article className="panel">
          <h3>User Management</h3>
          <Table
            columns={['Name', 'Role', 'Status', 'Verification', 'Blocked', 'Actions']}
            rows={items.map((item) => [
              `${item.name} (${item.username})`,
              item.role,
              <StatusBadge value={item.status} key={`${item.id}-status`} />,
              <StatusBadge value={item.verification} key={`${item.id}-verification`} />,
              item.blocked ? 'Yes' : 'No',
              <div className="action-row" key={item.id}>
                <button type="button" onClick={() => onUpdateUser(item.id, { blocked: !item.blocked })}>
                  {item.blocked ? 'Unblock' : 'Block'}
                </button>
                <button type="button" onClick={() => onUpdateUser(item.id, { status: 'Active' })}>
                  Activate
                </button>
              </div>,
            ])}
          />
        </article>
      </section>
    )
  }

  if (viewId === 'content') {
    const items = extractItems(payload).map((item) => ({
      ...item,
      targetType: item.targetType ?? data.targetType ?? 'post',
    }))
    return (
      <article className="panel">
        <h3>Content Moderation</h3>
        <Table
          columns={['ID', 'Type', 'Status', 'Preview', 'Created', 'Actions']}
          rows={items.map((item) => [
            item.id,
            item.targetType,
            <StatusBadge value={item.status ?? 'Unknown'} key={`${item.id}-status`} />,
            item.caption ?? item.text ?? item.title ?? 'No preview text',
            item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown',
            <div className="action-row" key={item.id}>
              <button type="button" onClick={() => onModerateContent(item, { status: 'Under review' })}>
                Review
              </button>
              <button type="button" onClick={() => onModerateContent(item, { remove: true, note: 'Removed by admin' })}>
                Remove
              </button>
            </div>,
          ])}
        />
      </article>
    )
  }

  if (viewId === 'reports') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Reports Queue</h3>
        <Table
          columns={['Reason', 'Status', 'Reporter', 'Target', 'Actions']}
          rows={items.map((item) => [
            item.reason,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.reporterName,
            item.targetUserName ?? item.targetEntityId ?? 'Unknown',
            <div className="action-row" key={item.id}>
              <button type="button" onClick={() => onUpdateReport(item.id, { status: 'reviewing', note: 'Taken into review' })}>
                Review
              </button>
              <button type="button" onClick={() => onUpdateReport(item.id, { status: 'resolved', note: 'Resolved from dashboard' })}>
                Resolve
              </button>
            </div>,
          ])}
        />
      </article>
    )
  }

  if (viewId === 'support') {
    const tickets = data.tickets ?? []
    return (
      <article className="panel">
        <h3>Support Operations</h3>
        <Table
          columns={['Subject', 'Category', 'Status', 'Priority', 'Updated']}
          rows={tickets.map((ticket) => [
            ticket.subject,
            ticket.category,
            <StatusBadge value={ticket.status} key={`${ticket.id}-status`} />,
            ticket.priority,
            new Date(ticket.updatedAt).toLocaleString(),
          ])}
        />
      </article>
    )
  }

  if (viewId === 'revenue') {
    const cards = [
      ['Total revenue', data.totalRevenue],
      ['Completed transactions', data.completedTransactions],
      ['Active subscriptions', data.activeSubscriptions],
      ['Plans', data.plans?.length ?? 0],
    ]

    return (
      <section className="stack">
        <article className="panel">
          <h3>Revenue Snapshot</h3>
          <DataList items={cards} />
        </article>
        <article className="panel">
          <h3>Recent Transactions</h3>
          <Table
            columns={['ID', 'Amount', 'Status', 'Created']}
            rows={(data.recentTransactions ?? []).map((item) => [
              item.id,
              formatNumber(item.amount),
              <StatusBadge value={item.status} key={`${item.id}-status`} />,
              item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown',
            ])}
          />
        </article>
      </section>
    )
  }

  if (viewId === 'notifications') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Notification Campaigns</h3>
        <Table
          columns={['Name', 'Audience', 'Status', 'Schedule']}
          rows={items.map((item) => [
            item.name ?? item.title ?? item.id,
            item.audience ?? item.segmentId ?? 'All users',
            <StatusBadge value={item.status ?? 'scheduled'} key={`${item.id}-status`} />,
            item.schedule ?? item.createdAt ?? 'Not scheduled',
          ])}
        />
      </article>
    )
  }

  if (viewId === 'audit') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Audit Trail</h3>
        <Table
          columns={['Action', 'Entity', 'Actor', 'Created']}
          rows={items.map((item) => [
            item.action,
            `${item.entityType}${item.entityId ? `:${item.entityId}` : ''}`,
            item.actorName ?? 'System',
            new Date(item.createdAt).toLocaleString(),
          ])}
        />
      </article>
    )
  }

  if (viewId === 'settings') {
    return (
      <article className="panel">
        <h3>Operational Settings</h3>
        <form className="settings-form" onSubmit={onSaveSettings}>
          <textarea value={settingsDraft} onChange={(event) => setSettingsDraft(event.target.value)} />
          <button type="submit">Save settings</button>
        </form>
      </article>
    )
  }

  const items = extractItems(payload)
  return (
    <article className="panel">
      <h3>{data.title ?? 'Live Module Data'}</h3>
      <Table
        columns={resolveColumns(items)}
        rows={items.map((item) => resolveColumns(items).map((column) => formatCell(item[column])))}
      />
    </article>
  )
}

export function DataList({ items }) {
  return (
    <dl className="data-list">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{formatNumber(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Table({ columns, rows }) {
  if (!rows.length) {
    return <div className="empty-panel">The API returned no data for this view.</div>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatusBadge({ value }) {
  const normalized = String(value ?? 'unknown').toLowerCase()
  const tone =
    normalized.includes('resolved') || normalized.includes('active') || normalized.includes('approved')
      ? 'good'
      : normalized.includes('review') || normalized.includes('pending')
        ? 'warn'
        : normalized.includes('blocked') || normalized.includes('removed') || normalized.includes('rejected')
          ? 'bad'
          : 'neutral'

  return <span className={`status-badge ${tone}`}>{String(value ?? 'Unknown')}</span>
}
