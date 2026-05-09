import { useState } from 'react'
import { extractItems } from '../services/apiClient'
import { FilterForm, PaginationMeta, StatusBadge, Table } from './common/AdminPrimitives'
import { OverviewView } from '../pages/admin/overview/OverviewView'
import { SupportOperationsView } from '../pages/admin/support/SupportOperationsView'
import { MarketplaceOperationsView } from '../pages/admin/marketplace/MarketplaceOperationsView'
import { JobsOperationsView } from '../pages/admin/jobs/JobsOperationsView'
import { EventsOperationsView } from '../pages/admin/events/EventsOperationsView'
import { CommunitiesOperationsView } from '../pages/admin/communities/CommunitiesOperationsView'
import { PagesOperationsView } from '../pages/admin/pages/PagesOperationsView'
import { LiveStreamsOperationsView } from '../pages/admin/live-streams/LiveStreamsOperationsView'
import {
  RevenueSnapshotView,
  SubscriptionsOperationsView,
  WalletActivityView,
  WalletSubscriptionOperationsView,
} from '../pages/admin/finance/FinanceOperationsViews'
import { AuditOperationsView } from '../pages/admin/audit/AuditOperationsView'
import { AnalyticsOperationsView, RoleAccessView } from '../pages/admin/insights/AdminInsightsViews'
import { NotificationCampaignsView, PremiumPlansView } from '../pages/admin/premium/PremiumAndNotificationsViews'
import { AdminSessionsView, NotificationDevicesView } from '../pages/admin/devices/AdminDevicesViews'

