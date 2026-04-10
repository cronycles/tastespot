import { useState } from "react";
import { Button } from "@/components/Button";
import { api } from "@/lib/api";

type PasswordFormState = {
    oldPassword: string;
    newPassword: string;
    newPasswordConfirmation: string;
};

type PasswordErrors = Partial<Record<keyof PasswordFormState, string>>;

function parsePasswordErrors(error: unknown): { message: string; fieldErrors: PasswordErrors } {
    if (!(error instanceof Error)) {
        return {
            message: "Si e' verificato un errore. Riprova.",
            fieldErrors: {},
        };
    }

    const maybeErrors = (error as Error & { errors?: Record<string, string[] | string> }).errors;
    const fieldErrors: PasswordErrors = {};

    if (maybeErrors) {
        const oldPassword = maybeErrors.old_password;
        const newPassword = maybeErrors.new_password;
        const confirmation = maybeErrors.new_password_confirmation;

        if (oldPassword) {
            fieldErrors.oldPassword = Array.isArray(oldPassword) ? oldPassword[0] : oldPassword;
        }
        if (newPassword) {
            fieldErrors.newPassword = Array.isArray(newPassword) ? newPassword[0] : newPassword;
        }
        if (confirmation) {
            fieldErrors.newPasswordConfirmation = Array.isArray(confirmation) ? confirmation[0] : confirmation;
        }
    }

    return {
        message: error.message || "Si e' verificato un errore. Riprova.",
        fieldErrors,
    };
}

export function SecurityPage() {
    const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
        oldPassword: "",
        newPassword: "",
        newPasswordConfirmation: "",
    });
    const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    const [savingPassword, setSavingPassword] = useState(false);

    function updatePasswordField(key: keyof PasswordFormState, value: string): void {
        setPasswordForm(current => ({ ...current, [key]: value }));
        setPasswordErrors(current => ({ ...current, [key]: undefined }));
        setPasswordMessage(null);
        setPasswordSuccess(null);
    }

    async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setPasswordMessage(null);
        setPasswordSuccess(null);

        const nextErrors: PasswordErrors = {};
        if (!passwordForm.oldPassword.trim()) {
            nextErrors.oldPassword = "Inserisci la password attuale.";
        }
        if (passwordForm.newPassword.length < 8) {
            nextErrors.newPassword = "La nuova password deve avere almeno 8 caratteri.";
        }
        if (passwordForm.newPasswordConfirmation !== passwordForm.newPassword) {
            nextErrors.newPasswordConfirmation = "Le nuove password non coincidono.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setPasswordErrors(nextErrors);
            return;
        }

        setSavingPassword(true);
        setPasswordErrors({});

        try {
            const response = await api.post<{ message: string }>("/auth/change-password", {
                old_password: passwordForm.oldPassword,
                new_password: passwordForm.newPassword,
                new_password_confirmation: passwordForm.newPasswordConfirmation,
            });

            setPasswordForm({ oldPassword: "", newPassword: "", newPasswordConfirmation: "" });
            setPasswordSuccess(response.message);
        } catch (error: unknown) {
            const parsed = parsePasswordErrors(error);
            setPasswordErrors(parsed.fieldErrors);
            setPasswordMessage(parsed.message);
        } finally {
            setSavingPassword(false);
        }
    }

    return (
        <section className="profile-card profile-page">
            <div className="content-stack security-hero-card">
                <p className="eyebrow">Privacy e accesso</p>
                <h1>Sicurezza account</h1>
                <p className="muted">Aggiorna la password del tuo account.</p>
            </div>

            <form className="profile-security-form" onSubmit={event => void handlePasswordSubmit(event)}>
                <div className="content-stack">
                    <h2>Cambio password</h2>
                    <p className="muted">Usa almeno 8 caratteri e conferma la nuova password.</p>
                </div>

                <div className="field">
                    <label htmlFor="profile-old-password">Password attuale</label>
                    <input
                        id="profile-old-password"
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={event => updatePasswordField("oldPassword", event.target.value)}
                        autoComplete="current-password"
                    />
                    {passwordErrors.oldPassword ? <span className="field-error">{passwordErrors.oldPassword}</span> : null}
                </div>

                <div className="field">
                    <label htmlFor="profile-new-password">Nuova password</label>
                    <input
                        id="profile-new-password"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={event => updatePasswordField("newPassword", event.target.value)}
                        autoComplete="new-password"
                    />
                    {passwordErrors.newPassword ? <span className="field-error">{passwordErrors.newPassword}</span> : null}
                </div>

                <div className="field">
                    <label htmlFor="profile-new-password-confirmation">Ripeti nuova password</label>
                    <input
                        id="profile-new-password-confirmation"
                        type="password"
                        value={passwordForm.newPasswordConfirmation}
                        onChange={event => updatePasswordField("newPasswordConfirmation", event.target.value)}
                        autoComplete="new-password"
                    />
                    {passwordErrors.newPasswordConfirmation ? <span className="field-error">{passwordErrors.newPasswordConfirmation}</span> : null}
                </div>

                {passwordMessage ? <div className="status-banner error">{passwordMessage}</div> : null}
                {passwordSuccess ? <div className="status-banner info">{passwordSuccess}</div> : null}

                <div className="inline-actions">
                    <Button type="submit" disabled={savingPassword}>
                        {savingPassword ? "Salvataggio..." : "Aggiorna password"}
                    </Button>
                </div>
            </form>
        </section>
    );
}
