import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import maplibregl, { type MapGeoJSONFeature, type Marker } from "maplibre-gl";
import { IoAdd, IoHeart, IoHeartOutline, IoLocateOutline, IoSearchOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { useActivitiesStore, type ActivityWithDetails } from "@/stores/activitiesStore";
import { useLocationStore } from "@/stores/locationStore";
import { useTypesStore } from "@/stores/typesStore";

const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
let lastMapView: { center: [number, number]; zoom: number } | null = null;

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

type NominatimAddress = {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    cycleway?: string;
    footway?: string;
    path?: string;
    residential?: string;
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    county?: string;
    state_district?: string;
    state?: string;
    region?: string;
    province?: string;
    postcode?: string;
    country?: string;
};

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

function preferredLanguagesHeader(): string {
    const langs = Array.isArray(navigator.languages) ? navigator.languages.filter(Boolean) : [];
    if (langs.length > 0) {
        return langs.join(",");
    }

    return navigator.language || "en";
}

function buildAddressFromNominatim(address?: NominatimAddress): string | null {
    if (!address) {
        return null;
    }

    const street = firstNonEmptyString(address.road, address.pedestrian, address.cycleway, address.footway, address.path, address.residential);
    const number = firstNonEmptyString(address.house_number);
    const streetLine = [street, number].filter(Boolean).join(" ");

    const district = firstNonEmptyString(address.neighbourhood, address.suburb, address.city_district);
    const locality = firstNonEmptyString(address.city, address.town, address.village, address.hamlet, address.municipality);
    const region = firstNonEmptyString(address.county, address.state_district, address.state, address.region, address.province);
    const postcode = firstNonEmptyString(address.postcode);
    const country = firstNonEmptyString(address.country);

    const details = [streetLine, district, locality, region, postcode, country].filter(part => typeof part === "string" && part.length > 0).join(", ");

    return details || null;
}

function placeFromMapFeature(feature: MapGeoJSONFeature, lat: number, lng: number): PlaceSuggestion | null {
    const props = (feature.properties ?? {}) as Record<string, unknown>;

    const label = firstNonEmptyString(props.name, props.brand, props["addr:housename"], props.amenity, props.shop, props.tourism, props.leisure, props.building);

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
    const activityPopupRef = useRef<maplibregl.Popup | null>(null);

    const { activities, fetch } = useActivitiesStore();
    const { types, fetch: fetchTypes } = useTypesStore();
    const { coords, hasPermission, requestAndFetch } = useLocationStore();
    const initialCoordsRef = useRef(coords);

    const [query, setQuery] = useState("");
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
    const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const placeSuggestionsRequestRef = useRef(0);
    const visibleActivitiesRef = useRef<ActivityWithDetails[]>([]);
    const trimmedQuery = query.trim();
    const hasSuggestionQuery = trimmedQuery.length >= 2;

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
    }

    async function withResolvedAddress(place: PlaceSuggestion): Promise<PlaceSuggestion> {
        if (place.details && place.details !== place.label) {
            return place;
        }

        const reverse = await reverseGeocodePlace(place.lat, place.lng);
        if (!reverse || !reverse.details) {
            return place;
        }

        return {
            ...place,
            details: reverse.details,
        };
    }

    async function reverseGeocodePlace(lat: number, lng: number): Promise<PlaceSuggestion | null> {
        const params = new URLSearchParams({
            format: "jsonv2",
            lat: String(lat),
            lon: String(lng),
            zoom: "18",
            "accept-language": preferredLanguagesHeader(),
        });

        const response = await window.fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = (await response.json()) as { display_name?: string; name?: string; address?: NominatimAddress };
        const details = firstNonEmptyString(buildAddressFromNominatim(data.address), data.display_name);
        const label = firstNonEmptyString(
            data.name,
            data.address?.road,
            data.address?.neighbourhood,
            data.address?.suburb,
            details ? compactPlaceLabel(details) : null,
            "Punto selezionato",
        );

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
        void fetch(true);
        void fetchTypes();
    }, [fetch, fetchTypes]);

    // Auto-request geolocation only on first entry (no saved map view): when returning
    // from add/detail pages we preserve the exact previous view without recentering.
    useEffect(() => {
        if (lastMapView) {
            return;
        }

        void requestAndFetch().then(() => {
            const latest = useLocationStore.getState().coords;
            mapRef.current?.flyTo({
                center: [latest.lng, latest.lat],
                zoom: 13,
                duration: 900,
            });
        });
    }, [requestAndFetch]);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) {
            return;
        }

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: MAP_STYLE_URL,
            center: lastMapView?.center ?? [initialCoordsRef.current.lng, initialCoordsRef.current.lat],
            zoom: lastMapView?.zoom ?? 12,
            attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

        const onMapClick = (event: maplibregl.MapMouseEvent) => {
            const clickTarget = event.originalEvent.target;
            if (clickTarget instanceof Element && clickTarget.closest(".map-marker, .map-poi-pin")) {
                return;
            }

            const projectedClick = map.project(event.lngLat);
            const nearestActivity = visibleActivitiesRef.current
                .filter(entry => entry.lat != null && entry.lng != null)
                .map(entry => {
                    const projectedActivity = map.project([entry.lng!, entry.lat!]);
                    const deltaX = projectedActivity.x - projectedClick.x;
                    const deltaY = projectedActivity.y - projectedClick.y;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    return { entry, distance };
                })
                .sort((first, second) => first.distance - second.distance)[0];

            if (nearestActivity && nearestActivity.distance <= 16) {
                setSelectedActivityId(nearestActivity.entry.id);
                setSelectedPlace(null);
                placeMarkerRef.current?.remove();
                placeMarkerRef.current = null;
                return;
            }

            const nearbyFeatures = map.queryRenderedFeatures(
                [
                    [event.point.x - 8, event.point.y - 8],
                    [event.point.x + 8, event.point.y + 8],
                ],
                {},
            );

            const poi = nearbyFeatures.map(feature => placeFromMapFeature(feature, event.lngLat.lat, event.lngLat.lng)).find((entry): entry is PlaceSuggestion => entry !== null);

            if (poi) {
                if (poi.details && poi.details !== poi.label) {
                    centerOnExternalPlace(poi);
                    return;
                }

                void reverseGeocodePlace(poi.lat, poi.lng).then(reverse => {
                    centerOnExternalPlace({
                        ...poi,
                        details: reverse?.details ?? poi.details,
                    });
                });
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
            activityPopupRef.current?.remove();
            activityPopupRef.current = null;
            map.off("click", onMapClick);
            const center = map.getCenter();
            lastMapView = { center: [center.lng, center.lat], zoom: map.getZoom() };
            map.remove();
            mapRef.current = null;
        };
    }, []);

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

    useEffect(() => {
        visibleActivitiesRef.current = visibleActivities;
    }, [visibleActivities]);

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
        if (!map || !selectedActivity || selectedActivity.lat == null || selectedActivity.lng == null) {
            activityPopupRef.current?.remove();
            activityPopupRef.current = null;
            return;
        }

        activityPopupRef.current?.remove();

        const popupContent = document.createElement("div");
        popupContent.className = "map-activity-popup";
        popupContent.innerHTML = `
            <div style="padding: 12px; max-width: 280px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
                    <h4 style="margin: 0; font-size: 14px; font-weight: 600; flex: 1;">${selectedActivity.name}</h4>
                    <button class="map-popup-close" style="background: none; border: none; font-size: 18px; cursor: pointer; padding: 0; color: #666;" title="Chiudi">✕</button>
                </div>
                ${selectedActivity.address ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${selectedActivity.address}</p>` : ""}
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
                    ${selectedActivity.type_ids
                        .map(
                            typeId =>
                                `<span style="display: inline-block; background: #f0f0f0; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${typeNamesById.get(typeId) ?? "Tipo"}</span>`,
                        )
                        .join("")}
                </div>
                <button class="map-popup-detail" style="width: 100%; padding: 8px; background: #FF5A35; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;">Apri dettaglio</button>
            </div>
        `;

        const closeBtn = popupContent.querySelector(".map-popup-close");
        closeBtn?.addEventListener("click", () => {
            setSelectedActivityId(null);
            activityPopupRef.current?.remove();
            activityPopupRef.current = null;
        });

        const detailBtn = popupContent.querySelector(".map-popup-detail");
        detailBtn?.addEventListener("click", () => {
            navigate(`/activity/${selectedActivity.id}`);
        });

        const popup = new maplibregl.Popup({ offset: [0, -30], closeButton: false, closeOnClick: false });
        popup.setLngLat([selectedActivity.lng, selectedActivity.lat]).setDOMContent(popupContent).addTo(map);
        activityPopupRef.current = popup;
    }, [selectedActivity, typeNamesById, navigate]);

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
                placeMarkerRef.current?.remove();
                placeMarkerRef.current = null;
                map.flyTo({ center: [entry.lng!, entry.lat!], zoom: 16.5, duration: 700 });
            };

            const marker = new maplibregl.Marker({ element: markerEl, anchor: "bottom" }).setLngLat([entry.lng, entry.lat]).addTo(map);

            markersRef.current.push(marker);
        });
    }, [effectiveSelectedActivityId, visibleActivities]);

    async function handleCenterOnUser(): Promise<void> {
        await requestAndFetch();
        const latest = useLocationStore.getState().coords;
        mapRef.current?.flyTo({
            center: [latest.lng, latest.lat],
            zoom: 15,
            duration: 800,
        });
    }

    function handleSelectFromList(entry: ActivityWithDetails): void {
        setSelectedActivityId(entry.id);
        setSelectedPlace(null);
        placeMarkerRef.current?.remove();
        placeMarkerRef.current = null;
        if (entry.lat != null && entry.lng != null) {
            mapRef.current?.flyTo({ center: [entry.lng, entry.lat], zoom: 16.5, duration: 700 });
        }
    }

    async function geocodePlace(text: string): Promise<PlaceSuggestion | null> {
        const params = new URLSearchParams({
            q: text,
            format: "jsonv2",
            limit: "1",
            "accept-language": preferredLanguagesHeader(),
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

    useEffect(() => {
        if (!hasSuggestionQuery) {
            placeSuggestionsRequestRef.current += 1;
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
                "accept-language": preferredLanguagesHeader(),
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
    }, [hasSuggestionQuery, trimmedQuery]);

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
        const placeItems = (hasSuggestionQuery ? placeSuggestions : []).map(place => ({
            kind: "place" as const,
            id: `place:${place.id}`,
            label: place.label,
            place,
        }));

        return [...activitySuggestions, ...placeItems].slice(0, 8);
    }, [activitySuggestions, hasSuggestionQuery, placeSuggestions]);

    function handleSelectSuggestion(suggestion: SearchSuggestion): void {
        setShowSuggestions(false);

        if (suggestion.kind === "activity") {
            setQuery(suggestion.label);
            handleSelectFromList(suggestion.activity);
            return;
        }

        setQuery(suggestion.label);
        setShowSuggestions(false);
        void withResolvedAddress(suggestion.place).then(enrichedPlace => {
            centerOnExternalPlace(enrichedPlace);
        });
    }

    async function handleAddAtSelectedPlace(): Promise<void> {
        if (!selectedPlace) {
            return;
        }

        const enriched = await withResolvedAddress(selectedPlace);
        if (enriched.details !== selectedPlace.details) {
            setSelectedPlace(enriched);
        }

        navigate(
            `/activity/add?name=${encodeURIComponent(enriched.label)}&address=${encodeURIComponent(enriched.details !== enriched.label ? enriched.details : "")}&lat=${enriched.lat}&lng=${enriched.lng}`,
        );
    }

    async function handleSearchSubmit(): Promise<void> {
        if (!trimmedQuery) {
            return;
        }

        if (searchSuggestions.length > 0) {
            handleSelectSuggestion(searchSuggestions[0]);
            return;
        }

        const firstVisible = visibleActivities.find(entry => entry.lat != null && entry.lng != null);
        if (firstVisible && mapRef.current) {
            setSelectedActivityId(firstVisible.id);
            mapRef.current.flyTo({ center: [firstVisible.lng!, firstVisible.lat!], zoom: 15, duration: 700 });
            return;
        }

        const place = await geocodePlace(trimmedQuery);
        if (!place || !mapRef.current) {
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
        <div className="map-page">
            <div className="map-fullscreen" ref={mapContainerRef} />

            <div className="map-overlay-top">
                <div className="map-search-wrap">
                    <IoSearchOutline className="map-search-icon" />
                    <input
                        id="map-search"
                        className="map-search-input"
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
                        placeholder="Attività o luogo sulla mappa"
                    />
                    {showSuggestions && hasSuggestionQuery ? (
                        <div className="search-suggestions-panel">
                            {hasSuggestionQuery && suggestionsLoading ? <p className="muted search-suggestions-empty">Cerco suggerimenti...</p> : null}
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

                <div className="map-filter-row">
                    <button type="button" className={`map-chip${favoritesOnly ? " active" : ""}`} onClick={() => setFavoritesOnly(current => !current)}>
                        {favoritesOnly ? <IoHeart /> : <IoHeartOutline />} Preferiti
                    </button>
                    <div className="chip-separator" />
                    <button type="button" className={`map-chip${selectedTypeId === null ? " active" : ""}`} onClick={() => setSelectedTypeId(null)}>
                        Tutte
                    </button>
                    {types.map(type => (
                        <button
                            key={type.id}
                            type="button"
                            className={`map-chip${selectedTypeId === type.id ? " active" : ""}`}
                            onClick={() => setSelectedTypeId(current => (current === type.id ? null : type.id))}
                        >
                            {type.name}
                        </button>
                    ))}
                </div>
            </div>

            <button
                type="button"
                className={`map-fab map-fab--locate${hasPermission ? " active" : ""}`}
                onClick={() => void handleCenterOnUser()}
                title={hasPermission ? "Aggiorna posizione" : "Abilita posizione"}
                aria-label={hasPermission ? "Aggiorna posizione" : "Abilita posizione"}
            >
                <IoLocateOutline />
            </button>

            <button type="button" className="map-fab map-fab--add" onClick={() => navigate("/activity/add")} aria-label="Aggiungi attività">
                <IoAdd />
            </button>

            {selectedPlace ? (
                <div className="map-bottom-card">
                    <h3>{selectedPlace.label}</h3>
                    {selectedPlace.details && selectedPlace.details !== selectedPlace.label ? <p className="muted">{selectedPlace.details}</p> : null}
                    <Button type="button" onClick={() => void handleAddAtSelectedPlace()}>
                        Aggiungi attività qui
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
