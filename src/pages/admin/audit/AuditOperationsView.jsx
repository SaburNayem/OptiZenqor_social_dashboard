import { extractItems } from '../../../services/apiClient'
import { FilterForm, PaginationMeta, Table } from '../../../components/common/AdminPrimitives'

export function AuditOperationsView({
  payload,
  filters,
  selectedAuditId,
  setSelectedAuditId,
  onLoadView,
  formatDate,
  formatCell,
  formatNumber,
}) {
  const items = extractItems(payload)
  const resolvedSelectedAuditId =
    items.some((item) => item.id === selectedAuditId)
      ? selectedAuditId
      : (items[0]?.id ?? null)
  const selectedAudit = items.find((item) => item.id === resolvedSelectedAuditId) ?? null

  return (
    <section className="stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Audit Trail</h3>
            <p className="panel-copy">Filter and inspect admin actions with richer per-entry context instead of a flat log table only.</p>
          </div>
          <FilterForm
            fields={[
              { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search action, actor, entity' },
              { name: 'entityType', type: 'select', defaultValue: filters.entityType ?? '', options: ['', 'user', 'report', 'subscription', 'marketplace', 'job', 'event'] },
            ]}
            onSubmit={(query) => onLoadView('audit', { page: 1, limit: 20, ...query })}
          />
        </div>
        <Table
          columns={['Action', 'Entity', 'Actor', 'Created']}
          rows={items.map((item) => [
            <button type="button" className="link-button" key={`${item.id}-select`} onClick={() => setSelectedAuditId(item.id)}>
              {item.action}
            </button>,
            `${item.entityType}${item.entityId ? `:${item.entityId}` : ''}`,
            item.actorName ?? 'N/A',
            formatDate(item.createdAt),
          ])}
        />
        <PaginationMeta payload={payload} formatNumber={formatNumber} />
      </article>

      <article className="panel">
        <h3>Audit Entry Detail</h3>
        {selectedAudit ? (
          <dl className="detail-list">
            <div>
              <dt>Action</dt>
              <dd>{selectedAudit.action ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Entity</dt>
              <dd>{`${selectedAudit.entityType ?? 'entity'}${selectedAudit.entityId ? `:${selectedAudit.entityId}` : ''}`}</dd>
            </div>
            <div>
              <dt>Actor</dt>
              <dd>{selectedAudit.actorName ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Payload</dt>
              <dd>{formatCell(selectedAudit.metadata ?? selectedAudit.payload ?? {})}</dd>
            </div>
          </dl>
        ) : (
          <div className="empty-panel">Select an audit log entry to inspect its payload.</div>
        )}
      </article>
    </section>
  )
}
