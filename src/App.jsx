import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
const SESSION_STORAGE_KEY = 'optizenqor_admin_session'

const navigationItems = [
  { id: 'overview', label: 'Overview', kind: 'admin', endpoint: '/admin/dashboard/overview' },
  { id: 'users', label: 'Users', kind: 'admin', endpoint: '/admin/users' },
  { id: 'content', label: 'Content', kind: 'admin', endpoint: '/admin/content' },
  { id: 'reports', label: 'Reports', kind: 'admin', endpoint: '/admin/reports' },
  { id: 'marketplace', label: 'Marketplace', kind: 'app', endpoint: '/marketplace/products' },
  { id: 'jobs', label: 'Jobs', kind: 'app', endpoint: '/jobs' },
  { id: 'events', label: 'Events', kind: 'app', endpoint: '/events' },
  { id: 'communities', label: 'Communities', kind: 'app', endpoint: '/communities' },
  { id: 'pages', label: 'Pages', kind: 'app', endpoint: '/pages' },
  { id: 'support', label: 'Support', kind: 'admin', endpoint: '/admin/support-operations' },
  { id: 'audit', label: 'Audit Logs', kind: 'admin', endpoint: '/admin/audit-logs' },
  { id: 'settings', label: 'Settings', kind: 'admin', endpoint: '/admin/settings' },
]

function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStoredSession(session) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

function clearStoredSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { success: false, message: 'Invalid API response.', data: null }
  }
  return {
    success: payload.success !== false,
    message: payload.message ?? 'Request completed.',
    data: payload.data ?? payload,
    raw: payload,
  }
}

function extractItems(payload) {
  const data = payload?.data
  if (Array.isArray(data)) {
    return data
  }
  if (Array.isArray(payload?.items)) {
    return payload.items
  }
  if (Array.isArray(payload?.results)) {
    return payload.results
  }
  if (data && typeof data === 'object') {
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        return data[key]
      }
    }
  }
  return []
}

function formatNumber(value) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0'
}

