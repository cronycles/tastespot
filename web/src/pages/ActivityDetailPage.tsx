import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { IoChevronBackOutline, IoChevronForwardOutline, IoCloseOutline } from "react-icons/io5";
import { IoCreateOutline, IoHeart, IoHeartOutline, IoTrashOutline } from "react-icons/io5";
import { IoCallOutline, IoNavigateOutline, IoPricetagOutline, IoReaderOutline } from "react-icons/io5";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/Button";
import { SMILE_VALUES } from "@/config/scoring";
import { api } from "@/lib/api";
import { useActivitiesStore } from "@/stores/activitiesStore";
import { calcActivityAvgScore, calcCategoryAvgs, type ReviewWithType, useReviewsStore } from "@/stores/reviewsStore";
import { useTypesStore } from "@/stores/typesStore";

export function ActivityDetailPage() {
    const navigate = useNavigate();
    const params = useParams<{ id: string }>();
    const { activities, remove, toggleFavorite, addPhoto, removePhoto } = useActivitiesStore();
    const types = useTypesStore(state => state.types);
    const fetchReviews = useReviewsStore(state => state.fetch);
    const getForActivity = useReviewsStore(state => state.getForActivity);
    const getForType = useReviewsStore(state => state.getForType);
    const upsertReview = useReviewsStore(state => state.upsert);
    const reviewsLoading = useReviewsStore(state => state.loading);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photosError, setPhotosError] = useState<string | null>(null);
    const [reviewsError, setReviewsError] = useState<string | null>(null);
    const [savingTypeId, setSavingTypeId] = useState<string | null>(null);
    const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

    const activity = useMemo(() => activities.find(entry => entry.id === params.id), [activities, params.id]);

    const typeNamesById = useMemo(() => {
        return new Map(types.map(type => [type.id, type.name]));
    }, [types]);

    useEffect(() => {
        if (!params.id) {
            return;
        }
        void fetchReviews(params.id);
    }, [fetchReviews, params.id]);

    const photoCount = activity?.photos.length ?? 0;

    useEffect(() => {
        if (galleryIndex === null || photoCount === 0) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent): void {
            if (event.key === "Escape") {
                setGalleryIndex(null);
                return;
            }

            if (event.key === "ArrowLeft") {
                setGalleryIndex(current => {
                    if (current === null || photoCount === 0) {
                        return current;
                    }

                    return (current - 1 + photoCount) % photoCount;
                });
                return;
            }

            if (event.key === "ArrowRight") {
                setGalleryIndex(current => {
                    if (current === null || photoCount === 0) {
                        return current;
                    }

                    return (current + 1) % photoCount;
                });
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [galleryIndex, photoCount]);

    if (!params.id || !activity) {
        return <Navigate to="/" replace />;
    }

    const totalPhotos = activity.photos.length;
    const reviews = getForActivity(activity.id);
    const averageScore = calcActivityAvgScore(reviews);
    const categoryAvgs = calcCategoryAvgs(reviews);
    const activePhoto = galleryIndex === null ? null : (activity.photos[galleryIndex] ?? null);
    const activePhotoNumber = galleryIndex === null ? null : galleryIndex + 1;
    const heroPhoto = activity.photos[0] ?? null;
    const hasPhone = Boolean(activity.phone?.trim());
    const directionsUrl = activity.address?.trim()
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.address)}`
        : activity.lat != null && activity.lng != null
          ? `https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lng}`
          : null;

    async function handleDelete(): Promise<void> {
        const current = activity;
        if (!current) {
            return;
        }

        const confirmed = window.confirm(`Eliminare "${current.name}"?`);
        if (!confirmed) {
            return;
        }

        const error = await remove(current.id);
        if (error) {
            window.alert(error);
            return;
        }

        navigate("/", { replace: true });
    }

    async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
        const current = activity;
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!current || !file) {
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
            const uploaded = await api.uploadPhoto(current.id, compressed);
            addPhoto(current.id, uploaded);
        } catch {
            setPhotosError("Errore upload foto. Riprova.");
        } finally {
            setUploadingPhoto(false);
        }
    }

    async function handlePhotoDelete(photoId: string): Promise<void> {
        const current = activity;
        if (!current) {
            return;
        }

        const confirmed = window.confirm("Eliminare questa foto?");
        if (!confirmed) {
            return;
        }

        setPhotosError(null);
        try {
            await api.delete(`/photos/${photoId}`);
            removePhoto(current.id, photoId);
        } catch {
            setPhotosError("Errore eliminazione foto. Riprova.");
        }
    }

    async function handleReviewSave(typeId: string, payload: ReviewFormValues): Promise<void> {
        const current = activity;
        if (!current) {
            return;
        }

        setReviewsError(null);
        setSavingTypeId(typeId);
        const error = await upsertReview({
            activity_id: current.id,
            activity_type_id: typeId,
            score_location: payload.score_location,
            score_food: payload.score_food,
            score_service: payload.score_service,
            score_price: payload.score_price,
            cost_per_person: payload.cost_per_person,
            liked: payload.liked,
            disliked: payload.disliked,
            notes: payload.notes,
        });
        setSavingTypeId(null);

        if (error) {
            setReviewsError(error);
        }
    }

    function openGallery(index: number): void {
        setGalleryIndex(index);
    }

    function closeGallery(): void {
        setGalleryIndex(null);
    }

    function showPreviousPhoto(): void {
        if (galleryIndex === null || totalPhotos === 0) {
            return;
        }

        setGalleryIndex((galleryIndex - 1 + totalPhotos) % totalPhotos);
    }

    function showNextPhoto(): void {
        if (galleryIndex === null || totalPhotos === 0) {
            return;
        }

        setGalleryIndex((galleryIndex + 1) % totalPhotos);
    }

    function handleOpenDirections(): void {
        if (!directionsUrl) {
            return;
        }

        window.open(directionsUrl, "_blank", "noopener,noreferrer");
    }

    function handleCall(): void {
        const current = activity;
        if (!current) {
            return;
        }

        const phone = current.phone?.trim();
        if (!phone) {
            return;
        }

        window.location.href = `tel:${phone}`;
    }

    return (
        <section className="page-card activity-detail-page">
            <div className={`activity-detail-hero-v2${heroPhoto ? "" : " no-photo"}`} style={heroPhoto ? { backgroundImage: `url(${heroPhoto.storage_path})` } : undefined}>
                <div className="activity-detail-hero-scrim" />
                <div className="activity-detail-hero-top">
                    {totalPhotos > 0 ? (
                        <button type="button" className="activity-hero-photo-count" onClick={() => openGallery(0)}>
                            Foto {totalPhotos}
                        </button>
                    ) : null}
                </div>

                <div className="activity-detail-hero-content">
                    <h1>{activity.name}</h1>
                    {activity.address ? <p>{activity.address}</p> : null}
                </div>
            </div>

            <div className="activity-detail-sheet">
                <div className="activity-detail-quick-actions">
                    <button type="button" className="activity-quick-action" onClick={() => void toggleFavorite(activity.id)}>
                        {activity.is_favorite ? <IoHeart /> : <IoHeartOutline />}
                        <span>{activity.is_favorite ? "Preferito" : "Preferiti"}</span>
                    </button>
                    <button type="button" className="activity-quick-action" onClick={() => navigate(`/activity/${activity.id}/edit`)}>
                        <IoCreateOutline />
                        <span>Modifica</span>
                    </button>
                    <button type="button" className="activity-quick-action" onClick={handleOpenDirections} disabled={!directionsUrl}>
                        <IoNavigateOutline />
                        <span>Indicazioni</span>
                    </button>
                    <button type="button" className="activity-quick-action" onClick={handleCall} disabled={!hasPhone}>
                        <IoCallOutline />
                        <span>Chiama</span>
                    </button>
                </div>

                <div className="content-stack activity-detail-section">
                    <h3>Tipologie</h3>
                    <div className="activities-meta-row">
                        {activity.type_ids.map(typeId => (
                            <span className="tag-pill" key={typeId}>
                                {typeNamesById.get(typeId) ?? "Tipo"}
                            </span>
                        ))}
                    </div>

                    <div className="activity-inline-meta-row">
                        <IoPricetagOutline />
                        <span>{activity.tags.length === 0 ? "Nessun tag" : activity.tags.map(tag => `#${tag}`).join(" ")}</span>
                    </div>

                    <div className="activity-inline-meta-row">
                        <IoReaderOutline />
                        <span>{activity.notes?.trim() ? activity.notes : "Nessuna nota"}</span>
                    </div>

                    {activity.phone ? <p className="muted">Telefono: {activity.phone}</p> : null}
                </div>

                <div className="content-stack activity-detail-section">
                    <h3>Punteggi medi</h3>
                    {averageScore === null ? (
                        <p className="muted">Nessuna recensione ancora presente</p>
                    ) : (
                        <div className="metric-row">
                            <div className="metric-card">
                                <span className="muted">Media generale</span>
                                <span className="metric-value">{averageScore.toFixed(1)}/10</span>
                            </div>
                            <div className="metric-card">
                                <span className="muted">Location</span>
                                <span className="metric-value">{formatScore(categoryAvgs.location)}</span>
                            </div>
                            <div className="metric-card">
                                <span className="muted">Cibo</span>
                                <span className="metric-value">{formatScore(categoryAvgs.food)}</span>
                            </div>
                            <div className="metric-card">
                                <span className="muted">Servizio</span>
                                <span className="metric-value">{formatScore(categoryAvgs.service)}</span>
                            </div>
                            <div className="metric-card">
                                <span className="muted">Conto</span>
                                <span className="metric-value">{formatScore(categoryAvgs.price)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="content-stack activity-detail-section">
                    <h3>Recensioni per tipologia</h3>
                    {reviewsLoading ? <p className="muted">Caricamento recensioni...</p> : null}
                    {reviewsError ? <div className="status-banner error">{reviewsError}</div> : null}
                    <div className="reviews-grid">
                        {activity.type_ids.map(typeId => {
                            const existingReview = getForType(activity.id, typeId);
                            return (
                                <ReviewEditorCard
                                    key={`${typeId}-${existingReview?.id ?? "new"}-${existingReview?.updated_at ?? "0"}`}
                                    activityTypeId={typeId}
                                    typeName={typeNamesById.get(typeId) ?? "Tipologia"}
                                    existing={existingReview}
                                    saving={savingTypeId === typeId}
                                    onSave={payload => void handleReviewSave(typeId, payload)}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="content-stack activity-detail-section">
                    <h3>Foto</h3>
                    <div className="inline-actions">
                        <label className="activity-upload-label">
                            <input type="file" accept="image/*" onChange={event => void handlePhotoUpload(event)} disabled={uploadingPhoto} />
                            {uploadingPhoto ? "Upload in corso..." : "Carica foto"}
                        </label>
                    </div>
                    {photosError ? <div className="status-banner error">{photosError}</div> : null}

                    {activity.photos.length === 0 ? (
                        <p className="muted">Nessuna foto caricata</p>
                    ) : (
                        <div className="activity-photo-grid">
                            {activity.photos.map((photo, index) => (
                                <div className="activity-photo-card" key={photo.id}>
                                    <button
                                        type="button"
                                        className="activity-photo-preview"
                                        onClick={() => openGallery(index)}
                                        aria-label={`Apri foto ${index + 1} di ${totalPhotos}`}
                                    >
                                        <img src={photo.storage_path} alt={`Foto ${index + 1} di ${activity.name}`} />
                                    </button>
                                    <button type="button" className="activity-photo-delete" onClick={() => void handlePhotoDelete(photo.id)}>
                                        Elimina
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button type="button" variant="danger" onClick={() => void handleDelete()}>
                    <IoTrashOutline /> Elimina attività
                </Button>
                {activity.lat != null && activity.lng != null ? (
                    <p className="muted">
                        Coordinate: {activity.lat.toFixed(5)}, {activity.lng.toFixed(5)}
                    </p>
                ) : null}
            </div>

            {activePhoto ? (
                <div className="activity-gallery-overlay" role="dialog" aria-modal="true" aria-label="Galleria foto" onClick={closeGallery}>
                    <div className="activity-gallery-dialog" onClick={event => event.stopPropagation()}>
                        <button type="button" className="activity-gallery-close" onClick={closeGallery} aria-label="Chiudi galleria">
                            <IoCloseOutline />
                        </button>
                        <button type="button" className="activity-gallery-nav prev" onClick={showPreviousPhoto} aria-label="Foto precedente">
                            <IoChevronBackOutline />
                        </button>
                        <figure className="activity-gallery-figure">
                            <img src={activePhoto.storage_path} alt={`Foto ${activePhotoNumber} di ${activity.name}`} />
                            <figcaption>
                                {activePhotoNumber} / {totalPhotos}
                            </figcaption>
                        </figure>
                        <button type="button" className="activity-gallery-nav next" onClick={showNextPhoto} aria-label="Foto successiva">
                            <IoChevronForwardOutline />
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

type ReviewFormValues = {
    score_location: number | null;
    score_food: number | null;
    score_service: number | null;
    score_price: number | null;
    cost_per_person: number | null;
    liked: string | null;
    disliked: string | null;
    notes: string | null;
};

type ReviewEditorCardProps = {
    activityTypeId: string;
    typeName: string;
    existing: ReviewWithType | null;
    saving: boolean;
    onSave: (payload: ReviewFormValues) => void;
};

function ReviewEditorCard({ activityTypeId, typeName, existing, saving, onSave }: ReviewEditorCardProps) {
    const [scoreLocation, setScoreLocation] = useState<number | null>(existing?.score_location ?? null);
    const [scoreFood, setScoreFood] = useState<number | null>(existing?.score_food ?? null);
    const [scoreService, setScoreService] = useState<number | null>(existing?.score_service ?? null);
    const [scorePrice, setScorePrice] = useState<number | null>(existing?.score_price ?? null);
    const [costPerPerson, setCostPerPerson] = useState(existing?.cost_per_person ? String(existing.cost_per_person) : "");
    const [liked, setLiked] = useState(existing?.liked ?? "");
    const [disliked, setDisliked] = useState(existing?.disliked ?? "");
    const [notes, setNotes] = useState(existing?.notes ?? "");
    const [localError, setLocalError] = useState<string | null>(null);

    function handleSave(): void {
        const hasAnyScore = scoreLocation !== null || scoreFood !== null || scoreService !== null || scorePrice !== null;
        if (!hasAnyScore) {
            setLocalError("Inserisci almeno un punteggio.");
            return;
        }

        setLocalError(null);
        onSave({
            score_location: scoreLocation,
            score_food: scoreFood,
            score_service: scoreService,
            score_price: scorePrice,
            cost_per_person: costPerPerson.trim() ? Number(costPerPerson) : null,
            liked: liked.trim() ? liked.trim() : null,
            disliked: disliked.trim() ? disliked.trim() : null,
            notes: notes.trim() ? notes.trim() : null,
        });
    }

    return (
        <article className="review-card" data-type-id={activityTypeId}>
            <div className="types-toolbar">
                <h3>{typeName}</h3>
                <Button type="button" variant="secondary" onClick={handleSave} disabled={saving}>
                    {saving ? "Salvataggio..." : "Salva"}
                </Button>
            </div>

            <div className="review-scores-grid">
                <ScoreField label="Location" value={scoreLocation} onChange={setScoreLocation} />
                <ScoreField label="Cibo" value={scoreFood} onChange={setScoreFood} />
                <ScoreField label="Servizio" value={scoreService} onChange={setScoreService} />
                <ScoreField label="Conto" value={scorePrice} onChange={setScorePrice} />
            </div>

            <div className="field">
                <label>Costo per persona (EUR)</label>
                <input type="number" min={0} step="0.1" value={costPerPerson} onChange={event => setCostPerPerson(event.target.value)} placeholder="Es. 18" />
            </div>

            <div className="field">
                <label>Cosa ti e' piaciuto</label>
                <textarea rows={2} value={liked} onChange={event => setLiked(event.target.value)} placeholder="Es. locale accogliente" />
            </div>

            <div className="field">
                <label>Cosa non ti e' piaciuto</label>
                <textarea rows={2} value={disliked} onChange={event => setDisliked(event.target.value)} placeholder="Es. tempi di attesa" />
            </div>

            <div className="field">
                <label>Note</label>
                <textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Ulteriori dettagli" />
            </div>

            {existing ? <p className="muted">Aggiornata: {new Date(existing.updated_at).toLocaleDateString("it-IT")}</p> : null}

            {localError ? <div className="status-banner error">{localError}</div> : null}
        </article>
    );
}

type ScoreFieldProps = {
    label: string;
    value: number | null;
    onChange: (value: number) => void;
};

function ScoreField({ label, value, onChange }: ScoreFieldProps) {
    return (
        <div className="content-stack">
            <p className="muted">{label}</p>
            <div className="review-score-buttons">
                {SMILE_VALUES.map(score => (
                    <button key={score} type="button" className={`activities-chip ${value === score ? "active" : ""}`} onClick={() => onChange(score)}>
                        {SMILE_EMOJI[score]}
                    </button>
                ))}
            </div>
        </div>
    );
}

function formatScore(score: number | null): string {
    return score === null ? "-" : `${score.toFixed(1)}/10`;
}

const SMILE_EMOJI: Record<number, string> = { 1: "😞", 3.5: "😕", 6: "😐", 8: "🙂", 10: "😝" };
