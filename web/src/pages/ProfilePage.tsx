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
        <section className="profile-card">
            <div className="stack">
                <p className="eyebrow">Account</p>
                <h1>Profilo</h1>
                <p className="muted">Gestisci il tuo account.</p>
            </div>

            {user ? (
                <div className="metric-row">
                    <div className="metric-card">
                        <span className="muted">Nome</span>
                        <span className="metric-value" style={{ fontSize: "1.1rem" }}>
                            {user.name}
                        </span>
                    </div>
                    <div className="metric-card">
                        <span className="muted">Email</span>
                        <span className="metric-value" style={{ fontSize: "1.1rem" }}>
                            {user.email}
                        </span>
                    </div>
                </div>
            ) : null}

            {isNewUser ? (
                <div className="status-banner info">
                    Registrazione completata con successo.
                    <div className="inline-actions" style={{ marginTop: "10px" }}>
                        <Button variant="secondary" onClick={dismissWelcome}>
                            Chiudi
                        </Button>
                    </div>
                </div>
            ) : null}

            <div className="profile-actions">
                <Link className="list-item" to="/private/types">
                    <strong>Tipologie attività</strong>
                    <span className="muted">Gestisci e riordina le tipologie.</span>
                </Link>
                <Link className="list-item" to="/nearby">
                    <strong>Vicino a me</strong>
                    <span className="muted">Scopri i posti piu' vicini.</span>
                </Link>
                <Link className="list-item" to="/favorites">
                    <strong>Preferiti</strong>
                    <span className="muted">Rivedi i tuoi preferiti.</span>
                </Link>
                <div className="list-item">
                    <strong>Sicurezza account</strong>
                    <span className="muted">Altre opzioni in arrivo.</span>
                </div>
            </div>

            <Button variant="danger" onClick={handleLogout}>
                Esci
            </Button>
        </section>
    );
}
