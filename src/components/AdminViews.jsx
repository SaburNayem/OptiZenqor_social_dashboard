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
  onRevokeAdminSession,
  onUpdatePremiumPlan,
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
          <PaginationMeta payload={payload} />
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
        <PaginationMeta payload={payload} />
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
        <PaginationMeta payload={payload} />
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

  if (viewId === 'marketplace') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Marketplace Operations</h3>
        <Table
          columns={['Title', 'Category', 'Price', 'Status', 'Seller', 'Created']}
          rows={items.map((item) => [
            item.title,
            item.category,
            `${formatNumber(item.price)} ${item.currency ?? ''}`.trim(),
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.sellerName ?? item.sellerId ?? 'Unknown',
            item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown',
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'jobs') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Jobs Moderation</h3>
        <Table
          columns={['Title', 'Company', 'Type', 'Status', 'Applications', 'Recruiter']}
          rows={items.map((item) => [
            item.title,
            item.company,
            item.type,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            formatNumber(item.applications),
            item.recruiterName ?? item.recruiterId ?? 'Unknown',
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'events') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Event Operations</h3>
        <Table
          columns={['Title', 'Organizer', 'Location', 'Status', 'Participants', 'Price']}
          rows={items.map((item) => [
            item.title,
            item.organizerName ?? item.organizerId ?? 'Unknown',
            item.location,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            formatNumber(item.participants),
            formatNumber(item.price),
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'communities') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Community Operations</h3>
        <Table
          columns={['Name', 'Owner', 'Privacy', 'Category', 'Members', 'Status']}
          rows={items.map((item) => [
            item.name,
            item.ownerName ?? item.ownerId ?? 'Unknown',
            item.privacy,
            item.category,
            formatNumber(item.memberCount),
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'pages') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Page Operations</h3>
        <Table
          columns={['Name', 'Owner', 'Category', 'Location', 'Followers', 'Status']}
          rows={items.map((item) => [
            item.name,
            item.ownerName ?? item.ownerId ?? 'Unknown',
            item.category,
            item.location,
            formatNumber(item.followerCount),
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'liveStreams') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Live Stream Operations</h3>
        <Table
          columns={['Title', 'Host', 'Category', 'Status', 'Viewers', 'Engagement']}
          rows={items.map((item) => [
            item.title,
            item.hostName ?? item.hostId ?? 'Unknown',
            item.category,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            formatNumber(item.viewerCount),
            `${formatNumber(item.comments)} comments / ${formatNumber(item.reactions)} reactions`,
          ])}
        />
        <PaginationMeta payload={payload} />
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

  if (viewId === 'walletSubscriptions') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Wallet & Subscription Activity</h3>
        <Table
          columns={['Type', 'Label', 'User', 'Amount', 'Status', 'Created']}
          rows={items.map((item) => [
            item.kind,
            item.label,
            item.userName ?? item.userId ?? 'Unknown',
            item.amount == null ? '—' : formatNumber(item.amount),
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown',
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'wallet') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Wallet Activity</h3>
        <Table
          columns={['User', 'Type', 'Amount', 'Currency', 'Status', 'Created']}
          rows={items.map((item) => [
            item.userName ?? item.userId ?? 'Unknown',
            item.type,
            formatNumber(item.amount),
            item.currency ?? 'BDT',
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown',
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'subscriptions') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Subscriptions</h3>
        <Table
          columns={['User', 'Plan', 'Provider', 'Status', 'Auto Renew', 'Period End']}
          rows={items.map((item) => [
            item.userName ?? item.userId ?? 'Unknown',
            item.planName ?? item.planCode ?? 'Unknown plan',
            item.provider,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.autoRenew ? 'Yes' : 'No',
            item.currentPeriodEnd ? new Date(item.currentPeriodEnd).toLocaleString() : 'Unknown',
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'premiumPlans') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Premium Plans</h3>
        <Table
          columns={['Name', 'Code', 'Price', 'Billing', 'Status', 'Actions']}
          rows={items.map((item) => [
            item.name,
            item.code,
            `${formatNumber(item.price)} ${item.currency ?? ''}`.trim(),
            item.billingInterval ?? 'monthly',
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            <div className="action-row" key={item.id}>
              <button
                type="button"
                onClick={() =>
                  onUpdatePremiumPlan(item.id, {
                    isActive: !(item.isActive === true || item.status === 'active'),
                  })
                }
              >
                {item.isActive === true || item.status === 'active'
                  ? 'Deactivate'
                  : 'Activate'}
              </button>
            </div>,
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
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

  if (viewId === 'notificationDevices') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Notification Devices</h3>
        <Table
          columns={['User', 'Platform', 'Device', 'Status', 'Last Seen', 'Token']}
          rows={items.map((item) => [
            item.userName ?? item.userId ?? 'Unknown',
            item.platform,
            item.deviceLabel ?? 'Unknown device',
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleString() : 'Unknown',
            item.token,
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'adminSessions') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Admin Sessions</h3>
        <Table
          columns={['Admin', 'Role', 'Device', 'Status', 'Last Active', 'Actions']}
          rows={items.map((item) => [
            item.name ?? item.email ?? item.adminId ?? 'Admin',
            item.role ?? 'Admin',
            item.device ?? 'Dashboard session',
            <StatusBadge value={item.current ? 'active' : 'revoked'} key={`${item.id}-status`} />,
            item.lastActive ? new Date(item.lastActive).toLocaleString() : 'Unknown',
            <div className="action-row" key={item.id}>
              <button
                type="button"
                onClick={() => onRevokeAdminSession(item.id)}
                disabled={!item.current}
              >
                Revoke
              </button>
            </div>,
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
        <PaginationMeta payload={payload} />
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
      <PaginationMeta payload={payload} />
    </article>
  )
}

function PaginationMeta({ payload }) {
  const pagination = payload?.data?.pagination
  if (!pagination) {
    return null
  }

  return (
    <p className="pagination-meta">
      Page {pagination.page} of {pagination.totalPages} • {formatNumber(pagination.total)} total items
    </p>
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