function App() {
  const [session, setSession] = useState(() => readStoredSession())
  const [activeView, setActiveView] = useState('overview')
  const [viewState, setViewState] = useState({ loading: false, error: '', payload: null })
  const [globalNotice, setGlobalNotice] = useState('')
  const [loginState, setLoginState] = useState({ email: 'admin@optizenqor.app', password: 'admin123', loading: false, error: '' })
  const [settingsDraft, setSettingsDraft] = useState('{}')

  const activeItem = useMemo(
    () => navigationItems.find((item) => item.id === activeView) ?? navigationItems[0],
    [activeView],
  )

  const refreshSession = useCallback(async () => {
    if (!session?.refreshToken) {
      return false
    }
    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || 'Unable to refresh session.')
      }

      const nextSession = {
        accessToken: payload.data?.accessToken ?? payload.data?.token ?? '',
        refreshToken: payload.data?.refreshToken ?? session.refreshToken,
        admin: payload.data?.session ?? session.admin,
      }
      setSession(nextSession)
      writeStoredSession(nextSession)
      return true
    } catch {
      clearStoredSession()
      setSession(null)
      return false
    }
  }, [session])

  const apiRequest = useCallback(async (endpoint, options = {}, allowRefresh = true) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    }

    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
    const payload = await response.json().catch(() => ({}))

    if (response.status === 401 && allowRefresh && session?.refreshToken) {
      const refreshed = await refreshSession()
      if (refreshed) {
        return apiRequest(endpoint, options, false)
      }
    }

    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || payload.error || `Request failed with ${response.status}`)
    }

    return normalizePayload(payload)
  }, [refreshSession, session])

  async function handleLogin(event) {
    event.preventDefault()
    setLoginState((current) => ({ ...current, loading: true, error: '' }))

    try {
      const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginState.email,
          password: loginState.password,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || 'Login failed.')
      }

      const nextSession = {
        accessToken: payload.data?.accessToken ?? payload.data?.token ?? '',
        refreshToken: payload.data?.refreshToken ?? '',
        admin: payload.data?.session ?? null,
      }
      setSession(nextSession)
      writeStoredSession(nextSession)
      setGlobalNotice('Admin session started successfully.')
    } catch (error) {
      setLoginState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Login failed.',
      }))
    } finally {
      setLoginState((current) => ({ ...current, loading: false }))
    }
  }

  async function handleLogout() {
    try {
      if (session?.accessToken) {
        await apiRequest('/admin/auth/logout', { method: 'POST' }, false)
      }
    } catch {
      // Ignore logout failures while clearing local session.
    } finally {
      clearStoredSession()
      setSession(null)
      setViewState({ loading: false, error: '', payload: null })
      setGlobalNotice('Admin session closed.')
    }
  }

  const loadView = useCallback(async (viewId) => {
    const item = navigationItems.find((entry) => entry.id === viewId)
    if (!item) {
      return
    }

    setViewState({ loading: true, error: '', payload: null })
    try {
      const payload = await apiRequest(item.endpoint)
      if (item.id === 'settings') {
        setSettingsDraft(JSON.stringify(payload.data, null, 2))
      }
      setViewState({ loading: false, error: '', payload })
    } catch (error) {
      setViewState({
        loading: false,
        error: error instanceof Error ? error.message : 'Unable to load the selected view.',
        payload: null,
      })
    }
  }, [apiRequest])

  useEffect(() => {
    if (!session?.accessToken) {
      return
    }
    void loadView(activeItem.id)
  }, [activeItem.id, loadView, session?.accessToken])

  async function updateUser(userId, patch) {
    await apiRequest(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('User updated successfully.')
    await loadView('users')
  }

  async function moderateContent(item, patch) {
    await apiRequest(`/admin/content/${item.targetType}/${item.id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Content moderation applied successfully.')
    await loadView('content')
  }

  async function updateReport(reportId, patch) {
    await apiRequest(`/admin/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Report updated successfully.')
    await loadView('reports')
  }

  async function saveSettings(event) {
    event.preventDefault()
    try {
      const patch = JSON.parse(settingsDraft)
      await apiRequest('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ patch }),
      })
      setGlobalNotice('Operational settings saved successfully.')
      await loadView('settings')
    } catch (error) {
      setGlobalNotice(error instanceof Error ? error.message : 'Unable to save settings.')
    }
  }

  if (!session?.accessToken) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div className="login-copy">
            <p className="eyebrow">OptiZenqor Admin</p>
            <h1>Control the platform from live PostgreSQL data.</h1>
            <p>
              This dashboard uses authenticated backend APIs only. No starter stats,
              no mock charts, and no local runtime dashboards.
            </p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={loginState.email}
                onChange={(event) =>
                  setLoginState((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={loginState.password}
                onChange={(event) =>
                  setLoginState((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>
            <button type="submit" disabled={loginState.loading}>
              {loginState.loading ? 'Signing in...' : 'Sign in'}
            </button>
            {loginState.error ? <p className="error-text">{loginState.error}</p> : null}
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">OptiZenqor Social</p>
          <h2>Admin Console</h2>
          <p className="sidebar-copy">Authenticated control plane for live platform operations.</p>
        </div>

        <nav className="sidebar-nav" aria-label="Admin sections">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === activeItem.id ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveView(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.kind === 'admin' ? 'Admin API' : 'App API'}</small>
            </button>
          ))}
        </nav>

        <button type="button" className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Authenticated session</p>
            <h1>{activeItem.label}</h1>
          </div>
          <div className="topbar-meta">
            <strong>{session.admin?.name ?? 'Admin'}</strong>
            <span>{session.admin?.role ?? 'Admin role'}</span>
          </div>
        </header>

        {globalNotice ? <p className="notice-banner">{globalNotice}</p> : null}

        {viewState.loading ? <section className="empty-panel">Loading live data...</section> : null}
        {viewState.error ? <section className="empty-panel error">{viewState.error}</section> : null}
        {!viewState.loading && !viewState.error ? (
          <DashboardView
            viewId={activeItem.id}
            payload={viewState.payload}
            settingsDraft={settingsDraft}
            setSettingsDraft={setSettingsDraft}
            onUpdateUser={updateUser}
            onModerateContent={moderateContent}
            onUpdateReport={updateReport}
            onSaveSettings={saveSettings}
          />
        ) : null}
      </section>
    </main>
  )
}

function DashboardView({
  viewId,
  payload,
  settingsDraft,
  setSettingsDraft,
  onUpdateUser,
  onModerateContent,
  onUpdateReport,
  onSaveSettings,
}) {
  const data = payload?.data ?? {}

  if (viewId === 'overview') {
    const totals = data.totals ?? {}
    const cards = [
      { label: 'Users', value: totals.users },
      { label: 'Active users', value: totals.activeUsers },
      { label: 'Posts', value: totals.posts },
      { label: 'Open reports', value: totals.openReports },
      { label: 'Support queue', value: totals.supportTickets },
      { label: 'Revenue', value: totals.revenue },
    ]

    return (
      <section className="stack">
        <div className="card-grid">
          {cards.map((card) => (
            <article key={card.label} className="metric-card">
              <span>{card.label}</span>
              <strong>{formatNumber(card.value)}</strong>
            </article>
          ))}
        </div>
        <article className="panel">
          <h3>Operational health</h3>
          <DataList
            items={[
              ['Moderation queue', data.health?.moderationQueue],
              ['Support queue', data.health?.supportQueue],
              ['Report queue', data.health?.reportQueue],
            ]}
          />
        </article>
      </section>
    )
  }

  if (viewId === 'users') {
    const items = extractItems(payload)
    return (
      <section className="stack">
        <article className="panel">
          <h3>User management</h3>
          <Table
            columns={['Name', 'Role', 'Status', 'Verification', 'Blocked', 'Actions']}
            rows={items.map((item) => [
              `${item.name} (${item.username})`,
              item.role,
              item.status,
              item.verification,
              item.blocked ? 'Yes' : 'No',
              <div className="action-row" key={item.id}>
                <button type="button" onClick={() => onUpdateUser(item.id, { blocked: !item.blocked })}>
                  {item.blocked ? 'Unblock' : 'Block'}
                </button>
                <button type="button" onClick={() => onUpdateUser(item.id, { status: 'active' })}>
                  Activate
                </button>
              </div>,
            ])}
          />
        </article>
      </section>
    )
  }

  if (viewId === 'content') {
    const items = extractItems(payload).map((item) => ({
      ...item,
      targetType: payload?.data?.targetType ?? 'post',
    }))
    return (
      <article className="panel">
        <h3>Content moderation</h3>
        <Table
          columns={['ID', 'Status', 'Preview', 'Created', 'Actions']}
          rows={items.map((item) => [
            item.id,
            item.status ?? 'n/a',
            item.caption ?? item.text ?? item.title ?? 'No preview text',
            item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown',
            <div className="action-row" key={item.id}>
              <button type="button" onClick={() => onModerateContent(item, { status: 'Under review' })}>
                Review
              </button>
              <button type="button" onClick={() => onModerateContent(item, { remove: true, note: 'Removed by admin' })}>
                Remove
              </button>
            </div>,
          ])}
        />
      </article>
    )
  }

  if (viewId === 'reports') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Reports queue</h3>
        <Table
          columns={['Reason', 'Status', 'Reporter', 'Target', 'Actions']}
          rows={items.map((item) => [
            item.reason,
            item.status,
            item.reporterName,
            item.targetUserName ?? item.targetEntityId ?? 'Unknown',
            <div className="action-row" key={item.id}>
              <button type="button" onClick={() => onUpdateReport(item.id, { status: 'reviewing', note: 'Taken into review' })}>
                Review
              </button>
              <button type="button" onClick={() => onUpdateReport(item.id, { status: 'resolved', note: 'Resolved from dashboard' })}>
                Resolve
              </button>
            </div>,
          ])}
        />
      </article>
    )
  }

  if (viewId === 'support') {
    const tickets = data.tickets ?? []
    return (
      <article className="panel">
        <h3>Support tickets</h3>
        <Table
          columns={['Subject', 'Category', 'Status', 'Priority', 'Updated']}
          rows={tickets.map((ticket) => [
            ticket.subject,
            ticket.category,
            ticket.status,
            ticket.priority,
            new Date(ticket.updatedAt).toLocaleString(),
          ])}
        />
      </article>
    )
  }

  if (viewId === 'audit') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Audit trail</h3>
        <Table
          columns={['Action', 'Entity', 'Actor', 'Created']}
          rows={items.map((item) => [
            item.action,
            `${item.entityType}${item.entityId ? `:${item.entityId}` : ''}`,
            item.actorName ?? 'System',
            new Date(item.createdAt).toLocaleString(),
          ])}
        />
      </article>
    )
  }

  if (viewId === 'settings') {
    return (
      <article className="panel">
        <h3>Operational settings</h3>
        <form className="settings-form" onSubmit={onSaveSettings}>
          <textarea value={settingsDraft} onChange={(event) => setSettingsDraft(event.target.value)} />
          <button type="submit">Save settings</button>
        </form>
      </article>
    )
  }

  const items = extractItems(payload)
  return (
    <article className="panel">
      <h3>{navigationItems.find((item) => item.id === viewId)?.label}</h3>
      <Table
        columns={resolveColumns(items)}
        rows={items.map((item) => resolveColumns(items).map((column) => formatCell(item[column])))}
      />
    </article>
  )
}

function resolveColumns(items) {
  const first = items[0]
  if (!first || typeof first !== 'object') {
    return ['Message']
  }
  return Object.keys(first).slice(0, 5)
}

function formatCell(value) {
  if (value == null) {
    return '—'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

function DataList({ items }) {
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

function Table({ columns, rows }) {
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

export default App
