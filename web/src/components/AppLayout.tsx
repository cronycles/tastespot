import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { IoArrowBackOutline, IoHeartOutline, IoHomeOutline, IoMapOutline, IoPersonOutline, IoWalkOutline } from "react-icons/io5";

const navItems = [
    { to: "/", label: "Mappa", icon: IoMapOutline, end: true },
    { to: "/favorites", label: "Preferiti", icon: IoHeartOutline, end: false },
    { to: "/nearby", label: "Vicino", icon: IoWalkOutline, end: false },
    { to: "/profile", label: "Profilo", icon: IoPersonOutline, end: false },
] as const;

export function AppLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isRootTabRoute =
        location.pathname === "/" || location.pathname.startsWith("/favorites") || location.pathname.startsWith("/nearby") || location.pathname.startsWith("/profile");

    return (
        <div className="app-shell">
            <div className="app-frame">
                <header className="app-header">
                    <div className="app-header-brand">TasteSpot</div>
                    <div className="app-header-actions">
                        {!isRootTabRoute ? (
                            <button type="button" className="app-header-action" onClick={() => navigate(-1)} aria-label="Torna indietro">
                                <IoArrowBackOutline />
                            </button>
                        ) : null}
                        <button type="button" className="app-header-action" onClick={() => navigate("/")} aria-label="Vai alla home">
                            <IoHomeOutline />
                        </button>
                    </div>
                </header>

                <main className="app-content">
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
