import { useEffect, useMemo, useState } from "react";
import { IoHeart, IoHeartOutline, IoLocationOutline, IoSearchOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { useActivitiesStore, type ActivityWithDetails } from "@/stores/activitiesStore";
import { useLocationStore } from "@/stores/locationStore";
import { useTypesStore } from "@/stores/typesStore";

type SortKey = "alpha" | "last_viewed" | "distance";
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
};

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

function sortActivities(entries: ActivityWithDetails[], sortKey: SortKey, sortDir: SortDir, lat: number, lng: number): ActivityWithDetails[] {
    const sign = sortDir === "asc" ? 1 : -1;

    return [...entries].sort((first, second) => {
        if (sortKey === "distance") {
            const firstDistance = distanceKm(lat, lng, first.lat, first.lng);
            const secondDistance = distanceKm(lat, lng, second.lat, second.lng);
            return sign * (firstDistance - secondDistance);
        }

        if (sortKey === "last_viewed") {
            const firstViewed = first.last_viewed_at ?? "";
            const secondViewed = second.last_viewed_at ?? "";
            return sign * firstViewed.localeCompare(secondViewed);
        }

        return sign * first.name.localeCompare(second.name, "it");
    });
}

export function ActivitiesListPanel({ title, fixedFavoritesOnly = false, eyebrow, initialSortKey = "alpha", initialSortDir = "asc", autoRequestLocation = false }: Props) {
    const navigate = useNavigate();
    const { activities, loading, hasMore, fetch, toggleFavorite } = useActivitiesStore();
    const { types, fetch: fetchTypes } = useTypesStore();
    const { coords, hasPermission, requestAndFetch } = useLocationStore();

    const [query, setQuery] = useState("");
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>(initialSortKey);
    const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);

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

        const filtered = activities.filter(entry => {
            if (activeFavoritesOnly && !entry.is_favorite) {
                return false;
            }

            if (selectedTypeId && !entry.type_ids.includes(selectedTypeId)) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            const typeNames = entry.type_ids.map(typeId => typeNamesById.get(typeId) ?? "");
            const haystack = normalizeText([entry.name, entry.address ?? "", ...(entry.tags ?? []), ...typeNames].join(" "));

            return haystack.includes(normalizedQuery);
        });

        return sortActivities(filtered, sortKey, sortDir, coords.lat, coords.lng);
    }, [activities, coords.lat, coords.lng, favoritesOnly, fixedFavoritesOnly, query, selectedTypeId, sortDir, sortKey, typeNamesById]);

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
                        <button type="button" className={`activities-chip${selectedTypeId === null ? " active" : ""}`} onClick={() => setSelectedTypeId(null)}>
                            Tutte
                        </button>
                        {types.map(type => (
                            <button
                                key={type.id}
                                type="button"
                                className={`activities-chip${selectedTypeId === type.id ? " active" : ""}`}
                                onClick={() => setSelectedTypeId(current => (current === type.id ? null : type.id))}
                            >
                                {type.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="chips-section">
                    <span className="chips-caption">Ordina</span>
                    <div className="filter-chips-scroll">
                        <button type="button" className={`activities-chip${sortKey === "alpha" ? " active" : ""}`} onClick={() => toggleSort("alpha")}>
                            A-Z{sortKey === "alpha" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                        </button>
                        <button type="button" className={`activities-chip${sortKey === "last_viewed" ? " active" : ""}`} onClick={() => toggleSort("last_viewed")}>
                            Recenti{sortKey === "last_viewed" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
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
                        <div className="surface-item activities-item" key={entry.id} onClick={() => navigate(`/activity/${entry.id}`)} style={{ cursor: "pointer" }}>
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
