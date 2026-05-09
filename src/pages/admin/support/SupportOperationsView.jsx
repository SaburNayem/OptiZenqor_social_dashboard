import { useEffect, useMemo, useState } from 'react'
import { ExportButton, FilterForm, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { useAdminSession } from '../../../hooks/useAdminSession'
import { extractCollection } from '../../../services/apiClient'

function formatDate(value) {
  if (!value) {
    return 'N/A'
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString()
}

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

function HistoryTable({ title, columns, rows, emptyTitle, emptyDescription }) {
  return (
    <article className="panel">
      <h3>{title}</h3>
      {rows.length ? (
        <Table columns={columns} rows={rows} />
      ) : (
        <div className="empty-panel">
          <strong>{emptyTitle}</strong>
          <p>{emptyDescription}</p>
        </div>
      )}
    </article>
  )
}

export function SupportOperationsView({ payload, filters, onUpdateSupportTicket, onLoadView }) {
  const { apiRequest, session } = useAdminSession()
  const data = payload?.data ?? {}
  const tickets = extractCollection(payload, ['tickets', 'items', 'results'])
  const actions = data.actions ?? []
  const [selectedSupportTicketId, setSelectedSupportTicketId] = useState(null)
  const [ticketDetail, setTicketDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [detailNotice, setDetailNotice] = useState('')
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)
  const [updateDraft, setUpdateDraft] = useState({
    status: 'open',
    priority: 'normal',
    assignedAdminId: '',
    slaHours: '',
    adminNote: '',
    replyMessage: '',
  })

  const resolvedSelectedTicketId =
    tickets.some((ticket) => ticket.id === selectedSupportTicketId)
      ? selectedSupportTicketId
      : (tickets[0]?.id ?? null)

  useEffect(() => {
    let cancelled = false

    async function loadTicketDetail() {
      if (!resolvedSelectedTicketId) {
        setTicketDetail(null)
        setDetailError('')
        return
      }

      setDetailLoading(true)
      setDetailError('')
      try {
        const response = await apiRequest(`/admin/support-operations/${resolvedSelectedTicketId}`)
        if (cancelled) {
          return
        }
        const nextDetail = response?.data ?? null
        setTicketDetail(nextDetail)
        setUpdateDraft({
          status: nextDetail?.status ?? 'open',
          priority: nextDetail?.priority ?? 'normal',
          assignedAdminId:
            nextDetail?.assignedAdminId ??
            nextDetail?.assignedAdmin?.adminId ??
            nextDetail?.assignedAdmin?.id ??
            '',
          slaHours: nextDetail?.slaHours ? String(nextDetail.slaHours) : '',
          adminNote: '',
          replyMessage: '',
        })
      } catch (error) {
        if (cancelled) {
          return
        }
        setTicketDetail(null)
        setDetailError(error instanceof Error ? error.message : 'Unable to load support ticket detail.')
      } finally {
        if (!cancelled) {
          setDetailLoading(false)
        }
      }
    }

    void loadTicketDetail()

    return () => {
      cancelled = true
    }
  }, [apiRequest, detailRefreshKey, resolvedSelectedTicketId])

  const selectedTicketMessages = ticketDetail?.messages ?? []
  const selectedActionHistory = ticketDetail?.actionHistory ?? []
  const selectedAssignmentHistory = ticketDetail?.assignmentHistory ?? []
  const ticketMetadata = useMemo(
    () => ({
      assignedAdminLabel:
        ticketDetail?.assignedAdminName ??
        ticketDetail?.assignedAdmin?.name ??
        ticketDetail?.assignedAdminId ??
        'Unassigned',
      userLabel:
        ticketDetail?.userLabel ??
        ticketDetail?.userName ??
        ticketDetail?.username ??
        ticketDetail?.userEmail ??
        'N/A',
    }),
    [ticketDetail],
  )

  async function handleQuickUpdate(ticketId, patch, successMessage) {
    try {
      await onUpdateSupportTicket(ticketId, patch)
      setDetailNotice(successMessage)
      setDetailRefreshKey((current) => current + 1)
    } catch (error) {
      setDetailNotice(error instanceof Error ? error.message : 'Unable to update support ticket.')
    }
  }

  async function handleDetailSubmit(event) {
    event.preventDefault()
    if (!resolvedSelectedTicketId) {
      return
    }

    const patch = {
      status: updateDraft.status,
      priority: updateDraft.priority,
      assignedAdminId: updateDraft.assignedAdminId.trim() || undefined,
      slaHours: updateDraft.slaHours ? Number(updateDraft.slaHours) : undefined,
      adminNote: updateDraft.adminNote.trim() || undefined,
      replyMessage: updateDraft.replyMessage.trim() || undefined,
    }

    try {
      await onUpdateSupportTicket(resolvedSelectedTicketId, patch)
      setDetailNotice('Support ticket detail updated successfully.')
      setUpdateDraft((current) => ({
        ...current,
        adminNote: '',
        replyMessage: '',
      }))
      setDetailRefreshKey((current) => current + 1)
    } catch (error) {
      setDetailNotice(error instanceof Error ? error.message : 'Unable to update support ticket detail.')
    }
  }

  return (
    <section className="stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Support Operations</h3>
            <p className="panel-copy">Search the live queue, change ticket state, assign ownership, and keep a history-backed trail.</p>
          </div>
          <div className="support-toolbar">
            <ExportButton filename="admin-support-tickets.csv" rows={tickets} />
            <FilterForm
              fields={[
                { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search subject, category, user' },
                { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'open', 'reviewing', 'resolved', 'closed'] },
                { name: 'priority', type: 'select', defaultValue: filters.priority ?? '', options: ['', 'low', 'normal', 'high', 'urgent'] },
              ]}
              onSubmit={(query) => onLoadView('support', { page: 1, limit: 20, ...query })}
            />
          </div>
        </div>
        <Table
          columns={['Subject', 'User', 'Category', 'Status', 'Priority', 'Updated', 'Actions']}
          rows={tickets.map((ticket) => [
            <button type="button" className="link-button" key={`${ticket.id}-select`} onClick={() => setSelectedSupportTicketId(ticket.id)}>
              {ticket.subject}
            </button>,
            ticket.userLabel ?? ticket.userName ?? ticket.username ?? ticket.userEmail ?? 'N/A',
            ticket.category,
            <StatusBadge value={ticket.status} key={`${ticket.id}-status`} />,
            <StatusBadge value={ticket.priority} key={`${ticket.id}-priority`} />,
            formatDate(ticket.updatedAt),
            <div className="action-row" key={ticket.id}>
              <button type="button" onClick={() => handleQuickUpdate(ticket.id, { status: 'reviewing' }, 'Ticket moved into review.')}>
                Review
              </button>
              <button type="button" onClick={() => handleQuickUpdate(ticket.id, { priority: 'high' }, 'Ticket escalated to high priority.')}>
                Escalate
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickUpdate(
                    ticket.id,
                    {
                      status: 'resolved',
                      adminNote: 'Resolved from admin dashboard',
                    },
                    'Ticket resolved successfully.',
                  )}
              >
                Resolve
              </button>
            </div>,
          ])}
        />
        <PaginationMeta payload={payload} formatNumber={formatNumber} />
      </article>

      <div className="detail-grid support-detail-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Ticket Detail</h3>
              <p className="panel-copy">Inspect the selected ticket, conversation state, and current assignment.</p>
            </div>
            {resolvedSelectedTicketId ? (
              <button type="button" onClick={() => setDetailRefreshKey((current) => current + 1)}>
                Refresh detail
              </button>
            ) : null}
          </div>

          {detailNotice ? <p className="notice-banner">{detailNotice}</p> : null}

          {detailLoading ? (
            <div className="empty-panel">Loading live support ticket detail...</div>
          ) : detailError ? (
            <div className="empty-panel error">
              <strong>Unable to load ticket detail</strong>
              <p>{detailError}</p>
            </div>
          ) : ticketDetail ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>Subject</dt>
                  <dd>{ticketDetail.subject}</dd>
                </div>
                <div>
                  <dt>User</dt>
                  <dd>{ticketMetadata.userLabel}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{ticketDetail.category ?? 'N/A'}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd><StatusBadge value={ticketDetail.status} /></dd>
                </div>
                <div>
                  <dt>Priority</dt>
                  <dd><StatusBadge value={ticketDetail.priority} /></dd>
                </div>
                <div>
                  <dt>Assigned admin</dt>
                  <dd>{ticketMetadata.assignedAdminLabel}</dd>
                </div>
                <div>
                  <dt>Conversation</dt>
                  <dd>{ticketDetail.conversationStatus ?? 'N/A'}</dd>
                </div>
                <div>
                  <dt>Channel</dt>
                  <dd>{ticketDetail.channel ?? 'N/A'}</dd>
                </div>
                <div>
                  <dt>Latest message</dt>
                  <dd>{ticketDetail.latestMessage ?? 'N/A'}</dd>
                </div>
                <div>
                  <dt>SLA</dt>
                  <dd>
                    {ticketDetail.slaHours ? `${ticketDetail.slaHours} hours` : 'N/A'}
                    {ticketDetail.slaDueAt ? ` • due ${formatDate(ticketDetail.slaDueAt)}` : ''}
                  </dd>
                </div>
                <div>
                  <dt>Notes</dt>
                  <dd>{ticketDetail.adminNotes?.length ? ticketDetail.adminNotes.join(' | ') : 'N/A'}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(ticketDetail.createdAt)}</dd>
                </div>
              </dl>

              <form className="support-detail-form" onSubmit={handleDetailSubmit}>
                <label>
                  <span>Status</span>
                  <select value={updateDraft.status} onChange={(event) => setUpdateDraft((current) => ({ ...current, status: event.target.value }))}>
                    <option value="open">open</option>
                    <option value="reviewing">reviewing</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                </label>
                <label>
                  <span>Priority</span>
                  <select value={updateDraft.priority} onChange={(event) => setUpdateDraft((current) => ({ ...current, priority: event.target.value }))}>
                    <option value="low">low</option>
                    <option value="normal">normal</option>
                    <option value="high">high</option>
                    <option value="urgent">urgent</option>
                  </select>
                </label>
                <label>
                  <span>Assigned admin ID</span>
                  <input
                    value={updateDraft.assignedAdminId}
                    onChange={(event) => setUpdateDraft((current) => ({ ...current, assignedAdminId: event.target.value }))}
                    placeholder={session?.admin?.adminId ?? 'Assign admin id'}
                  />
                </label>
                <label>
                  <span>SLA hours</span>
                  <input
                    type="number"
                    min="1"
                    value={updateDraft.slaHours}
                    onChange={(event) => setUpdateDraft((current) => ({ ...current, slaHours: event.target.value }))}
                    placeholder="24"
                  />
                </label>
                <label className="support-form-span">
                  <span>Admin note</span>
                  <textarea
                    value={updateDraft.adminNote}
                    onChange={(event) => setUpdateDraft((current) => ({ ...current, adminNote: event.target.value }))}
                    placeholder="Add an internal support note"
                    rows={3}
                  />
                </label>
                <label className="support-form-span">
                  <span>Reply message</span>
                  <textarea
                    value={updateDraft.replyMessage}
                    onChange={(event) => setUpdateDraft((current) => ({ ...current, replyMessage: event.target.value }))}
                    placeholder="Send a reply into the ticket conversation"
                    rows={4}
                  />
                </label>
                <div className="support-form-actions">
                  <button type="submit">Save ticket update</button>
                  <button
                    type="button"
                    onClick={() =>
                      setUpdateDraft((current) => ({
                        ...current,
                        assignedAdminId: session?.admin?.adminId ?? current.assignedAdminId,
                      }))}
                  >
                    Assign to me
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setUpdateDraft((current) => ({
                        ...current,
                        status: 'resolved',
                        adminNote: current.adminNote || 'Resolved from support operations workspace.',
                      }))}
                  >
                    Prefill resolve
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="empty-panel">Select a ticket to inspect its live support details.</div>
          )}
        </article>

        <HistoryTable
          title="Conversation History"
          columns={['Sender', 'Type', 'Message', 'Created']}
          rows={selectedTicketMessages.map((message) => [
            message.senderUserId ?? message.senderType ?? 'N/A',
            message.senderType ?? 'N/A',
            message.body ?? 'N/A',
            formatDate(message.createdAt),
          ])}
          emptyTitle="No messages yet"
          emptyDescription="This support ticket does not have a synced conversation history yet."
        />
      </div>

      <div className="detail-grid support-detail-grid">
        <HistoryTable
          title="Action History"
          columns={['Action', 'Actor', 'Reason / Note', 'Created']}
          rows={selectedActionHistory.map((entry) => [
            entry.action ?? 'N/A',
            entry.actorLabel ?? entry.actorAdminName ?? entry.actorUserName ?? 'N/A',
            entry.reason ?? entry.note ?? 'N/A',
            formatDate(entry.createdAt),
          ])}
          emptyTitle="No action history"
          emptyDescription="No support action history entries were returned for the selected ticket."
        />

        <HistoryTable
          title="Assignment History"
          columns={['From', 'To', 'Actor', 'Created']}
          rows={selectedAssignmentHistory.map((entry) => [
            entry.previousAdminLabel ?? entry.previousAdminName ?? 'Unassigned',
            entry.nextAdminLabel ?? entry.nextAdminName ?? 'Unassigned',
            entry.actorLabel ?? entry.actorAdminName ?? entry.actorUserName ?? 'N/A',
            formatDate(entry.createdAt),
          ])}
          emptyTitle="No assignment history"
          emptyDescription="No assignment history entries were returned for the selected ticket."
        />
      </div>

      <HistoryTable
        title="Recent Support Actions"
        columns={['Action', 'Ticket', 'Created']}
        rows={actions.map((action) => [
          action.action,
          action.entityId ?? 'N/A',
          formatDate(action.createdAt),
        ])}
        emptyTitle="No recent actions"
        emptyDescription="The backend returned no recent support audit actions for this queue."
      />
    </section>
  )
}
