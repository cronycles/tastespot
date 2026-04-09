import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import maplibregl, { type MapGeoJSONFeature, type Marker } from "maplibre-gl";
import { IoHeart, IoHeartOutline, IoLocateOutline, IoSearchOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { useActivitiesStore, type ActivityWithDetails } from "@/stores/activitiesStore";
import { useLocationStore } from "@/stores/locationStore";
import { useTypesStore } from "@/stores/typesStore";

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

function normalizeText(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function sortByName(entries: ActivityWithDetails[]): ActivityWithDetails[] {
    return [...entries].sort((first, second) => first.name.localeCompare(second.name, "it"));
}

type PlaceSuggestion = {
    id: string;
    label: string;
    details: string;
    lat: number;
    lng: number;
};

type SearchSuggestion = { kind: "activity"; id: string; label: string; activity: ActivityWithDetails } | { kind: "place"; id: string; label: string; place: PlaceSuggestion };

function compactPlaceLabel(value: string): string {
    const parts = value
        .split(",")
        .map(part => part.trim())
        .filter(Boolean);

    if (parts.length === 0) {
        return value;
    }

    if (parts.length === 1) {
        return parts[0];
    }

    return `${parts[0]}, ${parts[1]}`;
}

function firstNonEmptyString(...values: Array<unknown>): string | null {
    for (const value of values) {
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
                return trimmed;
            }
        }
    }

    return null;
}

function placeFromMapFeature(feature: MapGeoJSONFeature, lat: number, lng: number): PlaceSuggestion | null {
    const props = (feature.properties ?? {}) as Record<string, unknown>;

    const label = firstNonEmptyString(
        props.name,
        props.brand,
        props["addr:housename"],
        props.amenity,
        props.shop,
        props.tourism,
        props.leisure,
        props.building,
    );

    if (!label) {
        return null;
    }

    const street = firstNonEmptyString(props["addr:street"]);
    const number = firstNonEmptyString(props["addr:housenumber"]);
    const city = firstNonEmptyString(props["addr:city"], props["addr:town"], props["addr:village"]);
    const postcode = firstNonEmptyString(props["addr:postcode"]);
    const country = firstNonEmptyString(props["addr:country"]);

    const streetLine = [street, number].filter(Boolean).join(" ");
    const details = [streetLine, city, postcode, country].filter(Boolean).join(", ");

    return {
        id: `poi:${String(feature.id ?? `${lat}:${lng}`)}`,
        label,
        details: details || label,
        lat,
        lng,
    };
}

