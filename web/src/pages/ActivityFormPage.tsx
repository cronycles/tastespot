import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { useActivitiesStore, type ActivityWithDetails, type CreateActivityData, type UpdateActivityData } from "@/stores/activitiesStore";
import { useTypesStore } from "@/stores/typesStore";

type Props = {
    mode: "add" | "edit";
    activity?: ActivityWithDetails;
};

type FormState = {
    name: string;
    address: string;
    lat: string;
    lng: string;
    phone: string;
    notes: string;
    tagsInput: string;
    tags: string[];
    selectedTypeIds: string[];
    isFavorite: boolean;
};

function parseTagInput(value: string): string[] {
    return value
        .toLowerCase()
        .split(/[\s,]+/)
        .map(entry => entry.trim())
        .filter(entry => entry.length > 0);
}

function parseMaybeFloat(value: string): number | null {
    if (!value.trim()) {
        return null;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export function ActivityFormPage({ mode, activity }: Props) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { create, update } = useActivitiesStore();
    const { types, fetch: fetchTypes } = useTypesStore();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const queryName = mode === "add" ? (searchParams.get("name") ?? "") : "";
    const queryAddress = mode === "add" ? (searchParams.get("address") ?? "") : "";
    const queryLat = mode === "add" ? (searchParams.get("lat") ?? "") : "";
    const queryLng = mode === "add" ? (searchParams.get("lng") ?? "") : "";

    const [form, setForm] = useState<FormState>(() => ({
        name: activity?.name ?? queryName,
        address: activity?.address ?? queryAddress,
        lat: activity?.lat != null ? String(activity.lat) : queryLat,
        lng: activity?.lng != null ? String(activity.lng) : queryLng,
        phone: activity?.phone ?? "",
        notes: activity?.notes ?? "",
        tagsInput: "",
        tags: activity?.tags ?? [],
        selectedTypeIds: activity?.type_ids ?? [],
        isFavorite: activity?.is_favorite ?? false,
    }));

    useEffect(() => {
        void fetchTypes();
    }, [fetchTypes]);

    const canSubmit = useMemo(() => {
        return form.name.trim().length > 0 && form.selectedTypeIds.length > 0;
    }, [form.name, form.selectedTypeIds.length]);

    function updateField<K extends keyof FormState>(key: K, value: FormState[K]): void {
        setForm(current => ({ ...current, [key]: value }));
    }

    function addTagsFromInput(): void {
        const parsed = parseTagInput(form.tagsInput);
        if (parsed.length === 0) {
            return;
        }

        const next = [...form.tags];
        for (const tag of parsed) {
            if (!next.includes(tag)) {
                next.push(tag);
            }
        }

        setForm(current => ({
            ...current,
            tags: next,
            tagsInput: "",
        }));
    }

    function toggleType(typeId: string): void {
        setForm(current => ({
            ...current,
            selectedTypeIds: current.selectedTypeIds.includes(typeId) ? current.selectedTypeIds.filter(entry => entry !== typeId) : [...current.selectedTypeIds, typeId],
        }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setError(null);

        if (!canSubmit) {
            setError("Compila almeno nome e una tipologia.");
            return;
        }

        setSaving(true);
        const lat = parseMaybeFloat(form.lat);
        const lng = parseMaybeFloat(form.lng);

        if (mode === "add") {
            const payload: CreateActivityData = {
                name: form.name.trim(),
                address: form.address.trim() || null,
                lat,
                lng,
                phone: form.phone.trim() || null,
                notes: form.notes.trim() || null,
                tags: form.tags,
                type_ids: form.selectedTypeIds,
                is_favorite: form.isFavorite,
            };
            const result = await create(payload);
            setSaving(false);
            if (result) {
                setError(result);
                return;
            }
            navigate("/", { replace: true });
            return;
        }

        if (!activity) {
            setSaving(false);
            setError("Attivita' non trovata.");
            return;
        }

        const payload: UpdateActivityData = {
            name: form.name.trim(),
            address: form.address.trim() || null,
            lat,
            lng,
            phone: form.phone.trim() || null,
            notes: form.notes.trim() || null,
            tags: form.tags,
            type_ids: form.selectedTypeIds,
        };
        const result = await update(activity.id, payload);
        setSaving(false);
        if (result) {
            setError(result);
            return;
        }
        navigate(`/activity/${activity.id}`, { replace: true });
    }

    return (
        <section className="page-card form-page">
            <div className="content-stack">
                <h1>{mode === "add" ? "Nuova attivita'" : "Modifica attivita'"}</h1>
                <p className="muted">Compila i dettagli del posto che vuoi salvare.</p>
            </div>

            <form className="activity-form" onSubmit={event => void handleSubmit(event)}>
                <div className="field">
                    <label htmlFor="activity-name">Nome *</label>
                    <input id="activity-name" value={form.name} onChange={event => updateField("name", event.target.value)} placeholder="Es. Trattoria da Mario" required />
                </div>

                <div className="field">
                    <label htmlFor="activity-address">Indirizzo</label>
                    <input id="activity-address" value={form.address} onChange={event => updateField("address", event.target.value)} placeholder="Es. Via Roma 10, Genova" />
                </div>

                <div className="activity-coords-grid">
                    <div className="field">
                        <label htmlFor="activity-lat">Latitudine</label>
                        <input id="activity-lat" value={form.lat} onChange={event => updateField("lat", event.target.value)} placeholder="44.4056" />
                    </div>
                    <div className="field">
                        <label htmlFor="activity-lng">Longitudine</label>
                        <input id="activity-lng" value={form.lng} onChange={event => updateField("lng", event.target.value)} placeholder="8.9463" />
                    </div>
                </div>

                <div className="field">
                    <label htmlFor="activity-phone">Telefono</label>
                    <input id="activity-phone" value={form.phone} onChange={event => updateField("phone", event.target.value)} placeholder="+39 ..." />
                </div>

                <div className="field">
                    <label htmlFor="activity-notes">Note</label>
                    <textarea id="activity-notes" rows={4} value={form.notes} onChange={event => updateField("notes", event.target.value)} placeholder="Appunti o dettagli utili" />
                </div>

                <div className="content-stack">
                    <h3>Tipologie *</h3>
                    <div className="activities-chip-row">
                        {types.map(type => (
                            <button
                                key={type.id}
                                type="button"
                                className={`activities-chip${form.selectedTypeIds.includes(type.id) ? " active" : ""}`}
                                onClick={() => toggleType(type.id)}
                            >
                                {type.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="content-stack">
                    <h3>Tag</h3>
                    <div className="activity-tags-input-row">
                        <input value={form.tagsInput} onChange={event => updateField("tagsInput", event.target.value.toLowerCase())} placeholder="es. economico romantico" />
                        <Button type="button" variant="secondary" onClick={addTagsFromInput}>
                            Aggiungi tag
                        </Button>
                    </div>
                    {form.tags.length > 0 ? (
                        <div className="activities-meta-row">
                            {form.tags.map(tag => (
                                <span className="tag-pill" key={tag}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </div>

                {mode === "add" ? (
                    <label className="activity-favorite-check">
                        <input type="checkbox" checked={form.isFavorite} onChange={event => updateField("isFavorite", event.target.checked)} />
                        Aggiungi subito ai preferiti
                    </label>
                ) : null}

                {error ? <div className="status-banner error">{error}</div> : null}

                <div className="inline-actions">
                    <Button type="submit" disabled={saving || !canSubmit}>
                        {saving ? "Salvataggio..." : mode === "add" ? "Crea attivita'" : "Salva modifiche"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                        Annulla
                    </Button>
                </div>
            </form>
        </section>
    );
}
