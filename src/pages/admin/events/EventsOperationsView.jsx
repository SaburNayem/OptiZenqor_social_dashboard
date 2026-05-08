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

export function EventsOperationsView({ payload, onCreateEvent, onUpdateEvent, onDeleteEvent }) {
  const items = extractItems(payload)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [createDraft, setCreateDraft] = useState({
    organizerId: '',
    title: '',
    date: '',
    time: '',
    location: '',
    status: 'draft',
  })
  const selectedEvent =
    items.find((item) => item.id === selectedEventId) ??
    items[0] ??
    null
  const [editDraft, setEditDraft] = useState(null)

  const resolvedEditDraft =
    selectedEvent == null
      ? null
      : editDraft?.id === selectedEvent.id
        ? editDraft
        : {
            id: selectedEvent.id,
            title: selectedEvent.title ?? '',
            date: selectedEvent.date ?? '',
            time: selectedEvent.time ?? '',
            location: selectedEvent.location ?? '',
            status: selectedEvent.status ?? 'draft',
            description: selectedEvent.description ?? '',
          }

  return (
    <section className="stack">
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
            <button type="button" className="link-button" key={`${item.id}-select`} onClick={() => setSelectedEventId(item.id)}>
              {item.title}
            </button>,
            item.organizerName ?? item.organizerId ?? 'N/A',
            item.location,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            formatNumber(item.participants),
            formatNumber(item.price),
          ])}
        />
        <PaginationMeta payload={payload} formatNumber={formatNumber} />
      </article>

      <article className="panel">
        <h3>Event Detail</h3>
        {selectedEvent ? (
          <dl className="detail-list">
            <div>
              <dt>Title</dt>
              <dd>{selectedEvent.title ?? 'Untitled event'}</dd>
            </div>
            <div>
              <dt>Organizer</dt>
              <dd>{selectedEvent.organizerName ?? selectedEvent.organizerId ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Schedule</dt>
              <dd>{`${formatDate(selectedEvent.date)} ${selectedEvent.time ?? ''}`.trim()}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedEvent.status ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{selectedEvent.description ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Actions</dt>
              <dd>
                <div className="action-row">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateEvent?.(selectedEvent.id, {
                        status: selectedEvent.status === 'published' ? 'cancelled' : 'published',
                      })
                    }
                  >
                    {selectedEvent.status === 'published' ? 'Cancel' : 'Publish'}
                  </button>
                  <button type="button" onClick={() => onDeleteEvent?.(selectedEvent.id)}>
                    Delete
                  </button>
                </div>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="empty-panel">Select an event to inspect its live payload.</div>
        )}
      </article>

      <article className="panel">
        <h3>Update Event</h3>
        {selectedEvent && resolvedEditDraft ? (
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault()
              onUpdateEvent?.(selectedEvent.id, {
                title: resolvedEditDraft.title.trim(),
                date: resolvedEditDraft.date.trim(),
                time: resolvedEditDraft.time.trim(),
                location: resolvedEditDraft.location.trim(),
                status: resolvedEditDraft.status,
                description: resolvedEditDraft.description.trim(),
              })
            }}
          >
            <input value={resolvedEditDraft.title} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedEvent.id, title: event.target.value }))} placeholder="Title" />
            <input value={resolvedEditDraft.date} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedEvent.id, date: event.target.value }))} placeholder="Date" />
            <input value={resolvedEditDraft.time} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedEvent.id, time: event.target.value }))} placeholder="Time" />
            <input value={resolvedEditDraft.location} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedEvent.id, location: event.target.value }))} placeholder="Location" />
            <select value={resolvedEditDraft.status} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedEvent.id, status: event.target.value }))}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input value={resolvedEditDraft.description} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedEvent.id, description: event.target.value }))} placeholder="Description" />
            <button type="submit">Save event</button>
          </form>
        ) : (
          <div className="empty-panel">Select an event to update its live record.</div>
        )}
      </article>

      <article className="panel">
        <h3>Create Event</h3>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault()
            onCreateEvent?.({
              organizerId: createDraft.organizerId.trim(),
              title: createDraft.title.trim(),
              date: createDraft.date.trim(),
              time: createDraft.time.trim(),
              location: createDraft.location.trim(),
              status: createDraft.status,
            })
            setCreateDraft({
              organizerId: '',
              title: '',
              date: '',
              time: '',
              location: '',
              status: 'draft',
            })
          }}
        >
          <input value={createDraft.organizerId} onChange={(event) => setCreateDraft((current) => ({ ...current, organizerId: event.target.value }))} placeholder="Organizer ID" />
          <input value={createDraft.title} onChange={(event) => setCreateDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Title" />
          <input value={createDraft.date} onChange={(event) => setCreateDraft((current) => ({ ...current, date: event.target.value }))} placeholder="Date" />
          <input value={createDraft.time} onChange={(event) => setCreateDraft((current) => ({ ...current, time: event.target.value }))} placeholder="Time" />
          <input value={createDraft.location} onChange={(event) => setCreateDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
          <select value={createDraft.status} onChange={(event) => setCreateDraft((current) => ({ ...current, status: event.target.value }))}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button
            type="submit"
            disabled={
              !createDraft.organizerId.trim() ||
              !createDraft.title.trim() ||
              !createDraft.date.trim() ||
              !createDraft.time.trim() ||
              !createDraft.location.trim()
            }
          >
            Create event
          </button>
        </form>
      </article>
    </section>
  )
}
