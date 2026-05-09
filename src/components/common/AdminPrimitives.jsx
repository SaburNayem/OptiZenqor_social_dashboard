import { extractPagination } from '../../services/apiClient'

function defaultFormatNumber(value) {
  if (value == null || value === '') {
    return 'N/A'
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : String(value)
}

export function PaginationMeta({ payload, formatNumber = defaultFormatNumber }) {
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

export function DataList({ items, formatNumber = defaultFormatNumber }) {
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

export function FilterForm({ fields, onSubmit }) {
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
      {fields.map((field) => {
        if (field.type === 'select') {
          return (
            <select key={field.name} name={field.name} defaultValue={field.defaultValue}>
              <option value="">All {field.name}</option>
              {field.options.filter(Boolean).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )
        }

        return (
          <input
            key={field.name}
            name={field.name}
            type={field.type}
            defaultValue={field.defaultValue}
            placeholder={field.placeholder}
          />
        )
      })}
      <button type="submit">Apply</button>
    </form>
  )
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
