import { useState } from 'react'
import { extractItems } from '../services/apiClient'
import { FilterForm, PaginationMeta, StatusBadge, Table } from './common/AdminPrimitives'
import {
  adminAppControls,
  appSettingsSections,
  navigationItems,
  postAdminControls,
  webNavigationSections,
} from '../config/navigation'
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

function copyToClipboard(value) {
  if (!value) {
    return
  }
  if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
    void navigator.clipboard.writeText(String(value))
  }
}

function showContentDetail(item) {
  const preview = item.caption ?? item.text ?? item.title ?? 'No preview text'
  window.alert([
    `${item.targetType ?? 'content'} ${item.id}`,
    `Status: ${item.status ?? 'N/A'}`,
    '',
    preview,
  ].join('\n'))
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

function resolveBooleanSetting(settings, key, defaultValue = true) {
  const value = settings?.[key]
  return typeof value === 'boolean' ? value : defaultValue
}

function buildTogglePatch(items, getKey, nextValue) {
  return items.reduce((patch, item) => {
    patch[getKey(item)] = nextValue
    return patch
  }, {})
}

function SettingsToggleSection({ title, description, items, onShowAll, onHideAll, onToggle }) {
  return (
    <section className="settings-group">
      <div className="settings-group-header">
        <div>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
        <div className="action-row">
          <button type="button" onClick={onShowAll}>
            Show all
          </button>
          <button type="button" onClick={onHideAll}>
            Hide all
          </button>
        </div>
      </div>

      <div className="settings-toggle-grid">
        {items.map((item) => (
          <label key={item.key} className="toggle-card">
            <div>
              <strong>{item.label}</strong>
              {item.description ? <p>{item.description}</p> : null}
            </div>
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(event) => onToggle(item.key, event.target.checked)}
            />
          </label>
        ))}
      </div>
    </section>
  )
}

