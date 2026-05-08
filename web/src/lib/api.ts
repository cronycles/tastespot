import type { ActivityPhoto } from "@/types";

const DEFAULT_API_URL = "http://127.0.0.1:8001/api/v1";
const BASE_URL = (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
const TOKEN_KEY = "@auth_token";

let tokenCache: string | null = null;

export function getApiBaseUrl(): string {
    return BASE_URL;
}

export function setToken(token: string | null): void {
    tokenCache = token;
    if (token) {
        window.localStorage.setItem(TOKEN_KEY, token);
    } else {
        window.localStorage.removeItem(TOKEN_KEY);
    }
}

export async function loadToken(): Promise<string | null> {
    tokenCache = window.localStorage.getItem(TOKEN_KEY);
    return tokenCache;
}

function authHeaders(): Record<string, string> {
    return tokenCache ? { Authorization: `Bearer ${tokenCache}` } : {};
}

async function parseJson<T>(res: Response): Promise<T> {
    if (res.status === 204) {
        return null as T;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
        if (!res.ok) {
            throw new Error("Risposta non valida dal server");
        }
        return null as T;
    }

    return (await res.json()) as T;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...authHeaders(),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const json = await parseJson<Record<string, unknown>>(res);

    if (!res.ok) {
        throw Object.assign(new Error((json.message as string | undefined) ?? "Errore server"), { status: res.status, errors: json.errors });
    }

    return json as T;
}

export const api = {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
    put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
    delete: <T>(path: string) => request<T>("DELETE", path),

    async uploadPhoto(activityId: string, file: File): Promise<ActivityPhoto> {
        const formData = new FormData();
        formData.append("photo", file);

        const res = await fetch(`${BASE_URL}/activities/${activityId}/photos`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                ...authHeaders(),
            },
            body: formData,
        });

        const json = await parseJson<Record<string, unknown>>(res);
        if (!res.ok) {
            throw new Error((json.message as string | undefined) ?? "Errore upload foto");
        }

        return json as ActivityPhoto;
    },
};
