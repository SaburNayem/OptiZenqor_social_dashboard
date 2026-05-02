import { ExportButton, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

export function LiveStreamsOperationsView({ payload }) {
  const items = extractItems(payload)

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <h3>Live Stream Operations</h3>
          <p className="panel-copy">Track live inventory, viewer load, and engagement signals from real admin APIs.</p>
        </div>
        <ExportButton filename="admin-live-streams.csv" rows={items} />
      </div>
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
      <PaginationMeta payload={payload} formatNumber={formatNumber} />
    </article>
  )
}
