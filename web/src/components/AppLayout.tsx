import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { IoAddOutline, IoHeartOutline, IoMapOutline, IoPersonOutline, IoWalkOutline } from "react-icons/io5";

const navItems = [
    { to: "/", label: "Mappa", icon: IoMapOutline, end: true },
    { to: "/favorites", label: "Preferiti", icon: IoHeartOutline, end: false },
    { to: "/nearby", label: "Vicino", icon: IoWalkOutline, end: false },
    { to: "/profile", label: "Profilo", icon: IoPersonOutline, end: false },
] as const;

export function AppLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="app-shell">
            <div className="app-frame">
                <header className="app-header">
                    <div className="app-header-brand">
                        <img src="/icon.svg" alt="" className="app-header-logo" aria-hidden="true" />
                        <span>
                            <span className="app-header-brand-taste">Taste</span>
                            <span className="app-header-brand-spot">Spot</span>
                        </span>
                    </div>
                    <div className="app-header-actions">
                        <button type="button" className="app-header-action app-header-action--primary" onClick={() => navigate("/activity/add")} aria-label="Aggiungi attività">
                            <IoAddOutline />
                        </button>
                    </div>
                </header>

                <main className={`app-content${location.pathname === "/" ? " app-content--map" : ""}`}>
                    <Outlet />
                </main>

                <nav className="nav-bar" aria-label="Navigazione principale">
                    {navItems.map(({ to, label, icon: Icon, end }) => (
                        <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                            <Icon className="nav-icon" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    );
}
