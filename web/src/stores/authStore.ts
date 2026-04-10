import { create } from "zustand";
import { api, loadToken, setToken } from "@/lib/api";

type AuthUser = {
    id: string;
    email: string;
    name: string;
};

type AuthSettings = {
    registration_enabled: boolean;
};

type AuthState = {
    token: string | null;
    user: AuthUser | null;
    initialized: boolean;
    loading: boolean;
    isNewUser: boolean;
    registrationEnabled: boolean;
    init: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<string | null>;
    signUp: (name: string, email: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>;
    dismissWelcome: () => void;
};

function parseAuthError(message: string): string {
    if (message.includes("Credenziali non valide")) return "Email o password non corretti.";
    if (message.includes("già registrat")) return "Esiste già un account con questa email.";
    if (message.includes("Registrazione disabilitata")) return "Le nuove registrazioni sono disabilitate temporaneamente.";
    if (message.includes("Failed to fetch")) return "Errore di connessione. Controlla che il backend sia attivo.";
    return message || "Si è verificato un errore. Riprova.";
}

export const useAuthStore = create<AuthState>(set => ({
    token: null,
    user: null,
    initialized: false,
    loading: false,
    isNewUser: false,
    registrationEnabled: true,

    init: async () => {
        try {
            const settings = await api.get<AuthSettings>("/auth/settings");
            set({ registrationEnabled: settings.registration_enabled });
        } catch {
            set({ registrationEnabled: true });
        }

        const token = await loadToken();
        if (!token) {
            set({ initialized: true });
            return;
        }

        try {
            const user = await api.get<AuthUser>("/auth/me");
            set({ token, user, initialized: true });
        } catch {
            setToken(null);
            set({ token: null, user: null, initialized: true });
        }
    },

    signIn: async (email, password) => {
        set({ loading: true });
        try {
            const { token, user } = await api.post<{ token: string; user: AuthUser }>("/auth/login", { email, password });
            setToken(token);
            set({ token, user, loading: false });
            return null;
        } catch (error: unknown) {
            set({ loading: false });
            return parseAuthError((error as Error).message);
        }
    },

    signUp: async (name, email, password) => {
        set({ loading: true });
        try {
            const { token, user } = await api.post<{ token: string; user: AuthUser }>("/auth/register", {
                name,
                email,
                password,
                password_confirmation: password,
            });
            setToken(token);
            set({ token, user, loading: false, isNewUser: true });
            return null;
        } catch (error: unknown) {
            set({ loading: false });
            return parseAuthError((error as Error).message);
        }
    },

    dismissWelcome: () => set({ isNewUser: false }),

    signOut: async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // best effort
        }

        setToken(null);
        set({ token: null, user: null, isNewUser: false });
    },
}));
