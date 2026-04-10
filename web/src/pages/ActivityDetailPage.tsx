import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { IoChevronBackOutline, IoChevronDownOutline, IoChevronForwardOutline, IoChevronUpOutline, IoCloseOutline } from "react-icons/io5";
import { IoCreateOutline, IoHeart, IoHeartOutline, IoTrashOutline } from "react-icons/io5";
import { IoCallOutline, IoNavigateOutline, IoPricetagOutline, IoReaderOutline } from "react-icons/io5";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/Button";
import { api } from "@/lib/api";
import { useActivitiesStore } from "@/stores/activitiesStore";
import { calcActivityAvgScore, calcCategoryAvgs, useReviewsStore } from "@/stores/reviewsStore";
import { useTypesStore } from "@/stores/typesStore";

export function ActivityDetailPage() {
    const navigate = useNavigate();
    const params = useParams<{ id: string }>();
    const { activities, remove, toggleFavorite, addPhoto, removePhoto, markViewed } = useActivitiesStore();
    const types = useTypesStore(state => state.types);
    const fetchReviews = useReviewsStore(state => state.fetch);
    const getForActivity = useReviewsStore(state => state.getForActivity);
    const getForType = useReviewsStore(state => state.getForType);
    const reviewsLoading = useReviewsStore(state => state.loading);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photosError, setPhotosError] = useState<string | null>(null);
    const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
    const [showScoreDetails, setShowScoreDetails] = useState(false);

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
                        <>
                            <button type="button" className="activity-score-toggle" onClick={() => setShowScoreDetails(current => !current)}>
                                <span className="activity-score-toggle-main">
                                    <span className="muted">Media generale</span>
                                    <strong>{averageScore.toFixed(1)}/10</strong>
                                </span>
                                <span className="activity-score-toggle-icon">{showScoreDetails ? <IoChevronUpOutline /> : <IoChevronDownOutline />}</span>
                            </button>

                            {showScoreDetails ? (
                                <div className="metric-row">
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
                            ) : null}
                        </>
                    )}
                </div>

                <div className="content-stack activity-detail-section">
                    <h3>Recensioni per tipologia</h3>
                    {reviewsLoading ? <p className="muted">Caricamento recensioni...</p> : null}
                    <div className="reviews-grid">
                        {activity.type_ids.map(typeId => {
                            const existingReview = getForType(activity.id, typeId);
                            const typeName = typeNamesById.get(typeId) ?? "Tipologia";

                            return (
                                <article className="review-card review-summary-card" key={`${typeId}-${existingReview?.id ?? "new"}`}>
                                    <div className="types-toolbar">
                                        <h3>{typeName}</h3>
                                        <Button
                                            type="button"
                                            variant={existingReview ? "secondary" : "primary"}
                                            onClick={() => navigate(`/activity/${activity.id}/review/${typeId}`)}
                                        >
                                            {existingReview ? "Modifica recensione" : `Aggiungi recensione`}
                                        </Button>
                                    </div>

                                    {existingReview ? (
                                        <>
                                            <p className="muted">Aggiornata: {new Date(existingReview.updated_at).toLocaleDateString("it-IT")}</p>
                                            {existingReview.notes ? <p>{existingReview.notes}</p> : null}
                                        </>
                                    ) : (
                                        <p className="muted">Nessuna recensione per questa tipologia.</p>
                                    )}
                                </article>
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

function formatScore(score: number | null): string {
    return score === null ? "-" : `${score.toFixed(1)}/10`;
}
