import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { IoArrowBackOutline, IoHeartOutline, IoMapOutline, IoPersonOutline, IoWalkOutline } from "react-icons/io5";

const navItems = [
    { to: "/", label: "Mappa", icon: IoMapOutline, end: true },
    { to: "/favorites", label: "Preferiti", icon: IoHeartOutline, end: false },
    { to: "/nearby", label: "Vicino", icon: IoWalkOutline, end: false },
    { to: "/profile", label: "Profilo", icon: IoPersonOutline, end: false },
] as const;

const TAB_PATHS = ["/favorites", "/nearby", "/profile"];

export function AppLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isTabRoute =
        location.pathname === "/" ||
        TAB_PATHS.some(path => location.pathname === path || location.pathname.startsWith(path + "/"));
    const isMapRoute = location.pathname === "/";

    return (
        <div className="app-shell">
            <div className="app-frame">
                {!isTabRoute ? (
                    <header className="app-header">
                        <button type="button" className="app-header-action" onClick={() => navigate(-1)} aria-label="Torna indietro">
                            <IoArrowBackOutline />
                        </button>
                    </header>
                ) : null}

                <main className={`app-content${isMapRoute ? " app-content--map" : ""}`}>
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
