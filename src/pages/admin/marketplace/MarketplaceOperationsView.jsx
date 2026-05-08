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

export function MarketplaceOperationsView({
  payload,
  onCreateMarketplaceItem,
  onUpdateMarketplaceItem,
  onDeleteMarketplaceItem,
}) {
  const items = extractItems(payload)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [createDraft, setCreateDraft] = useState({
    sellerId: '',
    title: '',
    description: '',
    price: '',
    category: '',
    status: 'draft',
  })
  const selectedItem =
    items.find((item) => item.id === selectedItemId) ??
    items[0] ??
    null
  const [editDraft, setEditDraft] = useState(null)

  const resolvedEditDraft =
    selectedItem == null
      ? null
      : editDraft?.id === selectedItem.id
        ? editDraft
        : {
            id: selectedItem.id,
            title: selectedItem.title ?? '',
            description: selectedItem.description ?? '',
            price: String(selectedItem.price ?? ''),
            category: selectedItem.category ?? '',
            status: selectedItem.status ?? 'draft',
          }

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
            <div>
              <dt>Actions</dt>
              <dd>
                <div className="action-row">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateMarketplaceItem?.(selectedItem.id, {
                        status: selectedItem.status === 'active' ? 'archived' : 'active',
                      })
                    }
                  >
                    {selectedItem.status === 'active' ? 'Archive' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteMarketplaceItem?.(selectedItem.id)}
                  >
                    Delete
                  </button>
                </div>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="empty-panel">Select a listing to inspect its live detail payload.</div>
        )}
      </article>

      <article className="panel">
        <h3>Update Listing</h3>
        {selectedItem && resolvedEditDraft ? (
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault()
              onUpdateMarketplaceItem?.(selectedItem.id, {
                title: resolvedEditDraft.title.trim(),
                description: resolvedEditDraft.description.trim(),
                price: Number(resolvedEditDraft.price),
                category: resolvedEditDraft.category.trim(),
                status: resolvedEditDraft.status,
              })
            }}
          >
            <input
              value={resolvedEditDraft.title}
              onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedItem.id, title: event.target.value }))}
              placeholder="Title"
            />
            <input
              value={resolvedEditDraft.category}
              onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedItem.id, category: event.target.value }))}
              placeholder="Category"
            />
            <input
              value={resolvedEditDraft.price}
              onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedItem.id, price: event.target.value }))}
              placeholder="Price"
              type="number"
              min="0"
              step="0.01"
            />
            <select
              value={resolvedEditDraft.status}
              onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedItem.id, status: event.target.value }))}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="sold">Sold</option>
            </select>
            <input
              value={resolvedEditDraft.description}
              onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedItem.id, description: event.target.value }))}
              placeholder="Description"
            />
            <button type="submit">Save listing</button>
          </form>
        ) : (
          <div className="empty-panel">Select a listing to update its live marketplace record.</div>
        )}
      </article>

      <article className="panel">
        <h3>Create Listing</h3>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault()
            onCreateMarketplaceItem?.({
              sellerId: createDraft.sellerId.trim(),
              title: createDraft.title.trim(),
              description: createDraft.description.trim(),
              price: Number(createDraft.price),
              category: createDraft.category.trim(),
              status: createDraft.status,
            })
            setCreateDraft({
              sellerId: '',
              title: '',
              description: '',
              price: '',
              category: '',
              status: 'draft',
            })
          }}
        >
          <input value={createDraft.sellerId} onChange={(event) => setCreateDraft((current) => ({ ...current, sellerId: event.target.value }))} placeholder="Seller ID" />
          <input value={createDraft.title} onChange={(event) => setCreateDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Title" />
          <input value={createDraft.category} onChange={(event) => setCreateDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
          <input value={createDraft.price} onChange={(event) => setCreateDraft((current) => ({ ...current, price: event.target.value }))} placeholder="Price" type="number" min="0" step="0.01" />
          <select value={createDraft.status} onChange={(event) => setCreateDraft((current) => ({ ...current, status: event.target.value }))}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
          <input value={createDraft.description} onChange={(event) => setCreateDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
          <button
            type="submit"
            disabled={
              !createDraft.sellerId.trim() ||
              !createDraft.title.trim() ||
              !createDraft.description.trim() ||
              !createDraft.category.trim() ||
              !createDraft.price
            }
          >
            Create listing
          </button>
        </form>
      </article>
    </section>
  )
}
