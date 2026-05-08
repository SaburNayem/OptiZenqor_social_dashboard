import { useState } from 'react'
import { ExportButton, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'
import { extractItems } from '../../../services/apiClient'

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

export function JobsOperationsView({ payload, onCreateJob, onUpdateJob, onDeleteJob }) {
  const items = extractItems(payload)
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [createDraft, setCreateDraft] = useState({
    recruiterId: '',
    title: '',
    company: '',
    description: '',
    type: 'Full-time',
    status: 'draft',
  })
  const selectedJob =
    items.find((item) => item.id === selectedJobId) ??
    items[0] ??
    null
  const [editDraft, setEditDraft] = useState(null)

  const resolvedEditDraft =
    selectedJob == null
      ? null
      : editDraft?.id === selectedJob.id
        ? editDraft
        : {
            id: selectedJob.id,
            title: selectedJob.title ?? '',
            company: selectedJob.company ?? '',
            description: selectedJob.description ?? '',
            type: selectedJob.type ?? 'Full-time',
            status: selectedJob.status ?? 'draft',
          }

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
            item.recruiterName ?? item.recruiterId ?? 'N/A',
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
              <dd>{selectedJob.company ?? selectedJob.companyName ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedJob.status ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Recruiter</dt>
              <dd>{selectedJob.recruiterName ?? selectedJob.recruiterId ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{selectedJob.description ?? 'N/A'}</dd>
            </div>
            <div>
              <dt>Actions</dt>
              <dd>
                <div className="action-row">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateJob?.(selectedJob.id, {
                        status: selectedJob.status === 'active' ? 'closed' : 'active',
                      })
                    }
                  >
                    {selectedJob.status === 'active' ? 'Close' : 'Activate'}
                  </button>
                  <button type="button" onClick={() => onDeleteJob?.(selectedJob.id)}>
                    Delete
                  </button>
                </div>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="empty-panel">Select a job to inspect its live detail payload.</div>
        )}
      </article>

      <article className="panel">
        <h3>Update Job</h3>
        {selectedJob && resolvedEditDraft ? (
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault()
              onUpdateJob?.(selectedJob.id, {
                title: resolvedEditDraft.title.trim(),
                company: resolvedEditDraft.company.trim(),
                description: resolvedEditDraft.description.trim(),
                type: resolvedEditDraft.type,
                status: resolvedEditDraft.status,
              })
            }}
          >
            <input value={resolvedEditDraft.title} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedJob.id, title: event.target.value }))} placeholder="Title" />
            <input value={resolvedEditDraft.company} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedJob.id, company: event.target.value }))} placeholder="Company" />
            <select value={resolvedEditDraft.type} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedJob.id, type: event.target.value }))}>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
            <select value={resolvedEditDraft.status} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedJob.id, status: event.target.value }))}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
            <input value={resolvedEditDraft.description} onChange={(event) => setEditDraft((current) => ({ ...(current ?? resolvedEditDraft), id: selectedJob.id, description: event.target.value }))} placeholder="Description" />
            <button type="submit">Save job</button>
          </form>
        ) : (
          <div className="empty-panel">Select a job to update its live record.</div>
        )}
      </article>

      <article className="panel">
        <h3>Create Job</h3>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault()
            onCreateJob?.({
              recruiterId: createDraft.recruiterId.trim(),
              title: createDraft.title.trim(),
              company: createDraft.company.trim(),
              description: createDraft.description.trim(),
              type: createDraft.type,
              status: createDraft.status,
            })
            setCreateDraft({
              recruiterId: '',
              title: '',
              company: '',
              description: '',
              type: 'Full-time',
              status: 'draft',
            })
          }}
        >
          <input value={createDraft.recruiterId} onChange={(event) => setCreateDraft((current) => ({ ...current, recruiterId: event.target.value }))} placeholder="Recruiter ID" />
          <input value={createDraft.title} onChange={(event) => setCreateDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Title" />
          <input value={createDraft.company} onChange={(event) => setCreateDraft((current) => ({ ...current, company: event.target.value }))} placeholder="Company" />
          <select value={createDraft.type} onChange={(event) => setCreateDraft((current) => ({ ...current, type: event.target.value }))}>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
          <select value={createDraft.status} onChange={(event) => setCreateDraft((current) => ({ ...current, status: event.target.value }))}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
          <input value={createDraft.description} onChange={(event) => setCreateDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
          <button
            type="submit"
            disabled={
              !createDraft.recruiterId.trim() ||
              !createDraft.title.trim() ||
              !createDraft.company.trim() ||
              !createDraft.description.trim()
            }
          >
            Create job
          </button>
        </form>
      </article>
    </section>
  )
}
