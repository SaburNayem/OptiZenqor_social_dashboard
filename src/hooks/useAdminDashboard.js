import { useCallback, useMemo, useRef, useState } from 'react'
import { navigationItems } from '../config/navigation'
import { useAdminSession } from './useAdminSession'

function resolveReportTargetModule(report) {
  const targetModule = report?.targetModule
  if (targetModule && targetModule !== 'reports') {
    return targetModule
  }

  switch (String(report?.targetType ?? report?.targetEntityType ?? '').toLowerCase()) {
    case 'user':
      return 'users'
    case 'post':
      return 'posts'
    case 'reel':
      return 'reels'
    case 'story':
      return 'stories'
    case 'comment':
    case 'post_comment':
      return 'comments'
    case 'marketplace':
    case 'marketplace_product':
    case 'product':
      return 'marketplace'
    case 'job':
      return 'jobs'
    default:
      return ''
  }
}

export function useAdminDashboard() {
  const { apiRequest } = useAdminSession()
  const [activeView, setActiveView] = useState('overview')
  const [viewState, setViewState] = useState({ loading: false, error: '', payload: null })
  const viewQueriesRef = useRef({})
  const [globalNotice, setGlobalNotice] = useState('')
  const [settingsDraft, setSettingsDraft] = useState('{}')
  const [operationalSettings, setOperationalSettings] = useState({})

  const activeItem = useMemo(
    () => navigationItems.find((item) => item.id === activeView) ?? navigationItems[0],
    [activeView],
  )

  const loadOperationalSettings = useCallback(async () => {
    const payload = await apiRequest('/admin/settings')
    const nextSettings = payload?.data && typeof payload.data === 'object' ? payload.data : {}
    setOperationalSettings(nextSettings)
    setSettingsDraft(JSON.stringify(nextSettings, null, 2))
    return nextSettings
  }, [apiRequest])

  const loadView = useCallback(async (viewId, queryOverrides = null) => {
    const item = navigationItems.find((entry) => entry.id === viewId)
    if (!item) {
      return
    }

    const nextQuery =
      queryOverrides == null
        ? (viewQueriesRef.current[viewId] ?? {})
        : { ...(viewQueriesRef.current[viewId] ?? {}), ...queryOverrides }

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
      viewQueriesRef.current = { ...viewQueriesRef.current, [viewId]: nextQuery }
      if (item.id === 'settings') {
        const nextSettings = payload?.data && typeof payload.data === 'object' ? payload.data : {}
        setOperationalSettings(nextSettings)
        setSettingsDraft(JSON.stringify(nextSettings, null, 2))
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

  const refreshActiveView = useCallback(async () => {
    await loadView(activeItem.id)
  }, [activeItem.id, loadView])

  const updateUser = useCallback(async (userId, patch) => {
    await apiRequest(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('User updated successfully.')
    await loadView('users')
  }, [apiRequest, loadView])

  const moderateContent = useCallback(async (item, patch) => {
    await apiRequest(`/admin/content/${item.targetType}/${item.id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Content moderation applied successfully.')
    const refreshViewId =
      item.targetType === 'post'
        ? 'posts'
        : item.targetType === 'story'
          ? 'stories'
          : item.targetType === 'reel'
            ? 'reels'
            : activeItem.id === 'content'
              ? 'content'
              : activeItem.id
    await loadView(refreshViewId)
  }, [activeItem.id, apiRequest, loadView])

  const moderateComment = useCallback(async (commentId, patch) => {
    await apiRequest(`/admin/comments/${commentId}/moderation`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Comment moderation applied successfully.')
    await loadView('comments')
  }, [apiRequest, loadView])

  const updateReport = useCallback(async (reportId, patch) => {
    await apiRequest(`/admin/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Report updated successfully.')
    await loadView('reports')
  }, [apiRequest, loadView])

  const openReportTarget = useCallback(async (report) => {
    let targetModule = resolveReportTargetModule(report)
    const targetType = String(report?.targetType ?? report?.targetEntityType ?? '').toLowerCase()
    if (targetModule === 'posts' && operationalSettings['admin.controls.posts.visible'] === false) {
      targetModule = 'content'
    }
    const targetSearch =
      report?.targetSearch ??
      report?.targetId ??
      report?.targetEntityId ??
      report?.targetUserId ??
      ''

    if (!targetModule || !targetSearch) {
      setGlobalNotice('This report has no openable target. Copy the target ID and search manually.')
      return
    }

    const query = {
      page: 1,
      limit: 20,
      search: targetSearch,
      ...(targetModule === 'content' && targetType ? { targetType } : {}),
    }
    viewQueriesRef.current = {
      ...viewQueriesRef.current,
      [targetModule]: {
        ...(viewQueriesRef.current[targetModule] ?? {}),
        ...query,
      },
    }
    setActiveView(targetModule)
    await loadView(targetModule, query)
  }, [loadView, operationalSettings])

  const saveSettings = useCallback(async (input) => {
    try {
      const patch =
        input && typeof input === 'object' && !('preventDefault' in input)
          ? input
          : JSON.parse(settingsDraft)
      await apiRequest('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ patch }),
      })
      setGlobalNotice('Operational settings saved successfully.')
      await loadOperationalSettings()
      if (activeItem.id === 'settings') {
        await loadView('settings')
      }
    } catch (error) {
      setGlobalNotice(error instanceof Error ? error.message : 'Unable to save settings.')
    }
  }, [activeItem.id, apiRequest, loadOperationalSettings, loadView, settingsDraft])

  const revokeAdminSession = useCallback(async (sessionId) => {
    await apiRequest(`/admin/auth/sessions/${sessionId}/revoke`, {
      method: 'PATCH',
    })
    setGlobalNotice('Admin session revoked successfully.')
    await loadView('adminSessions')
  }, [apiRequest, loadView])

  const createAdminStaff = useCallback(async (patch) => {
    await apiRequest('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(patch),
    })
    setGlobalNotice(
      patch.role === 'superadmin'
        ? 'Superadmin staff created for dashboard access.'
        : 'Admin staff created. This admin can sign into the app.',
    )
    await loadView('adminStaff')
  }, [apiRequest, loadView])

  const updateAdminStaff = useCallback(async (staffId, patch) => {
    await apiRequest(`/admin/staff/${staffId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Admin staff updated successfully.')
    await loadView('adminStaff')
  }, [apiRequest, loadView])

  const deleteAdminStaff = useCallback(async (staffId) => {
    await apiRequest(`/admin/staff/${staffId}/remove`, {
      method: 'POST',
    })
    setGlobalNotice('Admin staff removed successfully.')
    await loadView('adminStaff')
  }, [apiRequest, loadView])

  const updatePremiumPlan = useCallback(async (planId, patch) => {
    await apiRequest(`/admin/premium-plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Premium plan updated successfully.')
    await loadView('premiumPlans')
  }, [apiRequest, loadView])

  const createPremiumPlan = useCallback(async (patch) => {
    await apiRequest('/admin/premium-plans', {
      method: 'POST',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Premium plan created successfully.')
    await loadView('premiumPlans')
  }, [apiRequest, loadView])

  const deletePremiumPlan = useCallback(async (planId) => {
    await apiRequest(`/admin/premium-plans/${planId}`, {
      method: 'DELETE',
    })
    setGlobalNotice('Premium plan deleted successfully.')
    await loadView('premiumPlans')
  }, [apiRequest, loadView])

  const createNotificationCampaign = useCallback(async (patch) => {
    await apiRequest('/admin/notification-campaigns', {
      method: 'POST',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Notification campaign created successfully.')
    await loadView('notifications')
  }, [apiRequest, loadView])

  const updateNotificationCampaign = useCallback(async (campaignId, patch) => {
    await apiRequest(`/admin/notification-campaigns/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Notification campaign updated successfully.')
    await loadView('notifications')
  }, [apiRequest, loadView])

  const runNotificationCampaignAction = useCallback(async (campaignId, action, patch = {}) => {
    await apiRequest(`/admin/notification-campaigns/${campaignId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action, ...patch }),
    })
    setGlobalNotice(`Notification campaign ${action} completed successfully.`)
    await loadView('notifications')
  }, [apiRequest, loadView])

  const deleteNotificationCampaign = useCallback(async (campaignId) => {
    await apiRequest(`/admin/notification-campaigns/${campaignId}`, {
      method: 'DELETE',
    })
    setGlobalNotice('Notification campaign deleted successfully.')
    await loadView('notifications')
  }, [apiRequest, loadView])

  const updateSupportTicket = useCallback(async (ticketId, patch) => {
    await apiRequest(`/admin/support-operations/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Support ticket updated successfully.')
    await loadView('support')
  }, [apiRequest, loadView])

  const updateNotificationDevice = useCallback(async (deviceId, patch) => {
    await apiRequest(`/admin/notification-devices/${deviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Notification device updated successfully.')
    await loadView('notificationDevices')
  }, [apiRequest, loadView])

  const deleteNotificationDevice = useCallback(async (deviceId) => {
    await apiRequest(`/admin/notification-devices/${deviceId}`, {
      method: 'DELETE',
    })
    setGlobalNotice('Notification device deleted successfully.')
    await loadView('notificationDevices')
  }, [apiRequest, loadView])

  const updateWalletSubscription = useCallback(async (recordId, patch) => {
    await apiRequest(`/admin/wallet-subscriptions/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Wallet or subscription record updated successfully.')
    await loadView('walletSubscriptions')
    await loadView('subscriptions')
  }, [apiRequest, loadView])

  const createMarketplaceItem = useCallback(async (patch) => {
    await apiRequest('/admin/marketplace', {
      method: 'POST',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Marketplace item created successfully.')
    await loadView('marketplace')
  }, [apiRequest, loadView])

  const updateMarketplaceItem = useCallback(async (itemId, patch) => {
    await apiRequest(`/admin/marketplace/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Marketplace item updated successfully.')
    await loadView('marketplace')
  }, [apiRequest, loadView])

  const deleteMarketplaceItem = useCallback(async (itemId) => {
    await apiRequest(`/admin/marketplace/${itemId}`, {
      method: 'DELETE',
    })
    setGlobalNotice('Marketplace item deleted successfully.')
    await loadView('marketplace')
  }, [apiRequest, loadView])

  const createJob = useCallback(async (patch) => {
    await apiRequest('/admin/jobs', {
      method: 'POST',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Job created successfully.')
    await loadView('jobs')
  }, [apiRequest, loadView])

  const updateJob = useCallback(async (jobId, patch) => {
    await apiRequest(`/admin/jobs/${jobId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Job updated successfully.')
    await loadView('jobs')
  }, [apiRequest, loadView])

  const deleteJob = useCallback(async (jobId) => {
    await apiRequest(`/admin/jobs/${jobId}`, {
      method: 'DELETE',
    })
    setGlobalNotice('Job deleted successfully.')
    await loadView('jobs')
  }, [apiRequest, loadView])

  const createEvent = useCallback(async (patch) => {
    await apiRequest('/admin/events', {
      method: 'POST',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Event created successfully.')
    await loadView('events')
  }, [apiRequest, loadView])

  const updateEvent = useCallback(async (eventId, patch) => {
    await apiRequest(`/admin/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Event updated successfully.')
    await loadView('events')
  }, [apiRequest, loadView])

  const deleteEvent = useCallback(async (eventId) => {
    await apiRequest(`/admin/events/${eventId}`, {
      method: 'DELETE',
    })
    setGlobalNotice('Event deleted successfully.')
    await loadView('events')
  }, [apiRequest, loadView])

  const updateCommunity = useCallback(async (communityId, patch) => {
    await apiRequest(`/admin/communities/${communityId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Community updated successfully.')
    await loadView('communities')
  }, [apiRequest, loadView])

  const createCommunity = useCallback(async (patch) => {
    await apiRequest('/admin/communities', {
      method: 'POST',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Community created successfully.')
    await loadView('communities')
  }, [apiRequest, loadView])

  const deleteCommunity = useCallback(async (communityId) => {
    await apiRequest(`/admin/communities/${communityId}`, {
      method: 'DELETE',
    })
    setGlobalNotice('Community deleted successfully.')
    await loadView('communities')
  }, [apiRequest, loadView])

  const updatePage = useCallback(async (pageId, patch) => {
    await apiRequest(`/admin/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Page updated successfully.')
    await loadView('pages')
  }, [apiRequest, loadView])

  const createPage = useCallback(async (patch) => {
    await apiRequest('/admin/pages', {
      method: 'POST',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Page created successfully.')
    await loadView('pages')
  }, [apiRequest, loadView])

  const deletePage = useCallback(async (pageId) => {
    await apiRequest(`/admin/pages/${pageId}`, {
      method: 'DELETE',
    })
    setGlobalNotice('Page deleted successfully.')
    await loadView('pages')
  }, [apiRequest, loadView])

  const updateLiveStream = useCallback(async (streamId, patch) => {
    await apiRequest(`/admin/live-streams/${streamId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Live stream updated successfully.')
    await loadView('liveStreams')
  }, [apiRequest, loadView])

  const createLiveStream = useCallback(async (patch) => {
    await apiRequest('/admin/live-streams', {
      method: 'POST',
      body: JSON.stringify(patch),
    })
    setGlobalNotice('Live stream created successfully.')
    await loadView('liveStreams')
  }, [apiRequest, loadView])

  const deleteLiveStream = useCallback(async (streamId) => {
    await apiRequest(`/admin/live-streams/${streamId}`, {
      method: 'DELETE',
    })
    setGlobalNotice('Live stream deleted successfully.')
    await loadView('liveStreams')
  }, [apiRequest, loadView])

  return {
    activeItem,
    activeView,
    setActiveView,
    viewState,
    globalNotice,
    setGlobalNotice,
    settingsDraft,
    setSettingsDraft,
    operationalSettings,
    loadOperationalSettings,
    loadView,
    refreshActiveView,
    actions: {
      updateUser,
      moderateContent,
      moderateComment,
      updateReport,
      openReportTarget,
      saveSettings,
      revokeAdminSession,
      createAdminStaff,
      updateAdminStaff,
      deleteAdminStaff,
      updatePremiumPlan,
      createPremiumPlan,
      deletePremiumPlan,
      createNotificationCampaign,
      updateNotificationCampaign,
      runNotificationCampaignAction,
      deleteNotificationCampaign,
      updateSupportTicket,
      updateNotificationDevice,
      deleteNotificationDevice,
      updateWalletSubscription,
      createMarketplaceItem,
      updateMarketplaceItem,
      deleteMarketplaceItem,
      createJob,
      updateJob,
      deleteJob,
      createEvent,
      updateEvent,
      deleteEvent,
      createCommunity,
      updateCommunity,
      deleteCommunity,
      createPage,
      updatePage,
      deletePage,
      createLiveStream,
      updateLiveStream,
      deleteLiveStream,
    },
  }
}
