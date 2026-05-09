import { DataList, StatusBadge, Table } from '../../../components/common/AdminPrimitives'

export function AnalyticsOperationsView({ data, formatCell, formatDate, formatNumber }) {
  const kpis = data.kpis ?? {}
  const snapshots = Array.isArray(data.snapshots) ? data.snapshots : []
  const leaderboards = Array.isArray(data.leaderboards) ? data.leaderboards : []
  const exportJobs = Array.isArray(data.exportJobs) ? data.exportJobs : []

  return (
    <section className="stack">
      <article className="panel">
        <h3>Analytics Pipeline</h3>
        <p className="panel-copy">Database-backed KPI rollups and analytics pipeline state exposed from the admin backend.</p>
        <DataList
          items={[
            ['User growth', kpis.userGrowth ?? 'N/A'],
            ['Content output', kpis.contentOutput ?? 'N/A'],
            ['Moderation load', kpis.moderationLoad ?? 'N/A'],
            ['Revenue', kpis.revenue ?? 'N/A'],
            ['Events RSVP', kpis.eventsRsvp ?? 'N/A'],
          ]}
          formatNumber={formatNumber}
        />
      </article>

      <article className="panel">
        <h3>Snapshots</h3>
        <Table
          columns={['Label', 'Value', 'Timestamp']}
          rows={snapshots.map((item) => [
            item.label ?? item.metric ?? item.id ?? 'Snapshot',
            formatCell(item.value ?? item.total ?? item.score),
            formatDate(item.createdAt ?? item.timestamp),
          ])}
        />
      </article>

      <article className="panel">
        <h3>Leaderboards</h3>
        <Table
          columns={['Title', 'Primary', 'Secondary']}
          rows={leaderboards.map((item) => [
            item.title ?? item.name ?? item.id ?? 'Entry',
            formatCell(item.primaryValue ?? item.value ?? item.score),
            formatCell(item.secondaryValue ?? item.subtitle ?? item.status),
          ])}
        />
      </article>

      <article className="panel">
        <h3>Export Jobs</h3>
        <Table
          columns={['Job', 'Status', 'Created']}
          rows={exportJobs.map((item) => [
            item.name ?? item.id ?? 'Export job',
            <StatusBadge value={item.status ?? 'queued'} key={`${item.id ?? item.name}-status`} />,
            formatDate(item.createdAt),
          ])}
        />
      </article>
    </section>
  )
}

export function RoleAccessView({ data, formatCell }) {
  const roles = Array.isArray(data.roles) ? data.roles : []
  const moduleScopes = data.moduleScopes && typeof data.moduleScopes === 'object' ? data.moduleScopes : {}

  return (
    <section className="stack">
      <article className="panel">
        <h3>Admin Roles</h3>
        <p className="panel-copy">Live role matrix from the backend permission system.</p>
        <Table
          columns={['Role']}
          rows={roles.map((role) => [String(role)])}
        />
      </article>

      <article className="panel">
        <h3>Module Scopes</h3>
        <Table
          columns={['Module', 'Permissions']}
          rows={Object.entries(moduleScopes).map(([moduleName, permissions]) => [
            moduleName,
            Array.isArray(permissions) ? permissions.join(', ') : formatCell(permissions),
          ])}
        />
      </article>
    </section>
  )
}
