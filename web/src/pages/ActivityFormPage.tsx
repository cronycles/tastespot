import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/Button";
import { getActivityTypeIcon } from "@/lib/activityTypeIcons";
import { api } from "@/lib/api";
import { useActivitiesStore, type ActivityWithDetails, type CreateActivityData, type UpdateActivityData } from "@/stores/activitiesStore";
import { useTypesStore } from "@/stores/typesStore";
import { DEFAULT_ICON_KEY } from "@/types";

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

function getFallbackTypeId(typeIds: string[], availableTypes: Array<{ id: string; icon_key: string }>): string | null {
    if (typeIds.length > 0) {
        return null;
    }

    const genericType = availableTypes.find(type => type.icon_key === DEFAULT_ICON_KEY);
    return genericType?.id ?? null;
}

export function ActivityFormPage({ mode, activity }: Props) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { create, update, addPhoto, removePhoto } = useActivitiesStore();
    const { types, fetch: fetchTypes } = useTypesStore();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photosError, setPhotosError] = useState<string | null>(null);

    const queryName = mode === "add" ? (searchParams.get("name") ?? "") : "";
    const queryAddress = mode === "add" ? (searchParams.get("address") ?? "") : "";
    const queryLat = mode === "add" ? (searchParams.get("lat") ?? "") : "";
    const queryLng = mode === "add" ? (searchParams.get("lng") ?? "") : "";
    const queryPhone = mode === "add" ? (searchParams.get("phone") ?? "") : "";

    const [form, setForm] = useState<FormState>(() => ({
        name: activity?.name ?? queryName,
        address: activity?.address ?? queryAddress,
        lat: activity?.lat != null ? String(activity.lat) : queryLat,
        lng: activity?.lng != null ? String(activity.lng) : queryLng,
        phone: activity?.phone ?? queryPhone,
        notes: activity?.notes ?? "",
        tagsInput: "",
        tags: activity?.tags ?? [],
        selectedTypeIds: activity?.type_ids ?? [],
        isFavorite: activity?.is_favorite ?? false,
    }));

    useEffect(() => {
        void fetchTypes();
    }, [fetchTypes]);

    const typeOptions = useMemo(() => {
        return types.map(type => ({
            ...type,
            Icon: getActivityTypeIcon(type.icon_key),
            selected: form.selectedTypeIds.includes(type.id),
        }));
    }, [form.selectedTypeIds, types]);

    const fallbackTypeId = useMemo(() => getFallbackTypeId(form.selectedTypeIds, types), [form.selectedTypeIds, types]);

    const canSubmit = useMemo(() => {
        return form.name.trim().length > 0 && form.address.trim().length > 0 && (form.selectedTypeIds.length > 0 || fallbackTypeId !== null);
    }, [fallbackTypeId, form.address, form.name, form.selectedTypeIds.length]);

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

    async function handleEditPhotoUpload(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
        if (mode !== "edit" || !activity) {
            return;
        }

        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) {
            return;
        }

        setPhotosError(null);
        setUploadingPhoto(true);
        try {
            const compressed = await imageCompression(file, {
                maxWidthOrHeight: 1200,
                maxSizeMB: 1,
                useWebWorker: true,
            });
            const uploaded = await api.uploadPhoto(activity.id, compressed);
            addPhoto(activity.id, uploaded);
        } catch {
            setPhotosError("Errore upload foto. Riprova.");
        } finally {
            setUploadingPhoto(false);
        }
    }

    async function handleEditPhotoDelete(photoId: string): Promise<void> {
        if (mode !== "edit" || !activity) {
            return;
        }

        const confirmed = window.confirm("Eliminare questa foto?");
        if (!confirmed) {
            return;
        }

        setPhotosError(null);
        try {
            await api.delete(`/photos/${photoId}`);
            removePhoto(activity.id, photoId);
        } catch {
            setPhotosError("Errore eliminazione foto. Riprova.");
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setError(null);

        if (form.name.trim().length === 0 || form.address.trim().length === 0) {
            setError("Compila almeno nome e indirizzo.");
            return;
        }

        const effectiveTypeIds = form.selectedTypeIds.length > 0 ? form.selectedTypeIds : fallbackTypeId ? [fallbackTypeId] : [];

        if (effectiveTypeIds.length === 0) {
            setError("Seleziona almeno una tipologia o crea una tipologia generica.");
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
                type_ids: effectiveTypeIds,
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
            type_ids: effectiveTypeIds,
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
                    <label htmlFor="activity-address">Indirizzo *</label>
                    <input id="activity-address" value={form.address} onChange={event => updateField("address", event.target.value)} placeholder="Es. Via Roma 10, Genova" required />
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
                    <div className="activity-types-header">
                        <h3>Tipologie *</h3>
                        <Button type="button" variant="secondary" className="activity-manage-types-button" onClick={() => navigate("/private/types")}>
                            {types.length === 0 ? "Crea" : "Gestisci"}
                        </Button>
                    </div>
                    {types.length === 0 ? (
                        <p className="muted">Nessuna tipologia disponibile. Creane almeno una per continuare.</p>
                    ) : (
                        <p className="muted">Seleziona una o piu' tipologie per classificare l'attivita'. Se non ne scegli nessuna verra' usata una tipologia generica solo se gia' presente.</p>
                    )}
                    <div className="activity-types-grid">
                        {typeOptions.map(type => (
                            <button key={type.id} type="button" className={`activity-type-choice${type.selected ? " active" : ""}`} onClick={() => toggleType(type.id)}>
                                <span className="activity-type-choice-icon">
                                    <type.Icon />
                                </span>
                                <span className="activity-type-choice-label">{type.name}</span>
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

                {mode === "add" ? (
                    <div className="content-stack">
                        <h3>Foto</h3>
                        <p className="muted">Potrai caricare le foto subito dopo la creazione dalla pagina di modifica attività.</p>
                    </div>
                ) : null}

                {mode === "edit" && activity ? (
                    <div className="content-stack">
                        <h3>Foto</h3>
                        <div className="inline-actions">
                            <label className="activity-upload-label">
                                <input type="file" accept="image/*" onChange={event => void handleEditPhotoUpload(event)} disabled={uploadingPhoto} />
                                {uploadingPhoto ? "Upload in corso..." : "Carica foto"}
                            </label>
                        </div>
                        {photosError ? <div className="status-banner error">{photosError}</div> : null}

                        {activity.photos.length === 0 ? (
                            <p className="muted">Nessuna foto caricata</p>
                        ) : (
                            <div className="activity-photo-grid">
                                {activity.photos.map(photo => (
                                    <div className="activity-photo-card" key={photo.id}>
                                        <img src={photo.storage_path} alt={`Foto di ${activity.name}`} />
                                        <button type="button" className="activity-photo-delete" onClick={() => void handleEditPhotoDelete(photo.id)}>
                                            Elimina
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
