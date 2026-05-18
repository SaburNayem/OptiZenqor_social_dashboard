import { useEffect, useMemo } from 'react'
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
    operationalSettings,
    loadOperationalSettings,
    loadView,
    refreshActiveView,
    actions,
  } = useAdminDashboard()

  const visibleNavigationItems = useMemo(
    () =>
      navigationItems.filter((item) => {
        const key = `dashboard.navigation.${item.id}.visible`
        if (operationalSettings[key] === false) {
          return false
        }
        if (item.id === 'posts' && operationalSettings['admin.controls.posts.visible'] === false) {
          return false
        }
        return true
      }),
    [operationalSettings],
  )

  useEffect(() => {
    if (!isBootstrapping && session?.accessToken) {
      void loadOperationalSettings()
    }
  }, [isBootstrapping, loadOperationalSettings, session?.accessToken])

  useEffect(() => {
    if (!isBootstrapping && session?.accessToken) {
      void loadView(activeItem.id)
    }
  }, [activeItem.id, isBootstrapping, loadView, session?.accessToken])

  useEffect(() => {
    if (!visibleNavigationItems.some((item) => item.id === activeItem.id)) {
      setActiveView(visibleNavigationItems[0]?.id ?? 'overview')
    }
  }, [activeItem.id, setActiveView, visibleNavigationItems])

  return (
    <main className="app-shell">
      <AdminSidebar
        items={visibleNavigationItems}
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
            operationalSettings={operationalSettings}
            onUpdateUser={actions.updateUser}
            onModerateContent={actions.moderateContent}
            onModerateComment={actions.moderateComment}
            onOpenReportTarget={actions.openReportTarget}
            onSaveSettings={actions.saveSettings}
            onRevokeAdminSession={actions.revokeAdminSession}
            onCreateAdminStaff={actions.createAdminStaff}
            onUpdateAdminStaff={actions.updateAdminStaff}
            onDeleteAdminStaff={actions.deleteAdminStaff}
            onUpdatePremiumPlan={actions.updatePremiumPlan}
            onCreatePremiumPlan={actions.createPremiumPlan}
            onDeletePremiumPlan={actions.deletePremiumPlan}
            onCreateNotificationCampaign={actions.createNotificationCampaign}
            onUpdateNotificationCampaign={actions.updateNotificationCampaign}
            onRunNotificationCampaignAction={actions.runNotificationCampaignAction}
            onDeleteNotificationCampaign={actions.deleteNotificationCampaign}
            onUpdateSupportTicket={actions.updateSupportTicket}
            onUpdateNotificationDevice={actions.updateNotificationDevice}
            onDeleteNotificationDevice={actions.deleteNotificationDevice}
            onUpdateWalletSubscription={actions.updateWalletSubscription}
            onCreateMarketplaceItem={actions.createMarketplaceItem}
            onUpdateMarketplaceItem={actions.updateMarketplaceItem}
            onDeleteMarketplaceItem={actions.deleteMarketplaceItem}
            onCreateJob={actions.createJob}
            onUpdateJob={actions.updateJob}
            onDeleteJob={actions.deleteJob}
            onCreateEvent={actions.createEvent}
            onUpdateEvent={actions.updateEvent}
            onDeleteEvent={actions.deleteEvent}
            onCreateCommunity={actions.createCommunity}
            onUpdateCommunity={actions.updateCommunity}
            onDeleteCommunity={actions.deleteCommunity}
            onCreatePage={actions.createPage}
            onUpdatePage={actions.updatePage}
            onDeletePage={actions.deletePage}
            onCreateLiveStream={actions.createLiveStream}
            onUpdateLiveStream={actions.updateLiveStream}
            onDeleteLiveStream={actions.deleteLiveStream}
            onLoadView={loadView}
          />
        ) : null}
      </section>
    </main>
  )
}
