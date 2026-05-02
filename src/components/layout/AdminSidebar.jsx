export function AdminSidebar({ items, activeItemId, onSelect, onLogout }) {
  return (
    <aside className="sidebar">
      <div>
        <p className="eyebrow">OptiZenqor Social</p>
        <h2>Admin Console</h2>
        <p className="sidebar-copy">Authenticated control plane for live platform operations.</p>
      </div>

      <nav className="sidebar-nav" aria-label="Admin sections">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeItemId ? 'nav-item active' : 'nav-item'}
            onClick={() => onSelect(item.id)}
          >
            <span>{item.label}</span>
            <small>Admin API</small>
          </button>
        ))}
      </nav>

      <button type="button" className="logout-button" onClick={onLogout}>
        Logout
      </button>
    </aside>
  )
}
