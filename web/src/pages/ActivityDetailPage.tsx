import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { IoChevronBackOutline, IoChevronForwardOutline, IoCloseOutline } from "react-icons/io5";
import { IoCreateOutline, IoHeart, IoHeartOutline, IoTrashOutline } from "react-icons/io5";
import { IoCallOutline, IoNavigateOutline, IoPricetagOutline, IoReaderOutline } from "react-icons/io5";
import { Button } from "@/components/Button";
import { getActivityTypeIcon } from "@/lib/activityTypeIcons";
import { type UpdateActivityData, useActivitiesStore } from "@/stores/activitiesStore";
import { calcActivityAvgScore, calcCategoryAvgs, useReviewsStore } from "@/stores/reviewsStore";
import { useTypesStore } from "@/stores/typesStore";

export function ActivityDetailPage() {
    const navigate = useNavigate();
    const params = useParams<{ id: string }>();
    const { activities, update, remove, toggleFavorite, markViewed } = useActivitiesStore();
    const types = useTypesStore(state => state.types);
    const fetchReviews = useReviewsStore(state => state.fetch);
    const getForActivity = useReviewsStore(state => state.getForActivity);
    const getForType = useReviewsStore(state => state.getForType);
    const reviewsLoading = useReviewsStore(state => state.loading);
    const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
    const [editingNotes, setEditingNotes] = useState(false);
    const [editingTags, setEditingTags] = useState(false);
    const [notesDraft, setNotesDraft] = useState("");
    const [tagsDraft, setTagsDraft] = useState("");
    const [metaSaving, setMetaSaving] = useState(false);
    const [metaError, setMetaError] = useState<string | null>(null);

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

    useEffect(() => {
        if (!params.id) {
            return;
        }

        void markViewed(params.id);
    }, [markViewed, params.id]);

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

    function parseTags(value: string): string[] {
        return value
            .split(/[,\s]+/)
            .map(entry => entry.trim().toLowerCase())
            .filter(entry => entry.length > 0)
            .filter((entry, index, all) => all.indexOf(entry) === index);
    }

    async function saveActivityPatch(patch: Partial<UpdateActivityData>): Promise<boolean> {
        const current = activity;
        if (!current) {
            return false;
        }

        setMetaSaving(true);
        setMetaError(null);
        const result = await update(current.id, {
            name: current.name,
            address: current.address,
            lat: current.lat,
            lng: current.lng,
            phone: current.phone,
            notes: current.notes,
            tags: current.tags,
            type_ids: current.type_ids,
            ...patch,
        });
        setMetaSaving(false);

        if (result) {
            setMetaError(result);
            return false;
        }

        return true;
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

    const typeById = new Map(types.map(type => [type.id, type]));

    return (
        <section className="page-card activity-detail-page">
            <div className={`activity-detail-hero-v2${heroPhoto ? "" : " no-photo"}`} style={heroPhoto ? { backgroundImage: `url(${heroPhoto.storage_path})` } : undefined}>
                <div className="activity-detail-hero-scrim" />
                <div className="activity-detail-hero-top">
                    <button type="button" className="activity-hero-round-btn" onClick={() => navigate(`/activity/${activity.id}/edit`)} aria-label="Modifica attività">
                        <IoCreateOutline />
                    </button>
                    {totalPhotos > 0 ? (
                        <button type="button" className="activity-hero-photo-count" onClick={() => openGallery(0)}>
                            Foto {totalPhotos}
                        </button>
                    ) : null}
                </div>

                <div className="activity-detail-hero-content">
                    <h1>{activity.name}</h1>
                    {activity.address ? <p>{activity.address}</p> : null}
                    {averageScore !== null ? (
                        <span className="activity-score-pill">
                            <strong>{averageScore.toFixed(1)}</strong>
                            <span className="muted" style={{ fontWeight: 400, fontSize: '0.78rem' }}>/10</span>
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="activity-detail-sheet">

                {/* Quick actions */}
                <div className="activity-detail-quick-actions">
                    <button type="button" className="activity-quick-action" onClick={() => void toggleFavorite(activity.id)}>
                        {activity.is_favorite ? <IoHeart /> : <IoHeartOutline />}
                        <span>{activity.is_favorite ? "Preferito" : "Preferiti"}</span>
                    </button>
                    <button
                        type="button"
                        className={`activity-quick-action${editingNotes ? " active" : ""}`}
                        onClick={() => {
                            setEditingNotes(current => {
                                const next = !current;
                                if (next) {
                                    setNotesDraft(activity.notes ?? "");
                                }
                                return next;
                            });
                            setEditingTags(false);
                        }}
                    >
                        <IoReaderOutline />
                        <span>Note</span>
                    </button>
                    <button
                        type="button"
                        className={`activity-quick-action${editingTags ? " active" : ""}`}
                        onClick={() => {
                            setEditingTags(current => {
                                const next = !current;
                                if (next) {
                                    setTagsDraft(activity.tags.join(", "));
                                }
                                return next;
                            });
                            setEditingNotes(false);
                        }}
                    >
                        <IoPricetagOutline />
                        <span>Tag</span>
                    </button>
                    <button type="button" className="activity-quick-action" onClick={handleOpenDirections} disabled={!directionsUrl}>
                        <IoNavigateOutline />
                        <span>Indicazioni</span>
                    </button>
                    {hasPhone ? (
                        <button type="button" className="activity-quick-action" onClick={handleCall}>
                            <IoCallOutline />
                            <span>Chiama</span>
                        </button>
                    ) : null}
                </div>

                {/* Info row — types + phone */}
                <div className="ad-info-row">
                    <div className="ad-info-block">
                        <span className="ad-label">Tipologie</span>
                        <div className="activity-types-inline">
                            {activity.type_ids.map(typeId => {
                                const type = typeById.get(typeId);
                                const Icon = getActivityTypeIcon(type?.icon_key);
                                return (
                                    <span className="activity-type-inline-chip" key={typeId}>
                                        <Icon />
                                        {type?.name ?? typeNamesById.get(typeId) ?? "Tipo"}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                    {hasPhone ? (
                        <div className="ad-info-block">
                            <span className="ad-label">Telefono</span>
                            <span className="ad-info-value">{activity.phone}</span>
                        </div>
                    ) : null}
                </div>

                {/* Score strip */}
                {averageScore !== null ? (
                    <div className="ad-score-strip">
                        <span className="ad-label">Punteggi medi</span>
                        <div className="ad-score-cells">
                            <div className="ad-score-cell">
                                <span className="ad-score-cell-label">Location</span>
                                <strong className="ad-score-cell-value">{formatScore(categoryAvgs.location)}</strong>
                            </div>
                            <div className="ad-score-cell">
                                <span className="ad-score-cell-label">Cibo</span>
                                <strong className="ad-score-cell-value">{formatScore(categoryAvgs.food)}</strong>
                            </div>
                            <div className="ad-score-cell">
                                <span className="ad-score-cell-label">Servizio</span>
                                <strong className="ad-score-cell-value">{formatScore(categoryAvgs.service)}</strong>
                            </div>
                            <div className="ad-score-cell">
                                <span className="ad-score-cell-label">Conto</span>
                                <strong className="ad-score-cell-value">{formatScore(categoryAvgs.price)}</strong>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Note editor */}
                {editingNotes ? (
                    <div className="content-stack activity-detail-section">
                        <span className="ad-label">Note generiche</span>
                        <textarea rows={3} value={notesDraft} onChange={event => setNotesDraft(event.target.value)} placeholder="Aggiungi una nota" />
                        <div className="inline-actions">
                            <Button
                                type="button"
                                onClick={() => {
                                    void saveActivityPatch({
                                        notes: notesDraft.trim() || null,
                                    }).then(success => {
                                        if (success) {
                                            setEditingNotes(false);
                                        }
                                    });
                                }}
                                disabled={metaSaving}
                            >
                                {metaSaving ? "Salvataggio..." : "Salva note"}
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => setEditingNotes(false)}>
                                Annulla
                            </Button>
                        </div>
                    </div>
                ) : null}

                {/* Tag editor */}
                {editingTags ? (
                    <div className="content-stack activity-detail-section">
                        <span className="ad-label">Tag</span>
                        <textarea rows={2} value={tagsDraft} onChange={event => setTagsDraft(event.target.value)} placeholder="es. economico, brunch, vista" />
                        <div className="inline-actions">
                            <Button
                                type="button"
                                onClick={() => {
                                    void saveActivityPatch({
                                        tags: parseTags(tagsDraft),
                                    }).then(success => {
                                        if (success) {
                                            setEditingTags(false);
                                        }
                                    });
                                }}
                                disabled={metaSaving}
                            >
                                {metaSaving ? "Salvataggio..." : "Salva tag"}
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => setEditingTags(false)}>
                                Annulla
                            </Button>
                        </div>
                    </div>
                ) : null}

                {metaError ? <div className="status-banner error">{metaError}</div> : null}

                {/* Reviews per type */}
                <div className="ad-reviews-section">
                    <span className="ad-label">Recensioni per tipologia</span>
                    {reviewsLoading ? <p className="muted">Caricamento recensioni...</p> : null}
                    <div className="reviews-grid">
                        {activity.type_ids.map(typeId => {
                            const existingReview = getForType(activity.id, typeId);
                            const typeName = typeNamesById.get(typeId) ?? "Tipologia";
                            const reviewAverage = existingReview ? calcActivityAvgScore([existingReview]) : null;
                            const reviewCategoryAvgs = existingReview ? calcCategoryAvgs([existingReview]) : null;

                            return (
                                <article className="review-card review-summary-card" key={`${typeId}-${existingReview?.id ?? "new"}`}>
                                    <div className="ad-review-card-header">
                                        <div className="ad-review-card-title-row">
                                            <h4 className="ad-review-card-title">{typeName}</h4>
                                            {reviewAverage !== null ? (
                                                <span className="ad-review-avg-badge">{reviewAverage.toFixed(1)}</span>
                                            ) : null}
                                        </div>
                                        <button
                                            type="button"
                                            className="ad-edit-pill"
                                            onClick={() => navigate(`/activity/${activity.id}/review/${typeId}`)}
                                        >
                                            <IoCreateOutline />
                                            {existingReview ? "Modifica" : "Aggiungi"}
                                        </button>
                                    </div>

                                    {existingReview ? (
                                        <>
                                            <div className="ad-review-scores">
                                                <span className="ad-review-score-item"><span className="ad-review-score-label">Location</span><strong>{formatScore(reviewCategoryAvgs?.location ?? null)}</strong></span>
                                                <span className="ad-review-score-item"><span className="ad-review-score-label">Cibo</span><strong>{formatScore(reviewCategoryAvgs?.food ?? null)}</strong></span>
                                                <span className="ad-review-score-item"><span className="ad-review-score-label">Servizio</span><strong>{formatScore(reviewCategoryAvgs?.service ?? null)}</strong></span>
                                                <span className="ad-review-score-item"><span className="ad-review-score-label">Conto</span><strong>{formatScore(reviewCategoryAvgs?.price ?? null)}</strong></span>
                                            </div>
                                            {existingReview.notes ? <p className="ad-review-notes">{existingReview.notes}</p> : null}
                                            <p className="muted ad-review-date">
                                                {new Date(existingReview.created_at).toLocaleDateString("it-IT")}
                                                {existingReview.updated_at !== existingReview.created_at
                                                    ? ` · mod. ${new Date(existingReview.updated_at).toLocaleDateString("it-IT")}`
                                                    : ""}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="muted">Nessuna recensione per questa tipologia.</p>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </div>

                <button type="button" className="ad-delete-btn" onClick={() => void handleDelete()}>
                    <IoTrashOutline /> Elimina attività
                </button>
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

function formatScore(score: number | null): string {
    return score === null ? "-" : `${score.toFixed(1)}/10`;
}
