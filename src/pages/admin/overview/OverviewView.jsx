import { ChartCard, DataList, EmptyState, MetricCard } from '../../../components/common/AdminPrimitives'

function hasValue(value) {
  return value !== null && value !== undefined && value !== ''
}

function formatNumber(value) {
  if (!hasValue(value)) {
    return 'N/A'
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : 'N/A'
}

function formatMoney(value) {
  if (!hasValue(value)) {
    return 'N/A'
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? `$${numeric.toLocaleString()}` : 'N/A'
}

function sumDefined(values) {
  let total = 0
  let count = 0

  values.forEach((value) => {
    if (!hasValue(value)) {
      return
    }

    const numeric = Number(value)
    if (Number.isFinite(numeric)) {
      total += numeric
      count += 1
    }
  })

  return count > 0 ? total : null
}

function MiniBars({ items, valueKey = 'value' }) {
  const maxValue = Math.max(...items.map((item) => Number(item[valueKey] ?? 0)), 0)
  if (!items.length || maxValue <= 0) {
    return <EmptyState title="No chart data" description="The backend has not returned chart points for this range yet." />
  }

  return (
    <div className="mini-bars">
      {items.map((item) => {
        const value = Number(item[valueKey] ?? 0)
        const height = Math.max(14, Math.round((value / maxValue) * 100))
        return (
          <div key={item.label} className="mini-bar-item">
            <span className="mini-bar-value">{formatNumber(value)}</span>
            <div className="mini-bar-track">
              <div className="mini-bar-fill" style={{ height: `${height}%` }} />
            </div>
            <span className="mini-bar-label">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function OverviewView({ data }) {
  const totals = data?.totals ?? {}
  const health = data?.health ?? {}
  const charts = data?.charts ?? {}
  const breakdowns = data?.breakdowns ?? {}
  const summaries = data?.summaries ?? {}
  const recentActivity = data?.recentActivity ?? []
  const totalContent = sumDefined([totals.posts, totals.reels, totals.stories])

  const cards = [
    { label: 'Users', value: formatNumber(totals.users), helper: hasValue(totals.activeUsers) ? `${formatNumber(totals.activeUsers)} active` : '' },
    { label: 'Content', value: formatNumber(totalContent), helper: hasValue(totals.posts) ? `${formatNumber(totals.posts)} posts live` : '' },
    { label: 'Open Reports', value: formatNumber(totals.openReports), helper: hasValue(totals.reports) ? `${formatNumber(totals.reports)} total reports` : '' },
    { label: 'Support Queue', value: formatNumber(totals.supportTickets), helper: hasValue(health.supportQueue) ? `${formatNumber(health.supportQueue)} waiting now` : '' },
    { label: 'Subscriptions', value: formatNumber(totals.activeSubscriptions), helper: hasValue(totals.activeSubscriptions) ? 'Active billing relationships' : '' },
    { label: 'Revenue', value: formatMoney(totals.revenue), helper: hasValue(totals.revenue) ? 'Wallet transaction sum' : '' },
  ]

  const userGrowth =
    charts.userGrowth?.labels?.map((label, index) => ({
      label,
      value: charts.userGrowth?.values?.[index] ?? 0,
    })) ?? []
  const revenueGrowth = charts.revenueGrowth ?? []
  const contentGrowth =
    charts.contentGrowth?.map((item) => ({
      label: item.label,
      value: item.total,
    })) ?? []

  return (
    <section className="stack">
      <div className="card-grid">
        {cards.map((card) => (
          <MetricCard key={card.label} label={card.label} value={card.value} helper={card.helper} />
        ))}
      </div>

      <div className="detail-grid">
        <ChartCard title="User Growth">
          <MiniBars items={userGrowth} />
        </ChartCard>
        <ChartCard title="Revenue Trend">
          <MiniBars items={revenueGrowth} />
        </ChartCard>
      </div>

      <div className="detail-grid">
        <ChartCard title="Content Output">
          <MiniBars items={contentGrowth} />
        </ChartCard>
        <ChartCard title="Operational Health">
          <DataList
            items={[
              ['Moderation queue', health.moderationQueue],
              ['Support queue', health.supportQueue],
              ['Report queue', health.reportQueue],
              ['Live streams', summaries.live?.activeStreams],
              ['Active calls', summaries.live?.activeCalls],
            ]}
            formatNumber={formatNumber}
          />
        </ChartCard>
      </div>

      <div className="detail-grid">
        <ChartCard title="Status Breakdowns">
          <div className="overview-breakdowns">
            <DataList items={(breakdowns.reportsByStatus ?? []).map((item) => [item.label, item.value])} formatNumber={formatNumber} />
            <DataList items={(breakdowns.supportByStatus ?? []).map((item) => [item.label, item.value])} formatNumber={formatNumber} />
            <DataList items={(breakdowns.subscriptionsByStatus ?? []).map((item) => [item.label, item.value])} formatNumber={formatNumber} />
          </div>
        </ChartCard>
        <ChartCard title="Business Summaries">
          <DataList
            items={[
              ['Marketplace orders', summaries.marketplace?.orders],
              ['Pending marketplace orders', summaries.marketplace?.pendingOrders],
              ['Open jobs', summaries.jobs?.openJobs],
              ['Job applications', summaries.jobs?.applications],
              ['Support tickets', summaries.support?.total],
              ['Subscriptions', summaries.subscriptions?.total],
            ]}
            formatNumber={formatNumber}
          />
        </ChartCard>
      </div>

      <ChartCard title="Recent Admin Activity">
        {recentActivity.length ? (
          <div className="activity-timeline">
            {recentActivity.map((item) => (
              <article key={item.id} className="activity-item">
                <strong>{item.action}</strong>
                <span>
                  {item.entityType}
                  {item.entityId ? ` • ${item.entityId}` : ''}
                </span>
                <time>{new Date(item.createdAt).toLocaleString()}</time>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No recent admin activity" description="Audit-backed actions will appear here as the operations team works." />
        )}
      </ChartCard>
    </section>
  )
}
