import { useState } from 'react'
import { ExportButton, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

export function JobsOperationsView({ payload }) {
  const items = extractItems(payload)
  const [selectedJobId, setSelectedJobId] = useState(null)
  const selectedJob =
    items.find((item) => item.id === selectedJobId) ??
    items[0] ??
    null

  return (
    <section className="stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Jobs Moderation</h3>
            <p className="panel-copy">Inspect live job inventory, recruiter ownership, and application volume from admin APIs.</p>
          </div>
          <ExportButton filename="admin-jobs.csv" rows={items} />
        </div>
        <Table
          columns={['Title', 'Company', 'Type', 'Status', 'Applications', 'Recruiter']}
          rows={items.map((item) => [
            <button type="button" className="link-button" key={`${item.id}-select`} onClick={() => setSelectedJobId(item.id)}>
              {item.title}
            </button>,
            item.company,
            item.type,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            formatNumber(item.applications),
            item.recruiterName ?? item.recruiterId ?? 'Unknown',
          ])}
        />
        <PaginationMeta payload={payload} formatNumber={formatNumber} />
      </article>

      <article className="panel">
        <h3>Job Detail</h3>
        {selectedJob ? (
          <dl className="detail-list">
            <div>
              <dt>Title</dt>
              <dd>{selectedJob.title ?? 'Untitled job'}</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{selectedJob.company ?? selectedJob.companyName ?? 'Unknown company'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedJob.status ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt>Recruiter</dt>
              <dd>{selectedJob.recruiterName ?? selectedJob.recruiterId ?? 'Unknown recruiter'}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{selectedJob.description ?? 'No description returned by the API.'}</dd>
            </div>
          </dl>
        ) : (
          <div className="empty-panel">Select a job to inspect its live detail payload.</div>
        )}
      </article>
    </section>
  )
}
