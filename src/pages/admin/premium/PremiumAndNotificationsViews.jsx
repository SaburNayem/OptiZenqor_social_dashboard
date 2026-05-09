import { extractItems } from '../../../services/apiClient'
import { FilterForm, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'

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
            item.schedule ?? item.createdAt ?? 'N/A',
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
