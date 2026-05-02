import { ExportButton, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

export function PagesOperationsView({ payload }) {
  const items = extractItems(payload)

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <h3>Page Operations</h3>
          <p className="panel-copy">Inspect live pages, ownership, follower growth, and operational status from the backend.</p>
        </div>
        <ExportButton filename="admin-pages.csv" rows={items} />
      </div>
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
      <PaginationMeta payload={payload} formatNumber={formatNumber} />
    </article>
  )
}
