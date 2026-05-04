import { extractPagination } from '../../services/apiClient'

export function PaginationMeta({ payload, formatNumber }) {
  const pagination = extractPagination(payload)
  if (!pagination) {
    return null
  }

  return (
    <p className="pagination-meta">
      Page {pagination.page} of {pagination.totalPages} - {formatNumber(pagination.total)} total items
    </p>
  )
}

export function ExportButton({ filename, rows, label = 'Export CSV' }) {
  const handleExport = () => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return
    }

    const columns = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row ?? {}).forEach((key) => set.add(key))
        return set
      }, new Set()),
    )
    const lines = [
      columns.join(','),
      ...rows.map((row) =>
        columns
          .map((column) => escapeCsvValue(row?.[column]))
          .join(','),
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  }

  return (
    <button type="button" onClick={handleExport} disabled={!rows?.length}>
      {label}
    </button>
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

  return <span className={`status-badge ${tone}`}>{String(value ?? 'N/A')}</span>
}

function escapeCsvValue(value) {
  if (value == null) {
    return '""'
  }

  const normalized =
    typeof value === 'object'
      ? JSON.stringify(value)
      : String(value)

  return `"${normalized.replaceAll('"', '""')}"`
}
