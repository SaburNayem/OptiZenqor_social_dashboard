import { PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

function formatDate(value) {
  if (!value) {
    return 'Unknown'
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString()
}

export function MarketplaceOperationsView({ payload }) {
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
          formatDate(item.createdAt),
        ])}
      />
      <PaginationMeta payload={payload} formatNumber={formatNumber} />
    </article>
  )
}