function AdminStaffView({
  payload,
  draft,
  setDraft,
  onCreateAdminStaff,
  onUpdateAdminStaff,
  onDeleteAdminStaff,
  formatDate,
}) {
  const items = extractItems(payload)

  const submitCreate = async (event) => {
    event.preventDefault()
    const nextDraft = {
      name: draft.name.trim(),
      email: draft.email.trim(),
      password: draft.password,
      role: draft.role,
      isActive: draft.isActive,
    }
    await onCreateAdminStaff?.(nextDraft)
    setDraft({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      isActive: true,
    })
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Create Admin</h3>
          </div>
        </div>
        <form className="filters-bar" onSubmit={(event) => void submitCreate(event)}>
          <input
            required
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="Name"
          />
          <input
            required
            type="email"
            value={draft.email}
            onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email"
          />
          <input
            required
            minLength={8}
            type="password"
            value={draft.password}
            onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))}
            placeholder="Password"
          />
          <select
            value={draft.role}
            onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
          >
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
            />
            Active
          </label>
          <button type="submit">Create</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Admin Staff</h3>
          </div>
        </div>
        <Table
          columns={['Name', 'Email', 'Role', 'Status', 'App Access', 'Created', 'Actions']}
          rows={items.map((item) => {
            const role = String(item.role ?? '').toLowerCase()
            const isSuperadmin = role === 'superadmin'
            return [
              item.name ?? 'N/A',
              item.email ?? 'N/A',
              <StatusBadge value={item.role ?? 'admin'} />,
              <StatusBadge value={item.isActive ? 'active' : 'inactive'} />,
              isSuperadmin ? 'Dashboard only' : 'Full app access',
              formatDate(item.createdAt),
              <div className="action-row" key={item.id}>
                <button
                  type="button"
                  onClick={() => onUpdateAdminStaff?.(item.id, { isActive: !item.isActive })}
                >
                  {item.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateAdminStaff?.(item.id, {
                      role: isSuperadmin ? 'admin' : 'superadmin',
                    })
                  }
                >
                  {isSuperadmin ? 'Make Admin' : 'Dashboard Only'}
                </button>
                {!isSuperadmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove admin ${item.email ?? item.id}?`)) {
                        onDeleteAdminStaff?.(item.id)
                      }
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>,
            ]
          })}
        />
        <PaginationMeta payload={payload} />
      </section>
    </>
  )
}

export function DashboardView({
  viewId,
  payload,
  settingsDraft,
  setSettingsDraft,
  operationalSettings,
  onUpdateUser,
  onModerateContent,
  onModerateComment,
  onOpenReportTarget,
  onSaveSettings,
  onRevokeAdminSession,
  onCreateAdminStaff,
  onUpdateAdminStaff,
  onDeleteAdminStaff,
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
    schedule: 'now',
    scheduleMode: 'now',
    schedulePreset: 'now',
    scheduledAt: '',
  })
  const [campaignEditDrafts, setCampaignEditDrafts] = useState({})
  const [adminStaffDraft, setAdminStaffDraft] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    isActive: true,
  })

  if (viewId === 'overview') {
    return <OverviewView data={data} />
  }

  if (viewId === 'users') {
    const items = extractItems(payload)
    const resolveAdminDuration = (label) => {
      const raw = window.prompt(`${label} hours`, '24')
      if (raw == null) {
        return null
      }
      const hours = Number(raw)
      if (!Number.isFinite(hours) || hours <= 0) {
        window.alert('Enter a valid number of hours.')
        return null
      }
      return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
    }
    const resolveAdminReason = (label, fallback) => {
      const reason = window.prompt(label, fallback)
      if (reason == null) {
        return null
      }
      const normalized = reason.trim()
      if (!normalized) {
        window.alert('Reason is required.')
        return null
      }
      return normalized
    }
    const resolveRestrictionScope = () => {
      const raw = window.prompt(
        'Restrict which features? Use comma separated names like comments, posts, chat, live, marketplace, jobs.',
        'comments, posts',
      )
      if (raw == null) {
        return null
      }
      const scope = raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      if (scope.length === 0) {
        window.alert('Add at least one feature scope.')
        return null
      }
      return scope
    }
    const enforcementSummary = (item) => {
      const moderation = item.adminModeration ?? {}
      const reason = moderation.reason || item.restrictionReason || ''
      const scope = Array.isArray(item.restrictionScope) ? item.restrictionScope.join(', ') : ''
      if (moderation.action === 'suspend' && moderation.active) {
        return `Suspended until ${formatDate(item.suspendedUntil)}${reason ? ` - ${reason}` : ''}`
      }
      if (moderation.action === 'restrict' && moderation.active) {
        return `Restricted ${scope || 'features'} until ${formatDate(item.restrictedUntil)}${reason ? ` - ${reason}` : ''}`
      }
      return item.blocked ? 'Blocked' : 'None'
    }
    const suspendUser = (item) => {
      const suspendedUntil = resolveAdminDuration('Suspend account for')
      if (!suspendedUntil) {
        return
      }
      const reason = resolveAdminReason(
        'Why is this account suspended? This appears only on the suspended login screen.',
        'Account suspended by admin review',
      )
      if (!reason) {
        return
      }
      onUpdateUser(item.id, {
        enforcementAction: 'suspend',
        suspendedUntil,
        restrictionReason: reason,
      })
    }
    const restrictUser = (item) => {
      const restrictedUntil = resolveAdminDuration('Restrict account features for')
      if (!restrictedUntil) {
        return
      }
      const restrictionScope = resolveRestrictionScope()
      if (!restrictionScope) {
        return
      }
      const reason = resolveAdminReason(
        'Why is this feature restriction being sent to the user notification inbox?',
        'Feature access restricted by admin review',
      )
      if (!reason) {
        return
      }
      onUpdateUser(item.id, {
        enforcementAction: 'restrict',
        restrictedUntil,
        restrictionScope,
        restrictionReason: reason,
      })
    }
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
                { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'Active', 'Suspended', 'Restricted', 'Under review'] },
              ]}
              onSubmit={(query) => onLoadView('users', { page: 1, limit: 20, ...query })}
            />
          </div>
          <Table
            columns={['Name', 'Role', 'Status', 'Verification', 'Limit', 'Actions']}
            rows={items.map((item) => [
              `${item.name} (${item.username})`,
              item.role,
              <StatusBadge value={item.status} key={`${item.id}-status`} />,
              <StatusBadge value={item.verification} key={`${item.id}-verification`} />,
              enforcementSummary(item),
              <div className="action-row" key={item.id}>
                <button type="button" onClick={() => onUpdateUser(item.id, { blocked: !item.blocked })}>
                  {item.blocked ? 'Unblock' : 'Block'}
                </button>
                <button type="button" onClick={() => onUpdateUser(item.id, { status: 'Active', blocked: false, enforcementAction: 'clear' })}>
                  Activate
                </button>
                <button type="button" onClick={() => suspendUser(item)}>
                  Suspend
                </button>
                <button type="button" onClick={() => restrictUser(item)}>
                  Restrict
                </button>
                <button type="button" onClick={() => onUpdateUser(item.id, { enforcementAction: 'clear', status: 'Active', blocked: false })}>
                  Clear limits
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
              <button type="button" onClick={() => showContentDetail(item)}>
                View
              </button>
              <button type="button" onClick={() => onModerateContent(item, { status: 'Under review' })}>
                Under review
              </button>
              <button type="button" onClick={() => onModerateContent(item, { status: 'Visible', note: 'Restored by admin' })}>
                Restore
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
            <p className="panel-copy">Use reports to identify the target, then open the matching admin section to review, restore, restrict, or remove it.</p>
          </div>
          <FilterForm
            fields={[
              { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search reason, reporter, target' },
              { name: 'targetType', type: 'select', defaultValue: filters.targetType ?? '', options: ['', 'user', 'post', 'reel', 'story', 'comment', 'marketplace', 'job'] },
              { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'submitted', 'reviewing', 'resolved', 'rejected'] },
            ]}
            onSubmit={(query) => onLoadView('reports', { page: 1, limit: 20, ...query })}
          />
        </div>
        <Table
          columns={['Type', 'Reason', 'Status', 'Reporter', 'Target ID', 'Where', 'Actions']}
          rows={items.map((item) => [
            <StatusBadge value={item.targetType ?? item.targetEntityType ?? 'report'} key={`${item.id}-type`} />,
            <div key={`${item.id}-reason`}>
              <strong>{item.reason}</strong>
              {item.details ? <small>{item.details}</small> : null}
            </div>,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.reporterName ?? item.reporterUserId ?? 'N/A',
            item.targetId ?? item.targetEntityId ?? item.targetUserId ?? 'N/A',
            item.actionLocation ?? 'Open the matching admin section and act there.',
            <div className="action-row" key={item.id}>
              <button type="button" onClick={() => onOpenReportTarget?.(item)} disabled={!item.targetId && !item.targetEntityId && !item.targetUserId}>
                {item.targetActionLabel ?? 'Open target'}
              </button>
              <button type="button" onClick={() => copyToClipboard(item.targetId ?? item.targetEntityId ?? item.targetUserId)}>
                Copy ID
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
        filters={filters}
        onLoadView={onLoadView}
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
        filters={filters}
        onLoadView={onLoadView}
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

  if (viewId === 'adminStaff') {
    return (
      <AdminStaffView
        payload={payload}
        draft={adminStaffDraft}
        setDraft={setAdminStaffDraft}
        onCreateAdminStaff={onCreateAdminStaff}
        onUpdateAdminStaff={onUpdateAdminStaff}
        onDeleteAdminStaff={onDeleteAdminStaff}
        formatDate={formatDate}
      />
    )
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
    const drawerItems = navigationItems.map((item) => ({
      key: `dashboard.navigation.${item.id}.visible`,
      label: item.label,
      description: 'Controls whether this section appears in the admin drawer.',
      enabled: resolveBooleanSetting(operationalSettings, `dashboard.navigation.${item.id}.visible`, true),
    }))

    const settingsSectionItems = appSettingsSections.map((item) => ({
      key: `app.settings.sections.${item.key}.visible`,
      label: item.label,
      description: 'Controls whether this section should be treated as visible in app settings.',
      enabled: resolveBooleanSetting(operationalSettings, `app.settings.sections.${item.key}.visible`, true),
    }))

    const webSectionItems = webNavigationSections.map((item) => ({
      key: `web.navigation.${item.key}.visible`,
      label: item.label,
      description: item.description,
      enabled: resolveBooleanSetting(operationalSettings, `web.navigation.${item.key}.visible`, true),
    }))

    const postControlItems = postAdminControls.map((item) => ({
      ...item,
      enabled: resolveBooleanSetting(
        operationalSettings,
        item.key,
        item.key === 'admin.controls.posts.visible' ? true : false,
      ),
    }))

    const adminAccessItems = adminAppControls.map((item) => ({
      ...item,
      enabled: resolveBooleanSetting(operationalSettings, item.key, false),
    }))

    return (
      <section className="stack">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Operational Settings</h3>
              <p className="panel-copy">
                Turn dashboard sections on or off, control which app settings areas stay visible,
                and define how much power admins have over posts and the rest of the app.
              </p>
            </div>
          </div>

          <SettingsToggleSection
            title="Dashboard Drawer Visibility"
            description="These switches control which sections appear in the admin sidebar drawer."
            items={drawerItems}
            onShowAll={() =>
              onSaveSettings(buildTogglePatch(navigationItems, (item) => `dashboard.navigation.${item.id}.visible`, true))
            }
            onHideAll={() =>
              onSaveSettings(buildTogglePatch(navigationItems, (item) => `dashboard.navigation.${item.id}.visible`, false))
            }
            onToggle={(key, checked) => onSaveSettings({ [key]: checked })}
          />

          <SettingsToggleSection
            title="App Settings Visibility"
            description="Use the same visible or invisible control for end-user settings sections."
            items={settingsSectionItems}
            onShowAll={() =>
              onSaveSettings(buildTogglePatch(appSettingsSections, (item) => `app.settings.sections.${item.key}.visible`, true))
            }
            onHideAll={() =>
              onSaveSettings(buildTogglePatch(appSettingsSections, (item) => `app.settings.sections.${item.key}.visible`, false))
            }
            onToggle={(key, checked) => onSaveSettings({ [key]: checked })}
          />

          <SettingsToggleSection
            title="Web Section Visibility"
            description="These switches are consumed by the public web frontend through `/app/config`."
            items={webSectionItems}
            onShowAll={() =>
              onSaveSettings(buildTogglePatch(webNavigationSections, (item) => `web.navigation.${item.key}.visible`, true))
            }
            onHideAll={() =>
              onSaveSettings(buildTogglePatch(webNavigationSections, (item) => `web.navigation.${item.key}.visible`, false))
            }
            onToggle={(key, checked) => onSaveSettings({ [key]: checked })}
          />

          <SettingsToggleSection
            title="Post Section Controls"
            description="These controls decide whether the dedicated posts section is visible and what post actions admins are allowed to perform."
            items={postControlItems}
            onShowAll={() => onSaveSettings(buildTogglePatch(postAdminControls, (item) => item.key, true))}
            onHideAll={() => onSaveSettings(buildTogglePatch(postAdminControls, (item) => item.key, false))}
            onToggle={(key, checked) => onSaveSettings({ [key]: checked })}
          />

          <SettingsToggleSection
            title="Admin App Access"
            description="Turn on broad operational access so admins can manage all major app areas from the console."
            items={adminAccessItems}
            onShowAll={() => onSaveSettings(buildTogglePatch(adminAppControls, (item) => item.key, true))}
            onHideAll={() => onSaveSettings(buildTogglePatch(adminAppControls, (item) => item.key, false))}
            onToggle={(key, checked) => onSaveSettings({ [key]: checked })}
          />
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Advanced JSON Settings</h3>
              <p className="panel-copy">
                Use this only when you want to edit raw operational keys directly.
              </p>
            </div>
          </div>
          <form
            className="settings-form"
            onSubmit={(event) => {
              event.preventDefault()
              onSaveSettings(event)
            }}
          >
            <textarea value={settingsDraft} onChange={(event) => setSettingsDraft(event.target.value)} />
            <button type="submit">Save raw settings</button>
          </form>
        </article>
      </section>
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
