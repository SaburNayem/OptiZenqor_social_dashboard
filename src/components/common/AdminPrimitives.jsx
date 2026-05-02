export function PaginationMeta({ payload, formatNumber }) {
  const pagination = payload?.data?.pagination
  if (!pagination) {
    return null
  }

  return (
    <p className="pagination-meta">
      Page {pagination.page} of {pagination.totalPages} - {formatNumber(pagination.total)} total items
    </p>
  )
}

export function MetricCard({ label, value, helper }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </article>
  )
}

export function ChartCard({ title, children, aside = null }) {
  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <h3>{title}</h3>
        </div>
        {aside}
      </div>
      {children}
    </article>
  )
}

export function EmptyState({ title, description }) {
  return (
    <div className="empty-panel">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

export function DataList({ items, formatNumber }) {
  return (
    <dl className="data-list">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{formatNumber(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Table({ columns, rows }) {
  if (!rows.length) {
    return <div className="empty-panel">The API returned no data for this view.</div>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatusBadge({ value }) {
  const normalized = String(value ?? 'unknown').toLowerCase()
  const tone =
    normalized.includes('resolved') || normalized.includes('active') || normalized.includes('approved')
      ? 'good'
      : normalized.includes('review') || normalized.includes('pending')
        ? 'warn'
        : normalized.includes('blocked') || normalized.includes('removed') || normalized.includes('rejected')
          ? 'bad'
          : 'neutral'

  return <span className={`status-badge ${tone}`}>{String(value ?? 'Unknown')}</span>
}
