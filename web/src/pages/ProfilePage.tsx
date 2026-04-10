import { Link, useNavigate } from "react-router-dom";
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
            <div className="content-stack">
                <h1>Profilo</h1>
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
                <Link className="surface-item" to="/private/types">
                    <strong>Tipologie attività</strong>
                    <span className="muted">Gestisci e riordina le tipologie.</span>
                </Link>
                <Link className="surface-item" to="/profile/security">
                    <strong>Sicurezza account</strong>
                    <span className="muted">Aggiorna la password del tuo account.</span>
                </Link>
            </div>

            <Button variant="danger" onClick={handleLogout}>
                Esci
            </Button>
        </section>
    );
}
