import { ExportButton, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

export function EventsOperationsView({ payload }) {
  const items = extractItems(payload)

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <h3>Event Operations</h3>
          <p className="panel-copy">Monitor live event inventory, participation, and organizer activity from the backend.</p>
        </div>
        <ExportButton filename="admin-events.csv" rows={items} />
      </div>
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
      <PaginationMeta payload={payload} formatNumber={formatNumber} />
    </article>
  )
}
