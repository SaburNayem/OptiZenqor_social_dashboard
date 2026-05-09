import { extractItems } from '../../../services/apiClient'
import { DataList, FilterForm, PaginationMeta, StatusBadge, Table } from '../../../components/common/AdminPrimitives'

export function NotificationDevicesView({
  payload,
  filters,
  data,
  onLoadView,
  selectedNotificationDeviceId,
  setSelectedNotificationDeviceId,
  onUpdateNotificationDevice,
  onDeleteNotificationDevice,
  formatDate,
}) {
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
              <button type="button" onClick={() => onDeleteNotificationDevice?.(item.id)}>
                Delete
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

export function AdminSessionsView({ payload, onRevokeAdminSession, formatDate }) {
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
