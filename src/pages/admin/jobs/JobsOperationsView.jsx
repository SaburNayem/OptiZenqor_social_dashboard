import { PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

export function JobsOperationsView({ payload }) {
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
      <PaginationMeta payload={payload} formatNumber={formatNumber} />
    </article>
  )
}
