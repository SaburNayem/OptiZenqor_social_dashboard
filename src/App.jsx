import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { DashboardView } from './components/AdminViews'
import { AdminSidebar } from './components/layout/AdminSidebar'
import { AdminTopbar } from './components/layout/AdminTopbar'
import { navigationItems } from './config/navigation'
import {
  API_BASE_URL,
  clearStoredSession,
  createApiClient,
  readStoredSession,
  writeStoredSession,
} from './services/apiClient'

function App() {
  const [session, setSession] = useState(() => readStoredSession())
  const [activeView, setActiveView] = useState('overview')
  const [viewState, setViewState] = useState({ loading: false, error: '', payload: null })
  const [viewQueries, setViewQueries] = useState({})
  const [globalNotice, setGlobalNotice] = useState('')
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(readStoredSession()?.accessToken))
  const [loginState, setLoginState] = useState({ email: '', password: '', loading: false, error: '' })
  const [settingsDraft, setSettingsDraft] = useState('{}')

  const activeItem = useMemo(
    () => navigationItems.find((item) => item.id === activeView) ?? navigationItems[0],
    [activeView],
  )

  const apiClient = useMemo(
    () =>
      createApiClient({
        getSession: () => session,
        onSessionRefresh: (nextSession) => {
          setSession(nextSession)
          writeStoredSession(nextSession)
        },
        onUnauthorized: () => {
          clearStoredSession()
          setSession(null)
        },
      }),
    [session],
  )

  const apiRequest = useCallback((endpoint, options = {}) => apiClient.request(endpoint, options), [apiClient])

  const loadView = useCallback(async (viewId, queryOverrides = null) => {
    const item = navigationItems.find((entry) => entry.id === viewId)
    if (!item) {
      return
    }

    const nextQuery =
      queryOverrides == null
        ? (viewQueries[viewId] ?? {})
        : { ...(viewQueries[viewId] ?? {}), ...queryOverrides }
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(nextQuery)) {
      if (value == null || value === '') {
        continue
      }
      searchParams.set(key, String(value))
    }
    const endpoint = searchParams.size > 0 ? `${item.endpoint}?${searchParams.toString()}` : item.endpoint

    setViewState({ loading: true, error: '', payload: null })
    try {
      const payload = await apiRequest(endpoint)
      setViewQueries((current) => ({ ...current, [viewId]: nextQuery }))
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
  }, [apiRequest, viewQueries])

  useEffect(() => {
    if (!session?.accessToken) {
      setIsBootstrapping(false)
      return
    }

    let cancelled = false

    async function bootstrapSession() {
      setIsBootstrapping(true)
      try {
        const payload = await apiRequest('/admin/auth/me')
        if (cancelled) {
          return
        }
        const nextSession = {
          ...(readStoredSession() ?? {}),
          admin: payload.data,
        }
        setSession(nextSession)
        writeStoredSession(nextSession)
        await loadView(activeItem.id)
      } catch (error) {
        if (cancelled) {
          return
        }
        clearStoredSession()
        setSession(null)
        setViewState({ loading: false, error: '', payload: null })
        setGlobalNotice(error instanceof Error ? error.message : 'Admin session expired.')
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrapSession()

    return () => {
      cancelled = true
    }
  }, [activeItem.id, apiRequest, loadView, session?.accessToken])

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
        await apiRequest('/admin/auth/logout', { method: 'POST' })
      }
    } finally {
      clearStoredSession()
      setSession(null)
      setViewState({ loading: false, error: '', payload: null })
      setGlobalNotice('Admin session closed.')
    }
  }

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

  async function revokeAdminSession(sessionId) {
    await apiRequest(`/admin/auth/sessions/${sessionId}/revoke`, {
      method: 'PATCH',
    })
    setGlobalNotice('Admin session revoked successfully.')
    await loadView('adminSessions')
  }

  async function updatePremiumPlan(planId, patch) {
    await apiRequest(`/admin/premium-plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Premium plan updated successfully.')
    await loadView('premiumPlans')
  }

  async function createPremiumPlan(patch) {
    await apiRequest('/admin/premium-plans', {
      method: 'POST',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Premium plan created successfully.')
    await loadView('premiumPlans')
  }

  async function deletePremiumPlan(planId) {
    await apiRequest(`/admin/premium-plans/${planId}`, {
      method: 'DELETE',
    })
    setGlobalNotice('Premium plan deleted successfully.')
    await loadView('premiumPlans')
  }

  async function createNotificationCampaign(patch) {
    await apiRequest('/admin/notification-campaigns', {
      method: 'POST',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Notification campaign created successfully.')
    await loadView('notifications')
  }

  async function updateSupportTicket(ticketId, patch) {
    await apiRequest(`/admin/support-operations/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Support ticket updated successfully.')
    await loadView('support')
  }

  async function updateNotificationDevice(deviceId, patch) {
    await apiRequest(`/admin/notification-devices/${deviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Notification device updated successfully.')
    await loadView('notificationDevices')
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
      <AdminSidebar
        items={navigationItems}
        activeItemId={activeItem.id}
        onSelect={setActiveView}
        onLogout={handleLogout}
      />

      <section className="workspace">
        <AdminTopbar title={activeItem.label} admin={session.admin} />

        {globalNotice ? <p className="notice-banner">{globalNotice}</p> : null}
        {isBootstrapping ? <section className="empty-panel">Restoring authenticated session...</section> : null}
        {viewState.loading && !isBootstrapping ? <section className="empty-panel">Loading live data...</section> : null}
        {viewState.error ? <section className="empty-panel error">{viewState.error}</section> : null}

        {!isBootstrapping && !viewState.loading && !viewState.error ? (
          <DashboardView
            viewId={activeItem.id}
            payload={viewState.payload}
            settingsDraft={settingsDraft}
            setSettingsDraft={setSettingsDraft}
            onUpdateUser={updateUser}
            onModerateContent={moderateContent}
            onUpdateReport={updateReport}
            onSaveSettings={saveSettings}
            onRevokeAdminSession={revokeAdminSession}
            onUpdatePremiumPlan={updatePremiumPlan}
            onCreatePremiumPlan={createPremiumPlan}
            onDeletePremiumPlan={deletePremiumPlan}
            onCreateNotificationCampaign={createNotificationCampaign}
            onUpdateSupportTicket={updateSupportTicket}
            onUpdateNotificationDevice={updateNotificationDevice}
            onLoadView={loadView}
          />
        ) : null}
      </section>
    </main>
  )
}

export default App
