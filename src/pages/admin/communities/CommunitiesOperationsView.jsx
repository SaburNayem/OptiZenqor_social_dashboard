import { useState } from 'react'
import { ExportButton, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

export function CommunitiesOperationsView({ payload, onCreateCommunity, onUpdateCommunity, onDeleteCommunity }) {
  const items = extractItems(payload)
  const [selectedCommunityId, setSelectedCommunityId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [createDraft, setCreateDraft] = useState({
    ownerId: '',
    name: '',
    description: '',
    privacy: 'public',
    category: '',
    location: '',
  })
  const selectedCommunity =
    items.find((item) => item.id === selectedCommunityId) ??
    items[0] ??
    null
  const resolvedEditDraft =
    selectedCommunity == null
      ? null
      : editDraft?.id === selectedCommunity.id
        ? editDraft
        : {
            id: selectedCommunity.id,
            name: selectedCommunity.name ?? '',
            description: selectedCommunity.description ?? '',
            privacy: selectedCommunity.privacy ?? 'public',
            category: selectedCommunity.category ?? '',
            location: selectedCommunity.location ?? '',
            status: selectedCommunity.status ?? 'active',
          }

  return (
    <section className="stack">
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
            <button type="button" className="link-button" key={`${item.id}-select`} onClick={() => setSelectedCommunityId(item.id)}>
              {item.name}
            </button>,
            item.ownerName ?? item.ownerId ?? 'N/A',
            item.privacy,
            item.category,
            formatNumber(item.memberCount),
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
          ])}
        />
        <PaginationMeta payload={payload} formatNumber={formatNumber} />
      </article>

      <article className="panel">
        <h3>Community Detail</h3>
        {selectedCommunity ? (
          <dl className="detail-list">
            <div>
              <dt>Name</dt>
              <dd>{selectedCommunity.name ?? 'Untitled community'}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{selectedCommunity.ownerName ?? selectedCommunity.ownerId ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Privacy</dt>
              <dd>{selectedCommunity.privacy ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedCommunity.status ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{selectedCommunity.description ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Actions</dt>
              <dd>
                <div className="action-row">
                  <button
                    type="button"
                    onClick={() => onDeleteCommunity?.(selectedCommunity.id)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCommunity?.(selectedCommunity.id, {
                        status: selectedCommunity.status === 'archived' ? 'active' : 'archived',
                      })
                    }
                  >
                    {selectedCommunity.status === 'archived' ? 'Restore' : 'Archive'}
                  </button>
                </div>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="empty-panel">Select a community to inspect its live detail payload.</div>
        )}
      </article>

      <article className="panel">
        <h3>Update Community</h3>
        {selectedCommunity && resolvedEditDraft ? (
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault()
              onUpdateCommunity?.(selectedCommunity.id, {
                name: resolvedEditDraft.name.trim(),
                description: resolvedEditDraft.description.trim(),
                privacy: resolvedEditDraft.privacy,
                category: resolvedEditDraft.category.trim(),
                location: resolvedEditDraft.location.trim(),
                status: resolvedEditDraft.status,
              })
            }}
          >
            <input value={resolvedEditDraft.name} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedCommunity.id, name: event.target.value }))} placeholder="Name" />
            <input value={resolvedEditDraft.category} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedCommunity.id, category: event.target.value }))} placeholder="Category" />
            <input value={resolvedEditDraft.location} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedCommunity.id, location: event.target.value }))} placeholder="Location" />
            <select value={resolvedEditDraft.privacy} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedCommunity.id, privacy: event.target.value }))}>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="hidden">Hidden</option>
            </select>
            <select value={resolvedEditDraft.status} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedCommunity.id, status: event.target.value }))}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="suspended">Suspended</option>
            </select>
            <input value={resolvedEditDraft.description} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedCommunity.id, description: event.target.value }))} placeholder="Description" />
            <button type="submit">Save community</button>
          </form>
        ) : (
          <div className="empty-panel">Select a community to update its live record.</div>
        )}
      </article>

      <article className="panel">
        <h3>Create Community</h3>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault()
            onCreateCommunity?.({
              ownerId: createDraft.ownerId.trim(),
              name: createDraft.name.trim(),
              description: createDraft.description.trim(),
              privacy: createDraft.privacy,
              category: createDraft.category.trim(),
              location: createDraft.location.trim(),
            })
            setCreateDraft({
              ownerId: '',
              name: '',
              description: '',
              privacy: 'public',
              category: '',
              location: '',
            })
          }}
        >
          <input value={createDraft.ownerId} onChange={(event) => setCreateDraft((current) => ({ ...current, ownerId: event.target.value }))} placeholder="Owner ID" />
          <input value={createDraft.name} onChange={(event) => setCreateDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Name" />
          <input value={createDraft.category} onChange={(event) => setCreateDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
          <input value={createDraft.location} onChange={(event) => setCreateDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
          <select value={createDraft.privacy} onChange={(event) => setCreateDraft((current) => ({ ...current, privacy: event.target.value }))}>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="hidden">Hidden</option>
          </select>
          <input value={createDraft.description} onChange={(event) => setCreateDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
          <button type="submit" disabled={!createDraft.ownerId.trim() || !createDraft.name.trim() || !createDraft.description.trim()}>
            Create community
          </button>
        </form>
      </article>
    </section>
  )
}
