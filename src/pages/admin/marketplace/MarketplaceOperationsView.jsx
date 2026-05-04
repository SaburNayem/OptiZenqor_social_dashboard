import { useState } from 'react'
import { ExportButton, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

function formatDate(value) {
  if (!value) {
    return 'N/A'
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString()
}

export function MarketplaceOperationsView({ payload }) {
  const items = extractItems(payload)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const selectedItem =
    items.find((item) => item.id === selectedItemId) ??
    items[0] ??
    null

  return (
    <section className="stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Marketplace Operations</h3>
            <p className="panel-copy">Review live listings with seller context, pricing, and moderation-ready detail.</p>
          </div>
          <ExportButton filename="admin-marketplace.csv" rows={items} />
        </div>
        <Table
          columns={['Title', 'Category', 'Price', 'Status', 'Seller', 'Created']}
          rows={items.map((item) => [
            <button type="button" className="link-button" key={`${item.id}-select`} onClick={() => setSelectedItemId(item.id)}>
              {item.title}
            </button>,
            item.category,
            `${formatNumber(item.price)} ${item.currency ?? ''}`.trim(),
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.sellerName ?? item.sellerId ?? 'N/A',
            formatDate(item.createdAt),
          ])}
        />
        <PaginationMeta payload={payload} formatNumber={formatNumber} />
      </article>

      <article className="panel">
        <h3>Listing Detail</h3>
        {selectedItem ? (
          <dl className="detail-list">
            <div>
              <dt>Title</dt>
              <dd>{selectedItem.title ?? 'Untitled listing'}</dd>
            </div>
            <div>
              <dt>Seller</dt>
              <dd>{selectedItem.sellerName ?? selectedItem.sellerId ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedItem.status ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{`${formatNumber(selectedItem.price)} ${selectedItem.currency ?? ''}`.trim()}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{selectedItem.description ?? 'N/A'}</dd>
            </div>
          </dl>
        ) : (
          <div className="empty-panel">Select a listing to inspect its live detail payload.</div>
        )}
      </article>
    </section>
  )
}
