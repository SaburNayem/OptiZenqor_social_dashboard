import { ExportButton, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

export function CommunitiesOperationsView({ payload }) {
  const items = extractItems(payload)

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <h3>Community Operations</h3>
          <p className="panel-copy">Review real community inventory, ownership, privacy, and membership load.</p>
        </div>
        <ExportButton filename="admin-communities.csv" rows={items} />
      </div>
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
      <PaginationMeta payload={payload} formatNumber={formatNumber} />
    </article>
  )
}
