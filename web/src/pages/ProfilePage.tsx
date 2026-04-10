import { Link, useNavigate } from "react-router-dom";
import { IoGridOutline, IoLogOutOutline, IoPersonCircleOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/stores/authStore";

export function ProfilePage() {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const signOut = useAuthStore(state => state.signOut);
    const isNewUser = useAuthStore(state => state.isNewUser);
    const dismissWelcome = useAuthStore(state => state.dismissWelcome);

    async function handleLogout(): Promise<void> {
        await signOut();
        navigate("/login", { replace: true });
    }

    return (
        <section className="profile-card profile-page">
            <div className="content-stack profile-hero-card">
                <p className="eyebrow">Area privata</p>
                <h1>Profilo</h1>
                {user ? (
                    <div className="profile-hero-meta">
                        <IoPersonCircleOutline />
                        <span>{user.email}</span>
                    </div>
                ) : null}
            </div>

            {user ? (
                <div className="metric-row">
                    <div className="metric-card">
                        <span className="muted">Nome</span>
                        <span className="metric-value metric-value-sm">{user.name}</span>
                    </div>
                    <div className="metric-card">
                        <span className="muted">Email</span>
                        <span className="metric-value metric-value-sm">{user.email}</span>
                    </div>
                </div>
            ) : null}

            {isNewUser ? (
                <div className="status-banner info">
                    Registrazione completata con successo.
                    <div className="inline-actions status-banner-actions">
                        <Button variant="secondary" onClick={dismissWelcome}>
                            Chiudi
                        </Button>
                    </div>
                </div>
            ) : null}

            <div className="profile-actions">
                <Link className="surface-item profile-action-link" to="/private/types">
                    <span className="profile-action-icon">
                        <IoGridOutline />
                    </span>
                    <strong>Tipologie attività</strong>
                    <span className="muted">Gestisci e riordina le tipologie.</span>
                </Link>
                <Link className="surface-item profile-action-link" to="/profile/security">
                    <span className="profile-action-icon">
                        <IoShieldCheckmarkOutline />
                    </span>
                    <strong>Sicurezza account</strong>
                    <span className="muted">Aggiorna la password del tuo account.</span>
                </Link>
            </div>

            <Button variant="danger" className="profile-logout-button" onClick={handleLogout}>
                <IoLogOutOutline />
                Esci
            </Button>
        </section>
    );
}
