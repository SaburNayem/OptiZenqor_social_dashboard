export function AdminTopbar({ title, admin }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Authenticated session</p>
        <h1>{title}</h1>
      </div>
      <div className="topbar-meta">
        <strong>{admin?.name ?? 'Admin'}</strong>
        <span>{admin?.role ?? 'Admin role'}</span>
      </div>
    </header>
  )
}
