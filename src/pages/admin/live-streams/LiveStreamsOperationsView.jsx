import { useState } from 'react'
import { ExportButton, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

export function LiveStreamsOperationsView({ payload, onUpdateLiveStream }) {
  const items = extractItems(payload)
  const [selectedStreamId, setSelectedStreamId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const selectedStream =
    items.find((item) => item.id === selectedStreamId) ??
    items[0] ??
    null
  const resolvedEditDraft =
    selectedStream == null
      ? null
      : editDraft?.id === selectedStream.id
        ? editDraft
        : {
            id: selectedStream.id,
            title: selectedStream.title ?? '',
            description: selectedStream.description ?? '',
            category: selectedStream.category ?? '',
            status: selectedStream.status ?? 'scheduled',
            audience: selectedStream.audience ?? 'public',
            commentsEnabled: selectedStream.commentsEnabled ?? true,
            slowModeSeconds: String(selectedStream.slowModeSeconds ?? 0),
          }

  return (
    <section className="stack">
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
            <button type="button" className="link-button" key={`${item.id}-select`} onClick={() => setSelectedStreamId(item.id)}>
              {item.title}
            </button>,
            item.hostName ?? item.hostId ?? 'N/A',
            item.category,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            formatNumber(item.viewerCount),
            `${formatNumber(item.comments)} comments / ${formatNumber(item.reactions)} reactions`,
          ])}
        />
        <PaginationMeta payload={payload} formatNumber={formatNumber} />
      </article>

      <article className="panel">
        <h3>Live Stream Detail</h3>
        {selectedStream ? (
          <dl className="detail-list">
            <div>
              <dt>Title</dt>
              <dd>{selectedStream.title ?? 'Untitled stream'}</dd>
            </div>
            <div>
              <dt>Host</dt>
              <dd>{selectedStream.hostName ?? selectedStream.hostId ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedStream.status ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Audience</dt>
              <dd>{selectedStream.audience ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{selectedStream.description ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Actions</dt>
              <dd>
                <div className="action-row">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateLiveStream?.(selectedStream.id, {
                        status: selectedStream.status === 'ended' ? 'scheduled' : 'ended',
                        note: 'Updated from dashboard live stream operations.',
                      })
                    }
                  >
                    {selectedStream.status === 'ended' ? 'Reopen' : 'End'}
                  </button>
                </div>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="empty-panel">Select a live stream to inspect its live detail payload.</div>
        )}
      </article>

      <article className="panel">
        <h3>Update Live Stream</h3>
        {selectedStream && resolvedEditDraft ? (
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault()
              onUpdateLiveStream?.(selectedStream.id, {
                title: resolvedEditDraft.title.trim(),
                description: resolvedEditDraft.description.trim(),
                category: resolvedEditDraft.category.trim(),
                status: resolvedEditDraft.status,
                audience: resolvedEditDraft.audience,
                commentsEnabled: resolvedEditDraft.commentsEnabled,
                slowModeSeconds: Number(resolvedEditDraft.slowModeSeconds),
                note: 'Updated from dashboard live stream operations.',
              })
            }}
          >
            <input value={resolvedEditDraft.title} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedStream.id, title: event.target.value }))} placeholder="Title" />
            <input value={resolvedEditDraft.category} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedStream.id, category: event.target.value }))} placeholder="Category" />
            <select value={resolvedEditDraft.status} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedStream.id, status: event.target.value }))}>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={resolvedEditDraft.audience} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedStream.id, audience: event.target.value }))}>
              <option value="public">Public</option>
              <option value="followers">Followers</option>
              <option value="private">Private</option>
            </select>
            <input value={resolvedEditDraft.slowModeSeconds} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedStream.id, slowModeSeconds: event.target.value }))} placeholder="Slow mode seconds" type="number" min="0" />
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={resolvedEditDraft.commentsEnabled}
                onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedStream.id, commentsEnabled: event.target.checked }))}
              />
              Comments enabled
            </label>
            <input value={resolvedEditDraft.description} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedStream.id, description: event.target.value }))} placeholder="Description" />
            <button type="submit">Save live stream</button>
          </form>
        ) : (
          <div className="empty-panel">Select a live stream to update its live record.</div>
        )}
      </article>
    </section>
  )
}
