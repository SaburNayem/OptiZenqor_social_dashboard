import { useState } from 'react'
import { PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatDate(value) {
  if (!value) {
    return 'Unknown'
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString()
}

function FilterForm({ fields, onSubmit }) {
  return (
    <form
      className="filters-bar"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const query = Object.fromEntries(
          fields.map((field) => [field.name, String(formData.get(field.name) ?? '').trim()]),
        )
        onSubmit(query)
      }}
    >
      {fields.map((field) => (
        field.type === 'select' ? (
          <select key={field.name} name={field.name} defaultValue={field.defaultValue}>
            <option value="">All {field.name}</option>
            {field.options.filter(Boolean).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            key={field.name}
            name={field.name}
            type={field.type}
            defaultValue={field.defaultValue}
            placeholder={field.placeholder}
          />
        )
      ))}
      <button type="submit">Apply</button>
    </form>
  )
}

export function SupportOperationsView({ payload, filters, onUpdateSupportTicket, onLoadView }) {
  const data = payload?.data ?? {}
  const tickets = extractItems({ data: { items: data.tickets ?? [] } })
  const actions = data.actions ?? []
  const [selectedSupportTicketId, setSelectedSupportTicketId] = useState(null)

  const resolvedSelectedTicketId =
    tickets.some((ticket) => ticket.id === selectedSupportTicketId)
      ? selectedSupportTicketId
      : (tickets[0]?.id ?? null)
  const selectedTicket = tickets.find((ticket) => ticket.id === resolvedSelectedTicketId) ?? null

  return (
    <section className="stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Support Operations</h3>
            <p className="panel-copy">Search the live queue, change ticket state, and keep an audit-backed trail.</p>
          </div>
          <FilterForm
            fields={[
              { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search subject, category, user' },
              { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'open', 'reviewing', 'resolved', 'closed'] },
              { name: 'priority', type: 'select', defaultValue: filters.priority ?? '', options: ['', 'low', 'normal', 'high', 'urgent'] },
            ]}
            onSubmit={(query) => onLoadView('support', { page: 1, limit: 20, ...query })}
          />
        </div>
        <Table
          columns={['Subject', 'User', 'Category', 'Status', 'Priority', 'Updated', 'Actions']}
          rows={tickets.map((ticket) => [
            <button type="button" className="link-button" key={`${ticket.id}-select`} onClick={() => setSelectedSupportTicketId(ticket.id)}>
              {ticket.subject}
            </button>,
            ticket.userLabel ?? ticket.userName ?? ticket.username ?? ticket.userEmail ?? 'Unknown user',
            ticket.category,
            <StatusBadge value={ticket.status} key={`${ticket.id}-status`} />,
            <StatusBadge value={ticket.priority} key={`${ticket.id}-priority`} />,
            formatDate(ticket.updatedAt),
            <div className="action-row" key={ticket.id}>
              <button type="button" onClick={() => onUpdateSupportTicket(ticket.id, { status: 'reviewing' })}>
                Review
              </button>
              <button type="button" onClick={() => onUpdateSupportTicket(ticket.id, { priority: 'high' })}>
                Escalate
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSupportTicket(ticket.id, {
                    status: 'resolved',
                    adminNote: 'Resolved from admin dashboard',
                  })
                }
              >
                Resolve
              </button>
            </div>,
          ])}
        />
        <PaginationMeta payload={payload} formatNumber={(value) => Number(value ?? 0).toLocaleString()} />
      </article>

      <div className="detail-grid">
        <article className="panel">
          <h3>Ticket Detail</h3>
          {selectedTicket ? (
            <dl className="detail-list">
              <div>
                <dt>Subject</dt>
                <dd>{selectedTicket.subject}</dd>
              </div>
              <div>
                <dt>User</dt>
                <dd>{selectedTicket.userLabel ?? selectedTicket.userName ?? selectedTicket.username ?? selectedTicket.userEmail ?? 'Unknown user'}</dd>
              </div>
              <div>
                <dt>Channel</dt>
                <dd>{selectedTicket.channel ?? 'Unknown'}</dd>
              </div>
              <div>
                <dt>Conversation</dt>
                <dd>{selectedTicket.conversationStatus ?? 'No conversation yet'}</dd>
              </div>
              <div>
                <dt>Latest message</dt>
                <dd>{selectedTicket.latestMessage ?? 'No recent message'}</dd>
              </div>
              <div>
                <dt>Admin notes</dt>
                <dd>{selectedTicket.adminNotes?.length ? selectedTicket.adminNotes.join(' | ') : 'No admin notes yet'}</dd>
              </div>
            </dl>
          ) : (
            <div className="empty-panel">Select a ticket to inspect its live support details.</div>
          )}
        </article>

        <article className="panel">
          <h3>Recent Support Actions</h3>
          <Table
            columns={['Action', 'Ticket', 'Created']}
            rows={actions.map((action) => [
              action.action,
              action.entityId ?? 'Unknown ticket',
              formatDate(action.createdAt),
            ])}
          />
        </article>
      </div>
    </section>
  )
}
