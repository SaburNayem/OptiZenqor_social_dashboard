import { useEffect } from 'react'
import { API_BASE_URL } from '../../services/apiClient'
import { DashboardView } from '../../components/AdminViews'
import { AdminSidebar } from '../../components/layout/AdminSidebar'
import { AdminTopbar } from '../../components/layout/AdminTopbar'
import { NoticeBanner } from '../../components/modals/NoticeBanner'
import { navigationItems } from '../../config/navigation'
import { useAdminDashboard } from '../../hooks/useAdminDashboard'
import { useAdminSession } from '../../hooks/useAdminSession'

export function AdminWorkspacePage() {
  const { session, logout, isBootstrapping } = useAdminSession()
  const {
    activeItem,
    setActiveView,
    viewState,
    globalNotice,
    settingsDraft,
    setSettingsDraft,
    loadView,
    refreshActiveView,
    actions,
  } = useAdminDashboard()

  useEffect(() => {
    if (!isBootstrapping && session?.accessToken) {
      void loadView(activeItem.id)
    }
  }, [activeItem.id, isBootstrapping, loadView, session?.accessToken])

  return (
    <main className="app-shell">
      <AdminSidebar
        items={navigationItems}
        activeItemId={activeItem.id}
        onSelect={setActiveView}
        onLogout={logout}
      />

      <section className="workspace">
        <AdminTopbar title={activeItem.label} admin={session.admin} />

        {!API_BASE_URL ? (
          <section className="empty-panel error">
            Missing `VITE_API_BASE_URL`. Add it to your `.env` file, then reload the dashboard.
          </section>
        ) : null}
        <NoticeBanner notice={globalNotice} />
        {isBootstrapping ? <section className="empty-panel">Restoring authenticated session...</section> : null}
        {viewState.loading && !isBootstrapping ? <section className="empty-panel">Loading live data...</section> : null}
        {viewState.error ? (
          <section className="empty-panel error">
            <p>{viewState.error}</p>
            <button type="button" onClick={() => void refreshActiveView()}>
              Retry
            </button>
          </section>
        ) : null}

        {!isBootstrapping && !viewState.loading && !viewState.error ? (
          <DashboardView
            viewId={activeItem.id}
            payload={viewState.payload}
            settingsDraft={settingsDraft}
            setSettingsDraft={setSettingsDraft}
            onUpdateUser={actions.updateUser}
            onModerateContent={actions.moderateContent}
            onUpdateReport={actions.updateReport}
            onSaveSettings={actions.saveSettings}
            onRevokeAdminSession={actions.revokeAdminSession}
            onUpdatePremiumPlan={actions.updatePremiumPlan}
            onCreatePremiumPlan={actions.createPremiumPlan}
            onDeletePremiumPlan={actions.deletePremiumPlan}
            onCreateNotificationCampaign={actions.createNotificationCampaign}
            onUpdateNotificationCampaign={actions.updateNotificationCampaign}
            onRunNotificationCampaignAction={actions.runNotificationCampaignAction}
            onUpdateSupportTicket={actions.updateSupportTicket}
            onUpdateNotificationDevice={actions.updateNotificationDevice}
            onLoadView={loadView}
          />
        ) : null}
      </section>
    </main>
  )
}
