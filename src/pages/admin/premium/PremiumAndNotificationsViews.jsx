import { extractItems } from '../../../services/apiClient'
import { FilterForm, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'

const audienceOptions = [
  { value: 'all_users', label: 'All users' },
  { value: 'verified_users', label: 'Verified users' },
  { value: 'premium', label: 'Premium subscribers' },
  { value: 'creators', label: 'Creators' },
]

const schedulePresetOptions = [
  { value: 'now', label: 'Send now' },
  { value: '15m', label: 'In 15 minutes' },
  { value: '1h', label: 'In 1 hour' },
  { value: '3h', label: 'In 3 hours' },
  { value: 'tomorrow9', label: 'Tomorrow 9:00 AM' },
  { value: 'custom', label: 'Pick date and time' },
]

function toDatetimeLocalValue(value) {
  if (!value || String(value).toLowerCase() === 'now') {
    return ''
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16)
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function getDefaultLaterValue() {
  const date = new Date(Date.now() + 60 * 60 * 1000)
  date.setSeconds(0, 0)
  return toDatetimeLocalValue(date)
}

function resolveSchedulePreset(draft) {
  if (draft.schedulePreset) {
    return draft.schedulePreset
  }
  if (draft.scheduleMode === 'later' || (draft.schedule && String(draft.schedule).toLowerCase() !== 'now')) {
    return 'custom'
  }
  return 'now'
}

function applySchedulePreset(draft, schedulePreset) {
  return {
    ...draft,
    schedulePreset,
    scheduleMode: schedulePreset === 'now' ? 'now' : 'later',
    scheduledAt: schedulePreset === 'custom' ? draft.scheduledAt || getDefaultLaterValue() : '',
    schedule: schedulePreset === 'now' ? 'now' : '',
  }
}

function getPresetDate(schedulePreset) {
  const date = new Date()
  date.setSeconds(0, 0)

  if (schedulePreset === '15m') {
    date.setMinutes(date.getMinutes() + 15)
    return date
  }
  if (schedulePreset === '1h') {
    date.setHours(date.getHours() + 1)
    return date
  }
  if (schedulePreset === '3h') {
    date.setHours(date.getHours() + 3)
    return date
  }
  if (schedulePreset === 'tomorrow9') {
    date.setDate(date.getDate() + 1)
    date.setHours(9, 0, 0, 0)
    return date
  }

  return null
}

function buildCampaignSchedulePatch(draft) {
  const schedulePreset = resolveSchedulePreset(draft)
  const timezoneOffsetMinutes = new Date().getTimezoneOffset()

  if (schedulePreset === 'now') {
    return {
      schedule: 'now',
      scheduleMode: 'now',
      deliveryMode: 'now',
      sendNow: true,
      scheduledAt: null,
      timezoneOffsetMinutes,
    }
  }

  const scheduledDate = schedulePreset === 'custom' ? new Date(draft.scheduledAt) : getPresetDate(schedulePreset)
  const scheduledAt = scheduledDate && !Number.isNaN(scheduledDate.getTime()) ? scheduledDate.toISOString() : ''

  return {
    schedule: scheduledAt,
    scheduleMode: 'later',
    deliveryMode: 'later',
    sendNow: false,
    scheduledAt,
    timezoneOffsetMinutes,
  }
}

function createCampaignDraftFromItem(item) {
  const rawSchedule = item.schedule ?? ''
  const scheduledAt = item.scheduledAt ?? item.sendAt ?? (String(rawSchedule).toLowerCase() === 'now' ? '' : rawSchedule)
  const scheduleMode = String(item.scheduleMode ?? item.deliveryMode ?? '').toLowerCase()
  const hasLaterSchedule = scheduleMode === 'later' || Boolean(scheduledAt)

  return {
    name: item.name ?? '',
    audience: item.audience ?? 'all_users',
    schedule: hasLaterSchedule ? String(scheduledAt) : 'now',
    scheduleMode: hasLaterSchedule ? 'later' : 'now',
    schedulePreset: hasLaterSchedule ? 'custom' : 'now',
    scheduledAt: hasLaterSchedule ? toDatetimeLocalValue(scheduledAt) : '',
  }
}

function canSubmitCampaignDraft(draft, requireName = true) {
  if (requireName && !draft.name?.trim()) {
    return false
  }

  if (resolveSchedulePreset(draft) !== 'custom') {
    return true
  }

  const scheduledDate = new Date(draft.scheduledAt)
  return Boolean(draft.scheduledAt) && !Number.isNaN(scheduledDate.getTime())
}

function formatCampaignSchedule(item) {
  if (item.scheduleLabel) {
    return item.scheduleLabel
  }

  const rawSchedule = item.scheduledAt ?? item.sendAt ?? item.schedule
  if (!rawSchedule || String(rawSchedule).toLowerCase() === 'now') {
    return 'Now'
  }

  const date = new Date(rawSchedule)
  return Number.isNaN(date.getTime()) ? rawSchedule : date.toLocaleString()
}

function AudienceSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {audienceOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function CampaignScheduleControls({ draft, onChange }) {
  const schedulePreset = resolveSchedulePreset(draft)

  return (
    <>
      <select value={schedulePreset} onChange={(event) => onChange(applySchedulePreset(draft, event.target.value))}>
        {schedulePresetOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {schedulePreset === 'custom' ? (
        <input
          type="datetime-local"
          value={draft.scheduledAt ?? ''}
          min={toDatetimeLocalValue(new Date())}
          onChange={(event) =>
            onChange({
              ...draft,
              schedule: event.target.value,
              scheduleMode: 'later',
              schedulePreset: 'custom',
              scheduledAt: event.target.value,
            })
          }
        />
      ) : null}
    </>
  )
}

export function PremiumPlansView({
  payload,
  filters,
  onLoadView,
  onUpdatePremiumPlan,
  onDeletePremiumPlan,
  onCreatePremiumPlan,
  premiumPlanDraft,
  setPremiumPlanDraft,
  formatNumber,
}) {
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

export function NotificationCampaignsView({
  payload,
  filters,
  onLoadView,
  onRunNotificationCampaignAction,
  onDeleteNotificationCampaign,
  onUpdateNotificationCampaign,
  onCreateNotificationCampaign,
  campaignDraft,
  setCampaignDraft,
  campaignEditDrafts,
  setCampaignEditDrafts,
}) {
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
            formatCampaignSchedule(item),
            <div className="action-row" key={item.id}>
              <button type="button" onClick={() => onRunNotificationCampaignAction(item.id, 'send')} disabled={item.status === 'sent'}>
                Send
              </button>
              <button type="button" onClick={() => onRunNotificationCampaignAction(item.id, 'cancel')} disabled={item.status === 'cancelled'}>
                Cancel
              </button>
              <button type="button" onClick={() => onDeleteNotificationCampaign?.(item.id)}>
                Delete
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
            const draft = campaignEditDrafts[item.id] ?? createCampaignDraftFromItem(item)

            return (
              <form
                key={`campaign-edit-${item.id}`}
                className="inline-form notification-campaign-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  onUpdateNotificationCampaign(item.id, {
                    name: draft.name.trim(),
                    audience: draft.audience,
                    ...buildCampaignSchedulePatch(draft),
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
                <AudienceSelect
                  value={draft.audience}
                  onChange={(audience) =>
                    setCampaignEditDrafts((current) => ({
                      ...current,
                      [item.id]: { ...draft, audience },
                    }))
                  }
                />
                <CampaignScheduleControls
                  draft={draft}
                  onChange={(nextDraft) =>
                    setCampaignEditDrafts((current) => ({
                      ...current,
                      [item.id]: nextDraft,
                    }))
                  }
                />
                <button type="submit" disabled={!canSubmitCampaignDraft(draft)}>
                  Update
                </button>
              </form>
            )
          })}
        </div>
      </article>

      <article className="panel">
        <h3>Create Notification Campaign</h3>
        <form
          className="inline-form notification-campaign-form"
          onSubmit={(event) => {
            event.preventDefault()
            onCreateNotificationCampaign({
              name: campaignDraft.name.trim(),
              audience: campaignDraft.audience,
              ...buildCampaignSchedulePatch(campaignDraft),
            })
            setCampaignDraft({
              name: '',
              audience: 'all_users',
              schedule: 'now',
              scheduleMode: 'now',
              schedulePreset: 'now',
              scheduledAt: '',
            })
          }}
        >
          <input
            value={campaignDraft.name}
            onChange={(event) => setCampaignDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="Campaign name"
          />
          <AudienceSelect
            value={campaignDraft.audience}
            onChange={(audience) => setCampaignDraft((current) => ({ ...current, audience }))}
          />
          <CampaignScheduleControls
            draft={campaignDraft}
            onChange={(nextDraft) => setCampaignDraft(nextDraft)}
          />
          <button type="submit" disabled={!canSubmitCampaignDraft(campaignDraft)}>
            Create campaign
          </button>
        </form>
      </article>
    </section>
  )
}