function formatNumber(value) {
  if (value == null || value === '') {
    return 'N/A'
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : 'N/A'
}

function formatDate(value) {
  if (!value) {
    return 'N/A'
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString()
}

function formatCell(value) {
  if (value == null || value === '') {
    return 'N/A'
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

function resolveColumns(items) {
  const first = items[0]
  if (!first || typeof first !== 'object') {
    return ['Message']
  }
  return Object.keys(first).slice(0, 6)
}

function resolveFilters(payload) {
  return payload?.data?.filters ?? {}
}

export function DashboardView({
  viewId,
  payload,
  settingsDraft,
  setSettingsDraft,
  onUpdateUser,
  onModerateContent,
  onModerateComment,
  onUpdateReport,
  onSaveSettings,
  onRevokeAdminSession,
  onUpdatePremiumPlan,
  onCreatePremiumPlan,
  onDeletePremiumPlan,
  onCreateNotificationCampaign,
  onUpdateNotificationCampaign,
  onRunNotificationCampaignAction,
  onDeleteNotificationCampaign,
  onUpdateSupportTicket,
  onUpdateNotificationDevice,
  onDeleteNotificationDevice,
  onUpdateWalletSubscription,
  onCreateMarketplaceItem,
  onUpdateMarketplaceItem,
  onDeleteMarketplaceItem,
  onCreateJob,
  onUpdateJob,
  onDeleteJob,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onCreateCommunity,
  onUpdateCommunity,
  onDeleteCommunity,
  onCreatePage,
  onUpdatePage,
  onDeletePage,
  onCreateLiveStream,
  onUpdateLiveStream,
  onDeleteLiveStream,
  onLoadView,
}) {
  const data = payload?.data ?? {}
  const filters = resolveFilters(payload)
  const [selectedNotificationDeviceId, setSelectedNotificationDeviceId] = useState(null)
  const [selectedWalletSubscriptionId, setSelectedWalletSubscriptionId] = useState(null)
  const [selectedWalletId, setSelectedWalletId] = useState(null)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null)
  const [selectedAuditId, setSelectedAuditId] = useState(null)
  const [premiumPlanDraft, setPremiumPlanDraft] = useState({
    code: '',
    name: '',
    price: '',
    billingInterval: 'monthly',
  })
  const [campaignDraft, setCampaignDraft] = useState({
    name: '',
    audience: 'all_users',
    schedule: '',
  })
  const [campaignEditDrafts, setCampaignEditDrafts] = useState({})

  if (viewId === 'overview') {
    return <OverviewView data={data} />
  }

  if (viewId === 'users') {
    const items = extractItems(payload)
    return (
      <section className="stack">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>User Management</h3>
              <p className="panel-copy">Search the live user base and update account state with admin-protected mutations.</p>
            </div>
            <FilterForm
              fields={[
                { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search name, username, email' },
                { name: 'role', type: 'select', defaultValue: filters.role ?? '', options: ['', 'user', 'creator', 'business', 'seller', 'recruiter'] },
                { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'Active', 'Suspended', 'Under review'] },
              ]}
              onSubmit={(query) => onLoadView('users', { page: 1, limit: 20, ...query })}
            />
          </div>
          <Table
            columns={['Name', 'Role', 'Status', 'Verification', 'Blocked', 'Actions']}
            rows={items.map((item) => [
              `${item.name} (${item.username})`,
              item.role,
              <StatusBadge value={item.status} key={`${item.id}-status`} />,
              <StatusBadge value={item.verification} key={`${item.id}-verification`} />,
              item.blocked ? 'Yes' : 'No',
              <div className="action-row" key={item.id}>
                <button type="button" onClick={() => onUpdateUser(item.id, { blocked: !item.blocked })}>
                  {item.blocked ? 'Unblock' : 'Block'}
                </button>
                <button type="button" onClick={() => onUpdateUser(item.id, { status: 'Active' })}>
                  Activate
                </button>
              </div>,
            ])}
          />
          <PaginationMeta payload={payload} />
        </article>
      </section>
    )
  }

  if (viewId === 'content' || viewId === 'posts' || viewId === 'stories' || viewId === 'reels') {
    const items = extractItems(payload).map((item) => ({
      ...item,
      targetType:
        item.targetType ??
        data.targetType ??
        (viewId === 'posts' ? 'post' : viewId === 'stories' ? 'story' : viewId === 'reels' ? 'reel' : 'post'),
    }))
    const title =
      viewId === 'posts'
        ? 'Posts'
        : viewId === 'stories'
          ? 'Stories'
          : viewId === 'reels'
            ? 'Reels'
            : 'Content Moderation'
    const copy =
      viewId === 'content'
        ? 'Filter the live queue by content type and status, then review or remove items.'
        : `Review live ${title.toLowerCase()} from the backend and apply moderation actions directly.`
    const targetTypeDefault =
      viewId === 'posts' ? 'post' : viewId === 'stories' ? 'story' : viewId === 'reels' ? 'reel' : filters.targetType ?? ''

    return (
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>{title}</h3>
            <p className="panel-copy">{copy}</p>
          </div>
          <FilterForm
            fields={[
              { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search caption, text, title' },
              ...(viewId === 'content'
                ? [{ name: 'targetType', type: 'select', defaultValue: targetTypeDefault, options: ['', 'post', 'reel', 'story'] }]
                : []),
              { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'Visible', 'Under review', 'Removed'] },
            ]}
            onSubmit={(query) =>
              onLoadView(viewId, {
                page: 1,
                limit: 20,
                ...(viewId === 'content' ? {} : { targetType: targetTypeDefault }),
                ...query,
              })
            }
          />
        </div>
        <Table
          columns={['ID', 'Type', 'Status', 'Preview', 'Created', 'Actions']}
          rows={items.map((item) => [
            item.id,
            item.targetType,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.caption ?? item.text ?? item.title ?? 'No preview text',
            formatDate(item.createdAt),
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
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'comments') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Comments</h3>
            <p className="panel-copy">Review live post comments, flag reported items, and remove abusive content through protected admin APIs.</p>
          </div>
          <FilterForm
            fields={[
              { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search comment, author, post id' },
              { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'visible', 'reported'] },
            ]}
            onSubmit={(query) => onLoadView('comments', { page: 1, limit: 20, ...query })}
          />
        </div>
        <Table
          columns={['Author', 'Status', 'Message', 'Post', 'Created', 'Actions']}
          rows={items.map((item) => [
            item.authorName ?? item.authorUsername ?? 'Unknown',
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.message,
            item.postId,
            formatDate(item.createdAt),
            <div className="action-row" key={item.id}>
              <button type="button" onClick={() => onModerateComment(item.id, { reported: !item.isReported })}>
                {item.isReported ? 'Unflag' : 'Flag'}
              </button>
              <button type="button" onClick={() => onModerateComment(item.id, { remove: true, note: 'Removed by admin' })}>
                Remove
              </button>
            </div>,
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'reports') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Reports Queue</h3>
            <p className="panel-copy">Review incoming reports, move them into review, and close them from the same queue.</p>
          </div>
          <FilterForm
            fields={[
              { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search reason, reporter, target' },
              { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'submitted', 'reviewing', 'resolved', 'rejected'] },
            ]}
            onSubmit={(query) => onLoadView('reports', { page: 1, limit: 20, ...query })}
          />
        </div>
        <Table
          columns={['Reason', 'Status', 'Reporter', 'Target', 'Actions']}
          rows={items.map((item) => [
            item.reason,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.reporterName,
            item.targetUserName ?? item.targetEntityId ?? 'N/A',
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
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'support') {
    return <SupportOperationsView payload={payload} filters={filters} onUpdateSupportTicket={onUpdateSupportTicket} onLoadView={onLoadView} />
  }

  if (viewId === 'marketplace') {
    return (
      <MarketplaceOperationsView
        payload={payload}
        onCreateMarketplaceItem={onCreateMarketplaceItem}
        onUpdateMarketplaceItem={onUpdateMarketplaceItem}
        onDeleteMarketplaceItem={onDeleteMarketplaceItem}
      />
    )
  }

  if (viewId === 'jobs') {
    return (
      <JobsOperationsView
        payload={payload}
        onCreateJob={onCreateJob}
        onUpdateJob={onUpdateJob}
        onDeleteJob={onDeleteJob}
      />
    )
  }

  if (viewId === 'events') {
    return (
      <EventsOperationsView
        payload={payload}
        onCreateEvent={onCreateEvent}
        onUpdateEvent={onUpdateEvent}
        onDeleteEvent={onDeleteEvent}
      />
    )
  }

  if (viewId === 'communities') {
    return (
      <CommunitiesOperationsView
        payload={payload}
        onCreateCommunity={onCreateCommunity}
        onUpdateCommunity={onUpdateCommunity}
        onDeleteCommunity={onDeleteCommunity}
      />
    )
  }

  if (viewId === 'pages') {
    return (
      <PagesOperationsView
        payload={payload}
        onCreatePage={onCreatePage}
        onUpdatePage={onUpdatePage}
        onDeletePage={onDeletePage}
      />
    )
  }

  if (viewId === 'liveStreams') {
    return (
      <LiveStreamsOperationsView
        payload={payload}
        onCreateLiveStream={onCreateLiveStream}
        onUpdateLiveStream={onUpdateLiveStream}
        onDeleteLiveStream={onDeleteLiveStream}
      />
    )
  }

  if (viewId === 'revenue') {
    return <RevenueSnapshotView data={data} formatDate={formatDate} formatNumber={formatNumber} />
  }

  if (viewId === 'walletSubscriptions') {
    return (
      <WalletSubscriptionOperationsView
        payload={payload}
        filters={filters}
        onLoadView={onLoadView}
        selectedWalletSubscriptionId={selectedWalletSubscriptionId}
        setSelectedWalletSubscriptionId={setSelectedWalletSubscriptionId}
        onUpdateWalletSubscription={onUpdateWalletSubscription}
        formatDate={formatDate}
        formatNumber={formatNumber}
      />
    )
  }

  if (viewId === 'wallet') {
    return (
      <WalletActivityView
        payload={payload}
        filters={filters}
        onLoadView={onLoadView}
        selectedWalletId={selectedWalletId}
        setSelectedWalletId={setSelectedWalletId}
        formatDate={formatDate}
        formatNumber={formatNumber}
      />
    )
  }

  if (viewId === 'subscriptions') {
    return (
      <SubscriptionsOperationsView
        payload={payload}
        filters={filters}
        onLoadView={onLoadView}
        selectedSubscriptionId={selectedSubscriptionId}
        setSelectedSubscriptionId={setSelectedSubscriptionId}
        onUpdateWalletSubscription={onUpdateWalletSubscription}
        formatDate={formatDate}
        formatNumber={formatNumber}
      />
    )
  }

  if (viewId === 'premiumPlans') {
    return (
      <PremiumPlansView
        payload={payload}
        filters={filters}
        onLoadView={onLoadView}
        onUpdatePremiumPlan={onUpdatePremiumPlan}
        onDeletePremiumPlan={onDeletePremiumPlan}
        onCreatePremiumPlan={onCreatePremiumPlan}
        premiumPlanDraft={premiumPlanDraft}
        setPremiumPlanDraft={setPremiumPlanDraft}
        formatNumber={formatNumber}
      />
    )
  }

  if (viewId === 'analytics') {
    return (
      <AnalyticsOperationsView
        data={data}
        formatCell={formatCell}
        formatDate={formatDate}
        formatNumber={formatNumber}
      />
    )
  }

  if (viewId === 'rbac') {
    return <RoleAccessView data={data} formatCell={formatCell} />
  }

  if (viewId === 'notifications') {
    return (
      <NotificationCampaignsView
        payload={payload}
        filters={filters}
        onLoadView={onLoadView}
        onRunNotificationCampaignAction={onRunNotificationCampaignAction}
        onDeleteNotificationCampaign={onDeleteNotificationCampaign}
        onUpdateNotificationCampaign={onUpdateNotificationCampaign}
        onCreateNotificationCampaign={onCreateNotificationCampaign}
        campaignDraft={campaignDraft}
        setCampaignDraft={setCampaignDraft}
        campaignEditDrafts={campaignEditDrafts}
        setCampaignEditDrafts={setCampaignEditDrafts}
      />
    )
  }

  if (viewId === 'notificationDevices') {
    return (
      <NotificationDevicesView
        payload={payload}
        filters={filters}
        data={data}
        onLoadView={onLoadView}
        selectedNotificationDeviceId={selectedNotificationDeviceId}
        setSelectedNotificationDeviceId={setSelectedNotificationDeviceId}
        onUpdateNotificationDevice={onUpdateNotificationDevice}
        onDeleteNotificationDevice={onDeleteNotificationDevice}
        formatDate={formatDate}
      />
    )
  }

  if (viewId === 'adminSessions') {
    return <AdminSessionsView payload={payload} onRevokeAdminSession={onRevokeAdminSession} formatDate={formatDate} />
  }

  if (viewId === 'audit') {
    return (
      <AuditOperationsView
        payload={payload}
        filters={filters}
        selectedAuditId={selectedAuditId}
        setSelectedAuditId={setSelectedAuditId}
        onLoadView={onLoadView}
        formatDate={formatDate}
        formatCell={formatCell}
        formatNumber={formatNumber}
      />
    )
  }

  if (viewId === 'settings') {
    return (
      <article className="panel">
        <h3>Operational Settings</h3>
        <form className="settings-form" onSubmit={onSaveSettings}>
          <textarea value={settingsDraft} onChange={(event) => setSettingsDraft(event.target.value)} />
          <button type="submit">Save settings</button>
        </form>
      </article>
    )
  }

  const items = extractItems(payload)
  const columns = resolveColumns(items)
  return (
    <article className="panel">
      <h3>{data.title ?? 'Live Module Data'}</h3>
      <Table
        columns={columns}
        rows={items.map((item) => columns.map((column) => formatCell(item[column])))}
      />
      <PaginationMeta payload={payload} formatNumber={formatNumber} />
    </article>
  )
}
