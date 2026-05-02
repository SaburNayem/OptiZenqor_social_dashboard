import { DataList } from '../../../components/AdminViews'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

export function OverviewView({ data }) {
  const totals = data?.totals ?? {}
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
            ['Moderation queue', data?.health?.moderationQueue],
            ['Support queue', data?.health?.supportQueue],
            ['Report queue', data?.health?.reportQueue],
          ]}
        />
      </article>
    </section>
  )
}
