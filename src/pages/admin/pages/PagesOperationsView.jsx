import { useState } from 'react'
import { ExportButton, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

export function PagesOperationsView({ payload, onCreatePage, onUpdatePage, onDeletePage }) {
  const items = extractItems(payload)
  const [selectedPageId, setSelectedPageId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [createDraft, setCreateDraft] = useState({
    ownerId: '',
    name: '',
    about: '',
    category: '',
    location: '',
    contactLabel: '',
  })
  const selectedPage =
    items.find((item) => item.id === selectedPageId) ??
    items[0] ??
    null
  const resolvedEditDraft =
    selectedPage == null
      ? null
      : editDraft?.id === selectedPage.id
        ? editDraft
        : {
            id: selectedPage.id,
            name: selectedPage.name ?? '',
            about: selectedPage.about ?? '',
            category: selectedPage.category ?? '',
            location: selectedPage.location ?? '',
            contactLabel: selectedPage.contactLabel ?? '',
          }

  return (
    <section className="stack">
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
            <button type="button" className="link-button" key={`${item.id}-select`} onClick={() => setSelectedPageId(item.id)}>
              {item.name}
            </button>,
            item.ownerName ?? item.ownerId ?? 'N/A',
            item.category,
            item.location,
            formatNumber(item.followerCount),
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
          ])}
        />
        <PaginationMeta payload={payload} formatNumber={formatNumber} />
      </article>

      <article className="panel">
        <h3>Page Detail</h3>
        {selectedPage ? (
          <dl className="detail-list">
            <div>
              <dt>Name</dt>
              <dd>{selectedPage.name ?? 'Untitled page'}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{selectedPage.ownerName ?? selectedPage.ownerId ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{selectedPage.category ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{selectedPage.location ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>About</dt>
              <dd>{selectedPage.about ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Actions</dt>
              <dd>
                <div className="action-row">
                  <button type="button" onClick={() => onDeletePage?.(selectedPage.id)}>
                    Delete
                  </button>
                </div>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="empty-panel">Select a page to inspect its live detail payload.</div>
        )}
      </article>

      <article className="panel">
        <h3>Update Page</h3>
        {selectedPage && resolvedEditDraft ? (
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault()
              onUpdatePage?.(selectedPage.id, {
                name: resolvedEditDraft.name.trim(),
                about: resolvedEditDraft.about.trim(),
                category: resolvedEditDraft.category.trim(),
                location: resolvedEditDraft.location.trim(),
                contactLabel: resolvedEditDraft.contactLabel.trim(),
              })
            }}
          >
            <input value={resolvedEditDraft.name} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedPage.id, name: event.target.value }))} placeholder="Name" />
            <input value={resolvedEditDraft.category} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedPage.id, category: event.target.value }))} placeholder="Category" />
            <input value={resolvedEditDraft.location} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedPage.id, location: event.target.value }))} placeholder="Location" />
            <input value={resolvedEditDraft.contactLabel} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedPage.id, contactLabel: event.target.value }))} placeholder="Contact label" />
            <input value={resolvedEditDraft.about} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedPage.id, about: event.target.value }))} placeholder="About" />
            <button type="submit">Save page</button>
          </form>
        ) : (
          <div className="empty-panel">Select a page to update its live record.</div>
        )}
      </article>

      <article className="panel">
        <h3>Create Page</h3>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault()
            onCreatePage?.({
              ownerId: createDraft.ownerId.trim(),
              name: createDraft.name.trim(),
              about: createDraft.about.trim(),
              category: createDraft.category.trim(),
              location: createDraft.location.trim(),
              contactLabel: createDraft.contactLabel.trim(),
            })
            setCreateDraft({
              ownerId: '',
              name: '',
              about: '',
              category: '',
              location: '',
              contactLabel: '',
            })
          }}
        >
          <input value={createDraft.ownerId} onChange={(event) => setCreateDraft((current) => ({ ...current, ownerId: event.target.value }))} placeholder="Owner ID" />
          <input value={createDraft.name} onChange={(event) => setCreateDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Name" />
          <input value={createDraft.category} onChange={(event) => setCreateDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
          <input value={createDraft.location} onChange={(event) => setCreateDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
          <input value={createDraft.contactLabel} onChange={(event) => setCreateDraft((current) => ({ ...current, contactLabel: event.target.value }))} placeholder="Contact label" />
          <input value={createDraft.about} onChange={(event) => setCreateDraft((current) => ({ ...current, about: event.target.value }))} placeholder="About" />
          <button type="submit" disabled={!createDraft.ownerId.trim() || !createDraft.name.trim() || !createDraft.category.trim()}>
            Create page
          </button>
        </form>
      </article>
    </section>
  )
}
