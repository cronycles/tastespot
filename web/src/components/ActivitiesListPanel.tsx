import { useEffect, useMemo, useState } from "react";
import { IoHeart, IoHeartOutline, IoLocationOutline, IoSearchOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { useActivitiesStore, type ActivityWithDetails } from "@/stores/activitiesStore";
import { useLocationStore } from "@/stores/locationStore";
import { calcActivityAvgScore } from "@/stores/reviewsStore";
import { useTypesStore } from "@/stores/typesStore";

type CategoryKey = "location" | "food" | "service" | "price";

type SortKey = "alpha" | "last_viewed" | "last_reviewed" | "distance";
type SortDir = "asc" | "desc";

function normalizeText(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

type Props = {
    title: string;
    fixedFavoritesOnly?: boolean;
    eyebrow?: string;
    initialSortKey?: SortKey;
    initialSortDir?: SortDir;
    autoRequestLocation?: boolean;
    initialQuery?: string;
};

const CATEGORY_OPTIONS: Array<{ key: CategoryKey; label: string }> = [
    { key: "location", label: "Location" },
    { key: "food", label: "Cibo" },
    { key: "service", label: "Servizio" },
    { key: "price", label: "Conto" },
];

function clampScore(value: number): number {
    return Math.min(10, Math.max(0, value));
}

function parseScoreInput(value: string): number {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
        return 0;
    }

    return clampScore(parsed);
}

function getReviewScore(entry: ActivityWithDetails["review_summaries"][number], category: CategoryKey): number | null {
    if (category === "location") {
        return entry.score_location;
    }

    if (category === "food") {
        return entry.score_food;
    }

    if (category === "service") {
        return entry.score_service;
    }

    return entry.score_price;
}

function distanceKm(lat1: number, lng1: number, lat2: number | null, lng2: number | null): number {
    if (lat2 == null || lng2 == null) {
        return Number.POSITIVE_INFINITY;
    }

    const radius = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function compareIsoDate(first: string | null, second: string | null, sortDir: SortDir): number {
    if (!first && !second) {
        return 0;
    }

    if (!first) {
        return 1;
    }

    if (!second) {
        return -1;
    }

    return sortDir === "asc" ? first.localeCompare(second) : second.localeCompare(first);
}

function compareAlpha(first: ActivityWithDetails, second: ActivityWithDetails, sortDir: SortDir): number {
    const sign = sortDir === "asc" ? 1 : -1;
    return sign * first.name.localeCompare(second.name, "it");
}

function sortActivities(entries: ActivityWithDetails[], sortKey: SortKey, sortDir: SortDir, lat: number, lng: number): ActivityWithDetails[] {
    return [...entries].sort((first, second) => {
        if (sortKey === "distance") {
            const firstDistance = distanceKm(lat, lng, first.lat, first.lng);
            const secondDistance = distanceKm(lat, lng, second.lat, second.lng);
            const distanceDiff = sortDir === "asc" ? firstDistance - secondDistance : secondDistance - firstDistance;

            if (distanceDiff !== 0) {
                return distanceDiff;
            }

            const viewedFallback = compareIsoDate(first.last_viewed_at, second.last_viewed_at, "desc");
            if (viewedFallback !== 0) {
                return viewedFallback;
            }

            const reviewedFallback = compareIsoDate(first.latest_reviewed_at, second.latest_reviewed_at, "desc");
            if (reviewedFallback !== 0) {
                return reviewedFallback;
            }

            return compareAlpha(first, second, "asc");
        }

        if (sortKey === "last_viewed") {
            const viewedDiff = compareIsoDate(first.last_viewed_at, second.last_viewed_at, sortDir);
            if (viewedDiff !== 0) {
                return viewedDiff;
            }

            const reviewedFallback = compareIsoDate(first.latest_reviewed_at, second.latest_reviewed_at, "desc");
            if (reviewedFallback !== 0) {
                return reviewedFallback;
            }

            return compareAlpha(first, second, "asc");
        }

        if (sortKey === "last_reviewed") {
            const reviewedDiff = compareIsoDate(first.latest_reviewed_at, second.latest_reviewed_at, sortDir);
            if (reviewedDiff !== 0) {
                return reviewedDiff;
            }

            return compareAlpha(first, second, "asc");
        }

        return compareAlpha(first, second, sortDir);
    });
}

export function ActivitiesListPanel({ title, fixedFavoritesOnly = false, eyebrow, initialSortKey = "alpha", initialSortDir = "asc", autoRequestLocation = false, initialQuery = "" }: Props) {
    const navigate = useNavigate();
    const { activities, loading, hasMore, fetch, toggleFavorite } = useActivitiesStore();
    const { types, fetch: fetchTypes } = useTypesStore();
    const { coords, hasPermission, requestAndFetch } = useLocationStore();

    const [query, setQuery] = useState(initialQuery);
    const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>(initialSortKey);
    const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);
    const [avgScoreMin, setAvgScoreMin] = useState("0");
    const [avgScoreMax, setAvgScoreMax] = useState("10");
    const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>([]);
    const [categoryScoreMin, setCategoryScoreMin] = useState("0");
    const [categoryScoreMax, setCategoryScoreMax] = useState("10");

    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
        void fetch(true);
        void fetchTypes();
    }, [fetch, fetchTypes]);

    useEffect(() => {
        if (!autoRequestLocation) {
            return;
        }

        void requestAndFetch();
    }, [autoRequestLocation, requestAndFetch]);

    const typeNamesById = useMemo(() => {
        return new Map(types.map(type => [type.id, type.name]));
    }, [types]);

    const visible = useMemo(() => {
        const normalizedQuery = normalizeText(query);
        const activeFavoritesOnly = fixedFavoritesOnly || favoritesOnly;
        const effectiveAvgMin = parseScoreInput(avgScoreMin);
        const effectiveAvgMax = Math.max(effectiveAvgMin, parseScoreInput(avgScoreMax));
        const effectiveCategoryMin = parseScoreInput(categoryScoreMin);
        const effectiveCategoryMax = Math.max(effectiveCategoryMin, parseScoreInput(categoryScoreMax));

        const filtered = activities.filter(entry => {
            if (activeFavoritesOnly && !entry.is_favorite) {
                return false;
            }

            if (selectedTypeIds.length > 0 && !selectedTypeIds.some(typeId => entry.type_ids.includes(typeId))) {
                return false;
            }

            const averageScore = calcActivityAvgScore(entry.review_summaries);
            if (averageScore !== null && (averageScore < effectiveAvgMin || averageScore > effectiveAvgMax)) {
                return false;
            }

            if (averageScore === null && effectiveAvgMin > 0) {
                return false;
            }

            if (selectedCategories.length > 0) {
                const matchesCategoryFilters = entry.review_summaries.some(reviewSummary => {
                    return selectedCategories.every(category => {
                        const score = getReviewScore(reviewSummary, category);
                        return score !== null && score >= effectiveCategoryMin && score <= effectiveCategoryMax;
                    });
                });

                if (!matchesCategoryFilters) {
                    return false;
                }
            }

            if (!normalizedQuery) {
                return true;
            }

            const typeNames = entry.type_ids.map(typeId => typeNamesById.get(typeId) ?? "");
            const haystack = normalizeText([entry.name, entry.address ?? "", ...(entry.tags ?? []), ...typeNames].join(" "));

            return haystack.includes(normalizedQuery);
        });

        return sortActivities(filtered, sortKey, sortDir, coords.lat, coords.lng);
    }, [activities, avgScoreMax, avgScoreMin, categoryScoreMax, categoryScoreMin, coords.lat, coords.lng, favoritesOnly, fixedFavoritesOnly, query, selectedCategories, selectedTypeIds, sortDir, sortKey, typeNamesById]);

    function toggleTypeFilter(typeId: string): void {
        setSelectedTypeIds(current => (current.includes(typeId) ? current.filter(entry => entry !== typeId) : [...current, typeId]));
    }

    function toggleCategoryFilter(category: CategoryKey): void {
        setSelectedCategories(current => (current.includes(category) ? current.filter(entry => entry !== category) : [...current, category]));
    }

    function resetFilters(): void {
        setFavoritesOnly(false);
        setSelectedTypeIds([]);
        setAvgScoreMin("0");
        setAvgScoreMax("10");
        setSelectedCategories([]);
        setCategoryScoreMin("0");
        setCategoryScoreMax("10");
    }

    function toggleSort(key: SortKey): void {
        if (key === sortKey) {
            setSortDir(current => (current === "asc" ? "desc" : "asc"));
            return;
        }

        setSortKey(key);
        setSortDir("asc");
    }

    return (
        <section className="page-card activities-panel">
            <div className="activities-panel-head">
                <div className="panel-title-row">
                    <div className="content-stack">
                        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
                        <h1>{title}</h1>
                    </div>
                    <Button type="button" onClick={() => navigate("/activity/add")}>
                        + Aggiungi
                    </Button>
                </div>

                <div className="search-bar-row">
                    <div className="activities-search-input-wrap">
                        <IoSearchOutline className="activities-search-icon" />
                        <input
                            id="activities-search"
                            className="activities-search-input"
                            type="text"
                            inputMode="search"
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            enterKeyHint="search"
                            placeholder="Nome, indirizzo, tag"
                        />
                    </div>
                    <button
                        type="button"
                        className={`search-icon-btn${hasPermission ? " active" : ""}`}
                        onClick={() => void requestAndFetch()}
                        title={hasPermission ? "Aggiorna posizione" : "Abilita posizione"}
                        aria-label={hasPermission ? "Aggiorna posizione" : "Abilita posizione"}
                    >
                        <IoLocationOutline />
                    </button>
                </div>

                <div className="chips-section">
                    <span className="chips-caption">Filtri</span>
                    <div className="filter-chips-scroll">
                        {!fixedFavoritesOnly ? (
                            <button type="button" className={`activities-chip${favoritesOnly ? " active" : ""}`} onClick={() => setFavoritesOnly(current => !current)}>
                                {favoritesOnly ? <IoHeart /> : <IoHeartOutline />} Preferiti
                            </button>
                        ) : null}
                        <button type="button" className={`activities-chip${selectedTypeIds.length === 0 ? " active" : ""}`} onClick={() => setSelectedTypeIds([])}>
                            Tutte
                        </button>
                        {types.map(type => (
                            <button
                                key={type.id}
                                type="button"
                                className={`activities-chip${selectedTypeIds.includes(type.id) ? " active" : ""}`}
                                onClick={() => toggleTypeFilter(type.id)}
                            >
                                {type.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="activities-filters-grid">
                    <div className="activities-filter-card">
                        <div className="activities-filter-head">
                            <span className="chips-caption">Punteggio medio</span>
                            <span className="muted">Range 0-10</span>
                        </div>
                        <div className="activities-range-grid">
                            <label className="field activities-inline-field">
                                <span>Min</span>
                                <input type="number" min={0} max={10} step={0.5} value={avgScoreMin} onChange={event => setAvgScoreMin(event.target.value)} />
                            </label>
                            <label className="field activities-inline-field">
                                <span>Max</span>
                                <input type="number" min={0} max={10} step={0.5} value={avgScoreMax} onChange={event => setAvgScoreMax(event.target.value)} />
                            </label>
                        </div>
                    </div>

                    <div className="activities-filter-card">
                        <div className="activities-filter-head">
                            <span className="chips-caption">Categorie voto</span>
                            <span className="muted">Almeno una recensione deve rispettare il range</span>
                        </div>
                        <div className="activities-chip-row">
                            {CATEGORY_OPTIONS.map(category => (
                                <button
                                    key={category.key}
                                    type="button"
                                    className={`activities-chip${selectedCategories.includes(category.key) ? " active" : ""}`}
                                    onClick={() => toggleCategoryFilter(category.key)}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>
                        <div className="activities-range-grid">
                            <label className="field activities-inline-field">
                                <span>Min</span>
                                <input type="number" min={0} max={10} step={0.5} value={categoryScoreMin} onChange={event => setCategoryScoreMin(event.target.value)} />
                            </label>
                            <label className="field activities-inline-field">
                                <span>Max</span>
                                <input type="number" min={0} max={10} step={0.5} value={categoryScoreMax} onChange={event => setCategoryScoreMax(event.target.value)} />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="inline-actions activities-filters-actions">
                    <Button type="button" variant="secondary" onClick={resetFilters}>
                        Reset filtri
                    </Button>
                </div>

                <div className="chips-section">
                    <span className="chips-caption">Ordina</span>
                    <div className="filter-chips-scroll">
                        <button type="button" className={`activities-chip${sortKey === "alpha" ? " active" : ""}`} onClick={() => toggleSort("alpha")}>
                            A-Z{sortKey === "alpha" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                        </button>
                        <button type="button" className={`activities-chip${sortKey === "last_viewed" ? " active" : ""}`} onClick={() => toggleSort("last_viewed")}>
                            Visti{sortKey === "last_viewed" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                        </button>
                        <button type="button" className={`activities-chip${sortKey === "last_reviewed" ? " active" : ""}`} onClick={() => toggleSort("last_reviewed")}>
                            Recensiti{sortKey === "last_reviewed" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                        </button>
                        <button type="button" className={`activities-chip${sortKey === "distance" ? " active" : ""}`} onClick={() => toggleSort("distance")}>
                            Vicini{sortKey === "distance" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                        </button>
                    </div>
                </div>
            </div>

            {visible.length === 0 && !loading ? (
                <div className="empty-state">
                    <div className="content-stack">
                        <h3>Nessuna attivita' trovata</h3>
                        <p className="muted">Prova a cambiare filtro o ricerca.</p>
                    </div>
                </div>
            ) : null}

            {visible.length > 0 ? (
                <div className="list activities-panel-list">
                    {visible.map(entry => (
                        <div className="surface-item activities-item" key={entry.id} onClick={() => navigate(`/activity/${entry.id}`)}>
                            <div className="activities-item-main">
                                <div className="activities-item-header">
                                    <span className="activities-name-link">{entry.name}</span>
                                    <button
                                        type="button"
                                        className="activities-favorite-button"
                                        onClick={e => {
                                            e.stopPropagation();
                                            void toggleFavorite(entry.id);
                                        }}
                                        aria-label="Toggle preferito"
                                    >
                                        {entry.is_favorite ? <IoHeart /> : <IoHeartOutline />}
                                    </button>
                                </div>
                                {entry.address ? <span className="muted">{entry.address}</span> : null}

                                <div className="activities-meta-row">
                                    {entry.type_ids.map(typeId => (
                                        <span className="tag-pill" key={typeId}>
                                            {typeNamesById.get(typeId) ?? "Tipo"}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {hasMore ? (
                <div className="inline-actions">
                    <Button type="button" variant="secondary" onClick={() => void fetch(false)} disabled={loading}>
                        {loading ? "Caricamento..." : "Mostra altri"}
                    </Button>
                </div>
            ) : null}
        </section>
    );
}
