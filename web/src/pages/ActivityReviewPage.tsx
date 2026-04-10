import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { SMILE_VALUES } from "@/config/scoring";
import { useActivitiesStore } from "@/stores/activitiesStore";
import { type ReviewWithType, useReviewsStore } from "@/stores/reviewsStore";
import { useTypesStore } from "@/stores/typesStore";

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

type ReviewFormCardProps = {
    existing: ReviewWithType | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    onSave: (payload: ReviewFormValues) => Promise<void>;
    onCancel: () => void;
};

const SMILE_EMOJI: Record<number, string> = {
    1: "😞",
    3: "😕",
    5.5: "😐",
    7.5: "🙂",
    10: "😝",
};

export function ActivityReviewPage() {
    const navigate = useNavigate();
    const params = useParams<{ id: string; typeId: string }>();
    const activityId = params.id;
    const typeId = params.typeId;
    const activity = useActivitiesStore(state => state.activities.find(entry => entry.id === activityId));
    const types = useTypesStore(state => state.types);

    const fetchReviews = useReviewsStore(state => state.fetch);
    const getForType = useReviewsStore(state => state.getForType);
    const upsertReview = useReviewsStore(state => state.upsert);
    const loading = useReviewsStore(state => state.loading);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!activityId) {
            return;
        }
        void fetchReviews(activityId);
    }, [activityId, fetchReviews]);

    const existing = useMemo(() => {
        if (!activityId || !typeId) {
            return null;
        }
        return getForType(activityId, typeId);
    }, [activityId, getForType, typeId]);

    const typeName = useMemo(() => {
        return types.find(type => type.id === typeId)?.name ?? "Tipologia";
    }, [typeId, types]);

    if (!activityId || !typeId || !activity) {
        return <Navigate to="/" replace />;
    }

    const safeActivityId = activityId;
    const safeTypeId = typeId;

    async function handleSave(payload: ReviewFormValues): Promise<void> {
        setError(null);
        setSaving(true);
        const saveError = await upsertReview({
            activity_id: safeActivityId,
            activity_type_id: safeTypeId,
            ...payload,
        });
        setSaving(false);

        if (saveError) {
            setError(saveError);
            return;
        }

        navigate(`/activity/${safeActivityId}`, { replace: true });
    }

    return (
        <section className="page-card review-page">
            <div className="content-stack review-hero-card">
                <p className="eyebrow">Recensione attività</p>
                <h1>{activity.name}</h1>
                <p className="muted">Tipologia: {typeName}</p>
            </div>

            <ReviewFormCard
                key={`${safeTypeId}-${existing?.id ?? "new"}-${existing?.updated_at ?? "0"}`}
                existing={existing}
                loading={loading}
                saving={saving}
                error={error}
                onSave={handleSave}
                onCancel={() => navigate(-1)}
            />
        </section>
    );
}

function ReviewFormCard({ existing, loading, saving, error, onSave, onCancel }: ReviewFormCardProps) {
    const [scoreLocation, setScoreLocation] = useState<number | null>(existing?.score_location ?? null);
    const [scoreFood, setScoreFood] = useState<number | null>(existing?.score_food ?? null);
    const [scoreService, setScoreService] = useState<number | null>(existing?.score_service ?? null);
    const [scorePrice, setScorePrice] = useState<number | null>(existing?.score_price ?? null);
    const [costPerPerson, setCostPerPerson] = useState(existing?.cost_per_person ? String(existing.cost_per_person) : "");
    const [liked, setLiked] = useState(existing?.liked ?? "");
    const [disliked, setDisliked] = useState(existing?.disliked ?? "");
    const [notes, setNotes] = useState(existing?.notes ?? "");
    const [localError, setLocalError] = useState<string | null>(null);

    function buildPayload(): ReviewFormValues | null {
        const hasAnyScore = scoreLocation !== null || scoreFood !== null || scoreService !== null || scorePrice !== null;
        if (!hasAnyScore) {
            setLocalError("Inserisci almeno un punteggio.");
            return null;
        }

        setLocalError(null);
        return {
            score_location: scoreLocation,
            score_food: scoreFood,
            score_service: scoreService,
            score_price: scorePrice,
            cost_per_person: costPerPerson.trim() ? Number(costPerPerson) : null,
            liked: liked.trim() ? liked.trim() : null,
            disliked: disliked.trim() ? disliked.trim() : null,
            notes: notes.trim() ? notes.trim() : null,
        };
    }

    return (
        <article className="review-card">
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

            {existing ? (
                <p className="muted">
                    Creata: {new Date(existing.created_at).toLocaleDateString("it-IT")} · Aggiornata: {new Date(existing.updated_at).toLocaleDateString("it-IT")}
                </p>
            ) : null}

            {loading ? <p className="muted">Caricamento recensione...</p> : null}
            {localError ? <div className="status-banner error">{localError}</div> : null}
            {error ? <div className="status-banner error">{error}</div> : null}

            <div className="inline-actions">
                <Button
                    type="button"
                    onClick={() => {
                        const payload = buildPayload();
                        if (!payload) {
                            return;
                        }
                        void onSave(payload);
                    }}
                    disabled={saving}
                >
                    {saving ? "Salvataggio..." : existing ? "Salva modifiche" : "Salva recensione"}
                </Button>
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Annulla
                </Button>
            </div>
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
