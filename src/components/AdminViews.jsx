import { useState } from 'react'
import { extractItems, extractPagination } from '../services/apiClient'
import { OverviewView } from '../pages/admin/overview/OverviewView'
import { SupportOperationsView } from '../pages/admin/support/SupportOperationsView'
import { MarketplaceOperationsView } from '../pages/admin/marketplace/MarketplaceOperationsView'
import { JobsOperationsView } from '../pages/admin/jobs/JobsOperationsView'
import { EventsOperationsView } from '../pages/admin/events/EventsOperationsView'
import { CommunitiesOperationsView } from '../pages/admin/communities/CommunitiesOperationsView'
import { PagesOperationsView } from '../pages/admin/pages/PagesOperationsView'
import { LiveStreamsOperationsView } from '../pages/admin/live-streams/LiveStreamsOperationsView'

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
  onUpdateReport,
  onSaveSettings,
  onRevokeAdminSession,
  onUpdatePremiumPlan,
  onCreatePremiumPlan,
  onDeletePremiumPlan,
  onCreateNotificationCampaign,
  onUpdateNotificationCampaign,
  onRunNotificationCampaignAction,
  onUpdateSupportTicket,
  onUpdateNotificationDevice,
  onLoadView,
}) {
  const data = payload?.data ?? {}
  const filters = resolveFilters(payload)
  const [selectedNotificationDeviceId, setSelectedNotificationDeviceId] = useState(null)
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

  if (viewId === 'content') {
    const items = extractItems(payload).map((item) => ({
      ...item,
      targetType: item.targetType ?? data.targetType ?? 'post',
    }))

    return (
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Content Moderation</h3>
            <p className="panel-copy">Filter the live queue by content type and status, then review or remove items.</p>
          </div>
          <FilterForm
            fields={[
              { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search caption, text, title' },
              { name: 'targetType', type: 'select', defaultValue: filters.targetType ?? '', options: ['', 'post', 'reel', 'story'] },
              { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'Visible', 'Under review', 'Removed'] },
            ]}
            onSubmit={(query) => onLoadView('content', { page: 1, limit: 20, ...query })}
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
    return <MarketplaceOperationsView payload={payload} />
  }

  if (viewId === 'jobs') {
    return <JobsOperationsView payload={payload} />
  }

  if (viewId === 'events') {
    return <EventsOperationsView payload={payload} />
  }

  if (viewId === 'communities') {
    return <CommunitiesOperationsView payload={payload} />
  }

  if (viewId === 'pages') {
    return <PagesOperationsView payload={payload} />
  }

  if (viewId === 'liveStreams') {
    return <LiveStreamsOperationsView payload={payload} />
  }

  if (viewId === 'revenue') {
    return (
      <section className="stack">
        <article className="panel">
          <h3>Revenue Snapshot</h3>
          <DataList
            items={[
              ['Total revenue', data.totalRevenue],
              ['Completed transactions', data.completedTransactions],
              ['Active subscriptions', data.activeSubscriptions],
              ['Plans', data.plans?.length ?? 0],
            ]}
          />
        </article>
        <article className="panel">
          <h3>Recent Transactions</h3>
          <Table
            columns={['ID', 'Amount', 'Status', 'Created']}
            rows={(data.recentTransactions ?? []).map((item) => [
              item.id,
              formatNumber(item.amount),
              <StatusBadge value={item.status} key={`${item.id}-status`} />,
              formatDate(item.createdAt),
            ])}
          />
        </article>
      </section>
    )
  }

  if (viewId === 'walletSubscriptions') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Wallet & Subscription Activity</h3>
        <Table
          columns={['Type', 'Label', 'User', 'Amount', 'Status', 'Created']}
          rows={items.map((item) => [
            item.kind,
            item.label,
            item.userName ?? item.userId ?? 'N/A',
            item.amount == null ? 'N/A' : formatNumber(item.amount),
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            formatDate(item.createdAt),
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'wallet') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Wallet Activity</h3>
        <Table
          columns={['User', 'Type', 'Amount', 'Currency', 'Status', 'Created']}
          rows={items.map((item) => [
            item.userName ?? item.userId ?? 'N/A',
            item.type,
            formatNumber(item.amount),
            item.currency ?? 'BDT',
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            formatDate(item.createdAt),
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'subscriptions') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Subscriptions</h3>
        <Table
          columns={['User', 'Plan', 'Provider', 'Status', 'Auto Renew', 'Period End']}
          rows={items.map((item) => [
            item.userName ?? item.userId ?? 'N/A',
            item.planName ?? item.planCode ?? 'N/A',
            item.provider,
            <StatusBadge value={item.status} key={`${item.id}-status`} />,
            item.autoRenew ? 'Yes' : 'No',
            formatDate(item.currentPeriodEnd),
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
    )
  }

  if (viewId === 'premiumPlans') {
    const items = extractItems(payload)
    return (
      <section className="stack">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Premium Plans</h3>
              <p className="panel-copy">Manage the live plan catalog, including activation and deletion.</p>
            </div>
            <FilterForm
              fields={[
                { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search plan code or name' },
                { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'active', 'inactive'] },
              ]}
              onSubmit={(query) => onLoadView('premiumPlans', { page: 1, limit: 20, ...query })}
            />
          </div>
          <Table
            columns={['Name', 'Code', 'Price', 'Billing', 'Status', 'Actions']}
            rows={items.map((item) => [
              item.name,
              item.code,
              `${formatNumber(item.price)} ${item.currency ?? ''}`.trim(),
              item.billingInterval ?? 'monthly',
              <StatusBadge value={item.status} key={`${item.id}-status`} />,
              <div className="action-row" key={item.id}>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePremiumPlan(item.id, {
                      isActive: !(item.isActive === true || item.status === 'active'),
                    })
                  }
                >
                  {item.isActive === true || item.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button type="button" onClick={() => onDeletePremiumPlan(item.id)}>
                  Delete
                </button>
              </div>,
            ])}
          />
          <PaginationMeta payload={payload} />
        </article>

        <article className="panel">
          <h3>Create Premium Plan</h3>
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault()
              onCreatePremiumPlan({
                code: premiumPlanDraft.code.trim(),
                name: premiumPlanDraft.name.trim(),
                price: Number(premiumPlanDraft.price),
                billingInterval: premiumPlanDraft.billingInterval,
              })
              setPremiumPlanDraft({
                code: '',
                name: '',
                price: '',
                billingInterval: 'monthly',
              })
            }}
          >
            <input
              value={premiumPlanDraft.code}
              onChange={(event) => setPremiumPlanDraft((current) => ({ ...current, code: event.target.value }))}
              placeholder="PLAN_CODE"
            />
            <input
              value={premiumPlanDraft.name}
              onChange={(event) => setPremiumPlanDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Plan name"
            />
            <input
              value={premiumPlanDraft.price}
              onChange={(event) => setPremiumPlanDraft((current) => ({ ...current, price: event.target.value }))}
              placeholder="Price"
              type="number"
              min="0"
              step="0.01"
            />
            <select
              value={premiumPlanDraft.billingInterval}
              onChange={(event) => setPremiumPlanDraft((current) => ({ ...current, billingInterval: event.target.value }))}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button
              type="submit"
              disabled={!premiumPlanDraft.code.trim() || !premiumPlanDraft.name.trim() || !premiumPlanDraft.price}
            >
              Create plan
            </button>
          </form>
        </article>
      </section>
    )
  }

  if (viewId === 'notifications') {
    const items = extractItems(payload)
    return (
      <section className="stack">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Notification Campaigns</h3>
              <p className="panel-copy">Review scheduled outreach and create new admin campaigns against the live backend.</p>
            </div>
            <FilterForm
              fields={[
                { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search campaign or audience' },
                { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'scheduled', 'draft', 'sent'] },
              ]}
              onSubmit={(query) => onLoadView('notifications', { page: 1, limit: 20, ...query })}
            />
          </div>
          <Table
            columns={['Name', 'Audience', 'Status', 'Schedule', 'Actions']}
            rows={items.map((item) => [
              item.name ?? item.title ?? item.id,
              item.audience ?? item.segmentId ?? 'N/A',
              <StatusBadge value={item.status} key={`${item.id}-status`} />,
              item.schedule ?? item.createdAt ?? 'N/A',
              <div className="action-row" key={item.id}>
                <button type="button" onClick={() => onRunNotificationCampaignAction(item.id, 'send')} disabled={item.status === 'sent'}>
                  Send
                </button>
                <button type="button" onClick={() => onRunNotificationCampaignAction(item.id, 'cancel')} disabled={item.status === 'cancelled'}>
                  Cancel
                </button>
              </div>,
            ])}
          />
          <PaginationMeta payload={payload} />
        </article>

        <article className="panel">
          <h3>Update Notification Campaign</h3>
          <div className="stack">
            {items.map((item) => {
              const draft = campaignEditDrafts[item.id] ?? {
                name: item.name ?? '',
                audience: item.audience ?? 'all_users',
                schedule: item.schedule ?? '',
              }

              return (
                <form
                  key={`campaign-edit-${item.id}`}
                  className="inline-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    onUpdateNotificationCampaign(item.id, {
                      name: draft.name.trim(),
                      audience: draft.audience,
                      schedule: draft.schedule.trim(),
                    })
                  }}
                >
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      setCampaignEditDrafts((current) => ({
                        ...current,
                        [item.id]: { ...draft, name: event.target.value },
                      }))
                    }
                    placeholder="Campaign name"
                  />
                  <select
                    value={draft.audience}
                    onChange={(event) =>
                      setCampaignEditDrafts((current) => ({
                        ...current,
                        [item.id]: { ...draft, audience: event.target.value },
                      }))
                    }
                  >
                    <option value="all_users">All users</option>
                    <option value="verified_users">Verified users</option>
                    <option value="premium">Premium subscribers</option>
                    <option value="creators">Creators</option>
                  </select>
                  <input
                    value={draft.schedule}
                    onChange={(event) =>
                      setCampaignEditDrafts((current) => ({
                        ...current,
                        [item.id]: { ...draft, schedule: event.target.value },
                      }))
                    }
                    placeholder="Schedule timestamp"
                  />
                  <button type="submit">Update</button>
                </form>
              )
            })}
          </div>
        </article>

        <article className="panel">
          <h3>Create Notification Campaign</h3>
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault()
              onCreateNotificationCampaign({
                name: campaignDraft.name.trim(),
                audience: campaignDraft.audience,
                schedule: campaignDraft.schedule.trim(),
              })
              setCampaignDraft({
                name: '',
                audience: 'all_users',
                schedule: '',
              })
            }}
          >
            <input
              value={campaignDraft.name}
              onChange={(event) => setCampaignDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Campaign name"
            />
            <select
              value={campaignDraft.audience}
              onChange={(event) => setCampaignDraft((current) => ({ ...current, audience: event.target.value }))}
            >
              <option value="all_users">All users</option>
              <option value="verified_users">Verified users</option>
              <option value="premium">Premium subscribers</option>
              <option value="creators">Creators</option>
            </select>
            <input
              value={campaignDraft.schedule}
              onChange={(event) => setCampaignDraft((current) => ({ ...current, schedule: event.target.value }))}
              placeholder="Schedule timestamp"
            />
            <button type="submit" disabled={!campaignDraft.name.trim() || !campaignDraft.schedule.trim()}>
              Create campaign
            </button>
          </form>
        </article>
      </section>
    )
  }

  if (viewId === 'notificationDevices') {
    const items = extractItems(payload)
    const resolvedSelectedDeviceId =
      items.some((item) => item.id === selectedNotificationDeviceId)
        ? selectedNotificationDeviceId
        : (items[0]?.id ?? null)
    const selectedDevice = items.find((item) => item.id === resolvedSelectedDeviceId) ?? null

    return (
      <section className="stack">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Notification Devices</h3>
              <p className="panel-copy">Review registered push endpoints and deactivate stale or risky devices.</p>
            </div>
            <FilterForm
              fields={[
                { name: 'search', type: 'search', defaultValue: filters.search ?? '', placeholder: 'Search token, user, device' },
                { name: 'status', type: 'select', defaultValue: filters.status ?? '', options: ['', 'active', 'inactive'] },
              ]}
              onSubmit={(query) => onLoadView('notificationDevices', { page: 1, limit: 20, ...query })}
            />
          </div>
          <Table
            columns={['User', 'Platform', 'Device', 'Status', 'Last Seen', 'Actions']}
            rows={items.map((item) => [
              <button type="button" className="link-button" key={`${item.id}-select`} onClick={() => setSelectedNotificationDeviceId(item.id)}>
                {item.userName ?? item.userId ?? 'N/A'}
              </button>,
              item.platform,
              item.deviceLabel ?? 'N/A',
              <StatusBadge value={item.status} key={`${item.id}-status`} />,
              formatDate(item.lastSeenAt),
              <div className="action-row" key={item.id}>
                <button type="button" onClick={() => onUpdateNotificationDevice(item.id, { isActive: item.status !== 'active' })}>
                  {item.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>,
            ])}
          />
          <PaginationMeta payload={payload} />
        </article>

        <div className="detail-grid">
          <article className="panel">
            <h3>Device Detail</h3>
            {selectedDevice ? (
              <dl className="detail-list">
                <div>
                  <dt>User</dt>
                  <dd>{selectedDevice.userName ?? selectedDevice.userId ?? 'N/A'}</dd>
                </div>
                <div>
                  <dt>Platform</dt>
                  <dd>{selectedDevice.platform ?? 'N/A'}</dd>
                </div>
                <div>
                  <dt>Device Label</dt>
                  <dd>{selectedDevice.deviceLabel ?? 'N/A'}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{selectedDevice.status ?? 'N/A'}</dd>
                </div>
                <div>
                  <dt>Token</dt>
                  <dd>{selectedDevice.token ?? 'N/A'}</dd>
                </div>
                <div>
                  <dt>Last Seen</dt>
                  <dd>{formatDate(selectedDevice.lastSeenAt)}</dd>
                </div>
              </dl>
            ) : (
              <div className="empty-panel">Select a device to inspect its registered push endpoint.</div>
            )}
          </article>

          <article className="panel">
            <h3>Status Summary</h3>
            <DataList
              items={[
                ['Visible devices', data.pagination?.total ?? items.length],
                ['Active', items.filter((item) => item.status === 'active').length],
                ['Inactive', items.filter((item) => item.status === 'inactive').length],
              ]}
            />
          </article>
        </div>
      </section>
    )
  }

  if (viewId === 'adminSessions') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Admin Sessions</h3>
        <Table
          columns={['Admin', 'Role', 'Device', 'Status', 'Last Active', 'Actions']}
          rows={items.map((item) => [
            item.name ?? item.email ?? item.adminId ?? 'N/A',
            item.role ?? 'N/A',
            item.device ?? 'N/A',
            <StatusBadge value={item.current ? 'active' : 'revoked'} key={`${item.id}-status`} />,
            formatDate(item.lastActive),
            <div className="action-row" key={item.id}>
              <button type="button" onClick={() => onRevokeAdminSession(item.id)} disabled={!item.current}>
                Revoke
              </button>
            </div>,
          ])}
        />
      </article>
    )
  }

  if (viewId === 'audit') {
    const items = extractItems(payload)
    return (
      <article className="panel">
        <h3>Audit Trail</h3>
        <Table
          columns={['Action', 'Entity', 'Actor', 'Created']}
          rows={items.map((item) => [
            item.action,
            `${item.entityType}${item.entityId ? `:${item.entityId}` : ''}`,
            item.actorName ?? 'N/A',
            formatDate(item.createdAt),
          ])}
        />
        <PaginationMeta payload={payload} />
      </article>
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
      <PaginationMeta payload={payload} />
    </article>
  )
}

function FilterForm({ fields, onSubmit }) {
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

function PaginationMeta({ payload }) {
  const pagination = extractPagination(payload)
  if (!pagination) {
    return null
  }

  return (
    <p className="pagination-meta">
      Page {pagination.page} of {pagination.totalPages} | {formatNumber(pagination.total)} total items
    </p>
  )
}

export function DataList({ items }) {
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