export function MapPage() {
    const navigate = useNavigate();
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<Marker[]>([]);
    const placeMarkerRef = useRef<Marker | null>(null);
    const userMarkerRef = useRef<Marker | null>(null);

    const { activities, fetch, loading, hasMore, toggleFavorite } = useActivitiesStore();
    const { types, fetch: fetchTypes } = useTypesStore();
    const { coords, hasPermission, requestAndFetch } = useLocationStore();

    const [query, setQuery] = useState("");
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
    const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
    const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const placeSuggestionsRequestRef = useRef(0);

    useEffect(() => {
        void fetch(true);
        void fetchTypes();
    }, [fetch, fetchTypes]);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) {
            return;
        }

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: MAP_STYLE_URL,
            center: [coords.lng, coords.lat],
            zoom: 12,
            attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

        const onMapClick = (event: maplibregl.MapMouseEvent) => {
            const nearbyFeatures = map.queryRenderedFeatures(
                [
                    [event.point.x - 8, event.point.y - 8],
                    [event.point.x + 8, event.point.y + 8],
                ],
                {},
            );

            const poi = nearbyFeatures
                .map(feature => placeFromMapFeature(feature, event.lngLat.lat, event.lngLat.lng))
                .find((entry): entry is PlaceSuggestion => entry !== null);

            if (poi) {
                centerOnExternalPlace(poi);
                return;
            }

            void reverseGeocodePlace(event.lngLat.lat, event.lngLat.lng).then(place => {
                if (place) {
                    centerOnExternalPlace(place);
                    return;
                }

                centerOnExternalPlace({
                    id: `point:${event.lngLat.lat}:${event.lngLat.lng}`,
                    label: "Punto selezionato",
                    details: `Lat ${event.lngLat.lat.toFixed(5)} · Lng ${event.lngLat.lng.toFixed(5)}`,
                    lat: event.lngLat.lat,
                    lng: event.lngLat.lng,
                });
            });
        };

        map.on("click", onMapClick);
        mapRef.current = map;

        const onResize = () => map.resize();
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];
            placeMarkerRef.current?.remove();
            placeMarkerRef.current = null;
            userMarkerRef.current?.remove();
            userMarkerRef.current = null;
            map.off("click", onMapClick);
            map.remove();
            mapRef.current = null;
        };
    }, [coords.lat, coords.lng]);

    useEffect(() => {
        if (!mapRef.current) {
            return;
        }

        mapRef.current.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 13,
            duration: 900,
        });
    }, [coords.lat, coords.lng]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        if (!hasPermission) {
            userMarkerRef.current?.remove();
            userMarkerRef.current = null;
            return;
        }

        if (!userMarkerRef.current) {
            const userElement = document.createElement("span");
            userElement.className = "map-marker user";
            userElement.setAttribute("aria-label", "La tua posizione");
            userMarkerRef.current = new maplibregl.Marker({ element: userElement, anchor: "center" }).setLngLat([coords.lng, coords.lat]).addTo(map);
            return;
        }

        userMarkerRef.current.setLngLat([coords.lng, coords.lat]);
    }, [coords.lat, coords.lng, hasPermission]);

    const typeNamesById = useMemo(() => new Map(types.map(type => [type.id, type.name])), [types]);

    const visibleActivities = useMemo(() => {
        const normalizedQuery = normalizeText(query);
        const filtered = activities.filter(entry => {
            if (favoritesOnly && !entry.is_favorite) {
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

        return sortByName(filtered);
    }, [activities, favoritesOnly, query, selectedTypeId, typeNamesById]);

    const effectiveSelectedActivityId = useMemo(() => {
        if (!selectedActivityId) {
            return null;
        }

        return visibleActivities.some(entry => entry.id === selectedActivityId) ? selectedActivityId : null;
    }, [selectedActivityId, visibleActivities]);

    const selectedActivity = useMemo(() => {
        if (!effectiveSelectedActivityId) {
            return null;
        }
        return visibleActivities.find(entry => entry.id === effectiveSelectedActivityId) ?? null;
    }, [effectiveSelectedActivityId, visibleActivities]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        visibleActivities.forEach(entry => {
            if (entry.lat == null || entry.lng == null) {
                return;
            }

            const markerEl = document.createElement("button");
            markerEl.type = "button";
            markerEl.className = `map-marker${effectiveSelectedActivityId === entry.id ? " active" : ""}`;
            markerEl.title = entry.name;
            markerEl.setAttribute("aria-label", `Apri ${entry.name}`);
            markerEl.onclick = () => {
                setSelectedActivityId(entry.id);
                setSelectedPlace(null);
                map.flyTo({ center: [entry.lng!, entry.lat!], zoom: 16.5, duration: 700 });
            };

            const marker = new maplibregl.Marker({ element: markerEl, anchor: "bottom" }).setLngLat([entry.lng, entry.lat]).addTo(map);

            markersRef.current.push(marker);
        });
    }, [effectiveSelectedActivityId, visibleActivities]);

    function handleCenterOnUser(): void {
        void requestAndFetch();
    }

    function handleSelectFromList(entry: ActivityWithDetails): void {
        setSelectedActivityId(entry.id);
        setSelectedPlace(null);
        setSearchFeedback(null);
        if (entry.lat != null && entry.lng != null) {
            mapRef.current?.flyTo({ center: [entry.lng, entry.lat], zoom: 16.5, duration: 700 });
        }
    }

    function centerOnExternalPlace(place: PlaceSuggestion): void {
        if (!mapRef.current) {
            return;
        }

        setSelectedActivityId(null);
        placeMarkerRef.current?.remove();

        const placeElement = document.createElement("button");
        placeElement.type = "button";
        placeElement.className = "map-poi-pin";
        placeElement.title = place.label;
        placeElement.setAttribute("aria-label", place.label);
        placeElement.onclick = () => {
            setSelectedPlace(place);
            setSelectedActivityId(null);
        };

        placeMarkerRef.current = new maplibregl.Marker({ element: placeElement, anchor: "bottom" }).setLngLat([place.lng, place.lat]).addTo(mapRef.current);
        mapRef.current.flyTo({ center: [place.lng, place.lat], zoom: 17.5, duration: 700 });
        setSelectedPlace(place);
        setSearchFeedback(null);
    }

    async function geocodePlace(text: string): Promise<PlaceSuggestion | null> {
        const params = new URLSearchParams({
            q: text,
            format: "jsonv2",
            limit: "1",
            "accept-language": "it",
        });
        const response = await window.fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
        const first = data[0];
        if (!first) {
            return null;
        }

        const lat = Number(first.lat);
        const lng = Number(first.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null;
        }

        const displayName = first.display_name ?? text;
        return {
            id: `${lat}:${lng}`,
            label: compactPlaceLabel(displayName),
            details: displayName,
            lat,
            lng,
        };
    }

    async function reverseGeocodePlace(lat: number, lng: number): Promise<PlaceSuggestion | null> {
        const params = new URLSearchParams({
            format: "jsonv2",
            lat: String(lat),
            lon: String(lng),
            zoom: "18",
            "accept-language": "it",
        });

        const response = await window.fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as { display_name?: string; name?: string };
        const details = firstNonEmptyString(data.display_name);
        const label = firstNonEmptyString(data.name, details ? compactPlaceLabel(details) : null, "Punto selezionato");

        if (!label) {
            return null;
        }

        return {
            id: `reverse:${lat}:${lng}`,
            label,
            details: details ?? label,
            lat,
            lng,
        };
    }

    useEffect(() => {
        const trimmedQuery = query.trim();
        if (trimmedQuery.length < 2) {
            setPlaceSuggestions([]);
            setSuggestionsLoading(false);
            return;
        }

        const requestId = placeSuggestionsRequestRef.current + 1;
        placeSuggestionsRequestRef.current = requestId;
        const timeoutId = window.setTimeout(() => {
            setSuggestionsLoading(true);
            const params = new URLSearchParams({
                q: trimmedQuery,
                format: "jsonv2",
                limit: "5",
                "accept-language": "it",
            });

            void window
                .fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
                    headers: {
                        Accept: "application/json",
                    },
                })
                .then(async response => {
                    if (!response.ok || placeSuggestionsRequestRef.current !== requestId) {
                        return;
                    }

                    const data = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string; place_id?: number }>;
                    const mapped = data
                        .map(item => {
                            const lat = Number(item.lat);
                            const lng = Number(item.lon);
                            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                                return null;
                            }

                            return {
                                id: String(item.place_id ?? `${lat}:${lng}`),
                                label: compactPlaceLabel(item.display_name ?? trimmedQuery),
                                details: item.display_name ?? trimmedQuery,
                                lat,
                                lng,
                            } satisfies PlaceSuggestion;
                        })
                        .filter((item): item is PlaceSuggestion => item !== null);

                    setPlaceSuggestions(mapped);
                })
                .catch(() => {
                    if (placeSuggestionsRequestRef.current === requestId) {
                        setPlaceSuggestions([]);
                    }
                })
                .finally(() => {
                    if (placeSuggestionsRequestRef.current === requestId) {
                        setSuggestionsLoading(false);
                    }
                });
        }, 220);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [query]);

    const activitySuggestions = useMemo(() => {
        const normalizedQuery = normalizeText(query);
        if (!normalizedQuery) {
            return [] as SearchSuggestion[];
        }

        return sortByName(activities)
            .filter(entry => {
                const typeNames = entry.type_ids.map(typeId => typeNamesById.get(typeId) ?? "");
                const haystack = normalizeText([entry.name, entry.address ?? "", ...(entry.tags ?? []), ...typeNames].join(" "));
                return haystack.includes(normalizedQuery);
            })
            .slice(0, 5)
            .map(entry => ({
                kind: "activity" as const,
                id: entry.id,
                label: entry.name,
                activity: entry,
            }));
    }, [activities, query, typeNamesById]);

    const searchSuggestions = useMemo(() => {
        const placeItems = placeSuggestions.map(place => ({
            kind: "place" as const,
            id: `place:${place.id}`,
            label: place.label,
            place,
        }));

        return [...activitySuggestions, ...placeItems].slice(0, 8);
    }, [activitySuggestions, placeSuggestions]);

    function handleSelectSuggestion(suggestion: SearchSuggestion): void {
        setShowSuggestions(false);

        if (suggestion.kind === "activity") {
            setQuery(suggestion.label);
            setSearchFeedback("Trovata attivita' salvata sulla mappa.");
            handleSelectFromList(suggestion.activity);
            return;
        }

        setQuery(suggestion.label);
        setShowSuggestions(false);
        centerOnExternalPlace(suggestion.place);
    }

    async function handleSearchSubmit(): Promise<void> {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            setSearchFeedback(null);
            return;
        }

        if (searchSuggestions.length > 0) {
            handleSelectSuggestion(searchSuggestions[0]);
            return;
        }

        const firstVisible = visibleActivities.find(entry => entry.lat != null && entry.lng != null);
        if (firstVisible && mapRef.current) {
            setSelectedActivityId(firstVisible.id);
            setSearchFeedback("Trovata attivita' salvata sulla mappa.");
            mapRef.current.flyTo({ center: [firstVisible.lng!, firstVisible.lat!], zoom: 15, duration: 700 });
            return;
        }

        setSearchFeedback("Cerco luogo sulla mappa...");
        const place = await geocodePlace(trimmedQuery);
        if (!place || !mapRef.current) {
            setSearchFeedback("Nessun luogo trovato con questa ricerca.");
            return;
        }

        centerOnExternalPlace(place);
    }

    function handleSearchInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();
        void handleSearchSubmit();
    }

    return (
        <section className="page-card">
            <div className="panel-title-row">
                <h1>Mappa attivita'</h1>
                <Button type="button" onClick={() => navigate("/activity/add")}>
                    + Aggiungi
                </Button>
            </div>

            <div className="search-bar-row">
                <div className="activities-search-input-wrap">
                    <IoSearchOutline className="activities-search-icon" />
                    <input
                        id="map-search"
                        className="activities-search-input"
                        type="text"
                        inputMode="search"
                        value={query}
                        onChange={event => {
                            setQuery(event.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleSearchInputKeyDown}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        enterKeyHint="search"
                        placeholder="Attivita o luogo sulla mappa"
                    />
                    {showSuggestions && query.trim().length >= 2 ? (
                        <div className="search-suggestions-panel">
                            {suggestionsLoading ? <p className="muted search-suggestions-empty">Cerco suggerimenti...</p> : null}
                            {!suggestionsLoading && searchSuggestions.length === 0 ? <p className="muted search-suggestions-empty">Nessun suggerimento.</p> : null}
                            {!suggestionsLoading && searchSuggestions.length > 0
                                ? searchSuggestions.map(suggestion => (
                                      <button
                                          key={suggestion.id}
                                          type="button"
                                          className="search-suggestion-item"
                                          onMouseDown={event => event.preventDefault()}
                                          onClick={() => handleSelectSuggestion(suggestion)}
                                      >
                                          <span className="search-suggestion-title">{suggestion.label}</span>
                                      </button>
                                  ))
                                : null}
                        </div>
                    ) : null}
                </div>
                <button type="button" className="search-icon-btn" onClick={() => void handleSearchSubmit()} title="Cerca" aria-label="Cerca">
                    <IoSearchOutline />
                </button>
                <button
                    type="button"
                    className={`search-icon-btn${hasPermission ? " active" : ""}`}
                    onClick={handleCenterOnUser}
                    title={hasPermission ? "Aggiorna posizione" : "Abilita posizione"}
                    aria-label={hasPermission ? "Aggiorna posizione" : "Abilita posizione"}
                >
                    <IoLocateOutline />
                </button>
            </div>
            {searchFeedback ? <p className="muted search-feedback">{searchFeedback}</p> : null}

            <div className="filter-chips-scroll">
                <button type="button" className={`activities-chip${favoritesOnly ? " active" : ""}`} onClick={() => setFavoritesOnly(current => !current)}>
                    {favoritesOnly ? <IoHeart /> : <IoHeartOutline />} Preferiti
                </button>
                <div className="chip-separator" />
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

            <div className="map-canvas" ref={mapContainerRef} />

            {selectedActivity ? (
                <div className="map-selection-card">
                    <div className="activities-item-header">
                        <h3>{selectedActivity.name}</h3>
                        <button type="button" className="activities-favorite-button" onClick={() => void toggleFavorite(selectedActivity.id)} aria-label="Toggle preferito">
                            {selectedActivity.is_favorite ? <IoHeart /> : <IoHeartOutline />}
                        </button>
                    </div>
                    {selectedActivity.address ? <p className="muted">{selectedActivity.address}</p> : null}
                    <div className="activities-meta-row">
                        {selectedActivity.type_ids.map(typeId => (
                            <span className="tag-pill" key={typeId}>
                                {typeNamesById.get(typeId) ?? "Tipo"}
                            </span>
                        ))}
                    </div>
                    <div className="inline-actions">
                        <Button type="button" onClick={() => navigate(`/activity/${selectedActivity.id}`)}>
                            Apri dettaglio
                        </Button>
                    </div>
                </div>
            ) : null}

            {!selectedActivity && selectedPlace ? (
                <div className="map-selection-card map-poi-card">
                    <div className="activities-item-header">
                        <h3 className="map-poi-title">{selectedPlace.label}</h3>
                    </div>
                    <p className="muted map-poi-address">{selectedPlace.details}</p>
                    <p className="muted map-poi-coords">
                        Lat {selectedPlace.lat.toFixed(5)} · Lng {selectedPlace.lng.toFixed(5)}
                    </p>
                    <div className="inline-actions">
                        <Button
                            type="button"
                            onClick={() => navigate(`/activity/add?name=${encodeURIComponent(selectedPlace.label)}&lat=${selectedPlace.lat}&lng=${selectedPlace.lng}`)}
                        >
                            Aggiungi attivita qui
                        </Button>
                    </div>
                </div>
            ) : null}

            <div className="content-stack">
                <h3>Lista attivita'</h3>
                {visibleActivities.length === 0 && !loading ? <p className="muted">Nessuna attivita' visibile con i filtri correnti.</p> : null}
                {visibleActivities.length > 0 ? (
                    <div className="list">
                        {visibleActivities.map(entry => (
                            <button
                                key={entry.id}
                                type="button"
                                className={`list-item activities-item map-list-item${effectiveSelectedActivityId === entry.id ? " active" : ""}`}
                                onClick={() => handleSelectFromList(entry)}
                            >
                                <div className="activities-item-header">
                                    <span className="activities-name-link">{entry.name}</span>
                                    {entry.is_favorite ? <IoHeart /> : <IoHeartOutline />}
                                </div>
                                {entry.address ? <span className="muted">{entry.address}</span> : null}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>

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
