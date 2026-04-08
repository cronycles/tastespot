import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useAuthStore } from "@/stores/authStore";

type LocationState = {
    from?: string;
};

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const loading = useAuthStore(state => state.loading);
    const signIn = useAuthStore(state => state.signIn);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setError(null);

        const message = await signIn(email, password);
        if (message) {
            setError(message);
            return;
        }

        const state = location.state as LocationState | null;
        navigate(state?.from ?? "/", { replace: true });
    }

    return (
        <div className="auth-screen">
            <div className="auth-card">
                <div className="auth-header">
                    <p className="eyebrow">TasteSpot</p>
                    <h1>Accedi</h1>
                    <p className="muted">Entra nel tuo account per continuare.</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <TextField label="Email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required />
                    <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required />

                    {error ? <div className="status-banner error">{error}</div> : null}

                    <Button type="submit" disabled={loading}>
                        {loading ? "Accesso in corso..." : "Accedi"}
                    </Button>
                </form>

                <div className="auth-footer">
                    <span>Non hai ancora un account?</span>
                    <Link to="/register">Registrati</Link>
                </div>
            </div>
        </div>
    );
}
