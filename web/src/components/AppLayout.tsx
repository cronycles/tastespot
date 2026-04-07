import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { IoHeartOutline, IoMapOutline, IoPersonOutline, IoWalkOutline } from 'react-icons/io5'

const navItems = [
  { to: '/', label: 'Mappa', icon: IoMapOutline, end: true },
  { to: '/favorites', label: 'Preferiti', icon: IoHeartOutline, end: false },
  { to: '/nearby', label: 'Vicino', icon: IoWalkOutline, end: false },
  { to: '/profile', label: 'Profilo', icon: IoPersonOutline, end: false },
] as const

function getPageLabel(pathname: string): string {
  if (pathname.startsWith('/favorites')) return 'Preferiti'
  if (pathname.startsWith('/nearby')) return 'Vicino a me'
  if (pathname.startsWith('/profile')) return 'Profilo'
  if (pathname.startsWith('/private/types')) return 'Tipologie'
  return 'Mappa'
}

export function AppLayout() {
  const location = useLocation()

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="app-header">
          <div className="app-header-copy">
            <p className="eyebrow">TasteSpot</p>
            <h2>{getPageLabel(location.pathname)}</h2>
          </div>
          <span className="pill">Laravel API</span>
        </header>

        <nav className="nav-bar" aria-label="Navigazione principale">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon className="nav-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}