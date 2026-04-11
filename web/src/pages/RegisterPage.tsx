import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useAuthStore } from "@/stores/authStore";

export function RegisterPage() {
    const navigate = useNavigate();
    const loading = useAuthStore(state => state.loading);
    const registrationEnabled = useAuthStore(state => state.registrationEnabled);
    const signUp = useAuthStore(state => state.signUp);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    if (!registrationEnabled) {
        return <Navigate to="/login" replace />;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setError(null);

        const message = await signUp(name, email, password);
        if (message) {
            setError(message);
            return;
        }

        navigate("/", { replace: true });
    }

    return (
        <div className="auth-screen">
            <div className="auth-card">
                <div className="auth-header">
                    <img src="/logo.svg" alt="TasteSpot" className="auth-logo" />
                    <h1>Registrati</h1>
                    <p className="muted">Crea il tuo account per iniziare.</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <TextField label="Nome" autoComplete="name" value={name} onChange={event => setName(event.target.value)} required />
                    <TextField label="Email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required />
                    <TextField label="Password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required />

                    {error ? <div className="status-banner error">{error}</div> : null}

                    <Button type="submit" disabled={loading}>
                        {loading ? "Registrazione in corso..." : "Registrati"}
                    </Button>
                </form>

                <div className="auth-footer">
                    <span>Hai già un account?</span>
                    <Link to="/login">Accedi</Link>
                </div>
            </div>
        </div>
    );
}
