import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { type Marker } from 'maplibre-gl'
import { IoHeart, IoHeartOutline, IoLocateOutline, IoSearchOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { useActivitiesStore, type ActivityWithDetails } from '@/stores/activitiesStore'
import { useLocationStore } from '@/stores/locationStore'
import { useTypesStore } from '@/stores/typesStore'

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

function sortByName(entries: ActivityWithDetails[]): ActivityWithDetails[] {
  return [...entries].sort((first, second) => first.name.localeCompare(second.name, 'it'))
}

export function MapPage() {
  const navigate = useNavigate()
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Marker[]>([])

  const { activities, fetch, loading, hasMore, toggleFavorite } = useActivitiesStore()
  const { types, fetch: fetchTypes } = useTypesStore()
  const { coords, hasPermission, requestAndFetch } = useLocationStore()

  const [query, setQuery] = useState('')
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)

  useEffect(() => {
    void fetch(true)
    void fetchTypes()
  }, [fetch, fetchTypes])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE_URL,
      center: [coords.lng, coords.lat],
      zoom: 12,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')
    mapRef.current = map

    const onResize = () => map.resize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [coords.lat, coords.lng])

  useEffect(() => {
    if (!mapRef.current) {
      return
    }

    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom: 13,
      duration: 900,
    })
  }, [coords.lat, coords.lng])

  const typeNamesById = useMemo(
    () => new Map(types.map((type) => [type.id, type.name])),
    [types]
  )

  const visibleActivities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = activities.filter((entry) => {
      if (favoritesOnly && !entry.is_favorite) {
        return false
      }
      if (selectedTypeId && !entry.type_ids.includes(selectedTypeId)) {
        return false
      }
      if (!normalizedQuery) {
        return true
      }

      const haystack = [entry.name, entry.address ?? '', ...(entry.tags ?? [])]
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })

    return sortByName(filtered)
  }, [activities, favoritesOnly, query, selectedTypeId])

  const effectiveSelectedActivityId = useMemo(() => {
    if (!selectedActivityId) {
      return null
    }

    return visibleActivities.some((entry) => entry.id === selectedActivityId)
      ? selectedActivityId
      : null
  }, [selectedActivityId, visibleActivities])

  const selectedActivity = useMemo(() => {
    if (!effectiveSelectedActivityId) {
      return null
    }
    return visibleActivities.find((entry) => entry.id === effectiveSelectedActivityId) ?? null
  }, [effectiveSelectedActivityId, visibleActivities])

  useEffect(() => {
    const map = mapRef.current
    if (!map) {
      return
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    visibleActivities.forEach((entry) => {
      if (entry.lat == null || entry.lng == null) {
        return
      }

      const markerEl = document.createElement('button')
      markerEl.type = 'button'
      markerEl.className = `map-marker${effectiveSelectedActivityId === entry.id ? ' active' : ''}`
      markerEl.title = entry.name
      markerEl.setAttribute('aria-label', `Apri ${entry.name}`)
      markerEl.onclick = () => {
        setSelectedActivityId(entry.id)
        map.flyTo({ center: [entry.lng!, entry.lat!], zoom: 15, duration: 700 })
      }

      const marker = new maplibregl.Marker({ element: markerEl, anchor: 'bottom' })
        .setLngLat([entry.lng, entry.lat])
        .addTo(map)

      markersRef.current.push(marker)
    })
  }, [effectiveSelectedActivityId, visibleActivities])

  function handleCenterOnUser(): void {
    void requestAndFetch()
  }

  function handleSelectFromList(entry: ActivityWithDetails): void {
    setSelectedActivityId(entry.id)
    if (entry.lat != null && entry.lng != null) {
      mapRef.current?.flyTo({ center: [entry.lng, entry.lat], zoom: 15, duration: 700 })
    }
  }

  return (
    <section className="page-card">
      <div className="stack">
        <p className="eyebrow">Fase 7</p>
        <h1>Mappa attivita'</h1>
      </div>

      <div className="inline-actions">
        <Button type="button" onClick={() => navigate('/activity/add')}>
          Aggiungi attivita'
        </Button>
        <Button type="button" variant="secondary" onClick={handleCenterOnUser}>
          <span className="types-add-button">
            <IoLocateOutline />
            {hasPermission ? 'Aggiorna posizione' : 'Abilita posizione'}
          </span>
        </Button>
      </div>

      <div className="activities-filters">
        <div className="field activities-search-field">
          <label htmlFor="map-search">Ricerca</label>
          <div className="activities-search-input-wrap">
            <IoSearchOutline className="activities-search-icon" />
            <input
              id="map-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, indirizzo, tag"
            />
          </div>
        </div>

        <div className="activities-chip-row">
          <button
            type="button"
            className={`activities-chip${selectedTypeId === null ? ' active' : ''}`}
            onClick={() => setSelectedTypeId(null)}
          >
            Tutte
          </button>
          {types.map((type) => (
            <button
              key={type.id}
              type="button"
              className={`activities-chip${selectedTypeId === type.id ? ' active' : ''}`}
              onClick={() => setSelectedTypeId((current) => (current === type.id ? null : type.id))}
            >
              {type.name}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant={favoritesOnly ? 'primary' : 'secondary'}
          onClick={() => setFavoritesOnly((current) => !current)}
        >
          {favoritesOnly ? 'Solo preferiti: ON' : 'Solo preferiti: OFF'}
        </Button>
      </div>

      <div className="map-canvas" ref={mapContainerRef} />

      {selectedActivity ? (
        <div className="map-selection-card">
          <div className="activities-item-header">
            <h3>{selectedActivity.name}</h3>
            <button
              type="button"
              className="activities-favorite-button"
              onClick={() => void toggleFavorite(selectedActivity.id)}
              aria-label="Toggle preferito"
            >
              {selectedActivity.is_favorite ? <IoHeart /> : <IoHeartOutline />}
            </button>
          </div>
          {selectedActivity.address ? <p className="muted">{selectedActivity.address}</p> : null}
          <div className="activities-meta-row">
            {selectedActivity.type_ids.map((typeId) => (
              <span className="pill" key={typeId}>
                {typeNamesById.get(typeId) ?? 'Tipo'}
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

      <div className="stack">
        <h3>Lista sincronizzata</h3>
        {visibleActivities.length === 0 && !loading ? (
          <p className="muted">Nessuna attivita' visibile con i filtri correnti.</p>
        ) : null}
        {visibleActivities.length > 0 ? (
          <div className="list">
            {visibleActivities.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`list-item activities-item map-list-item${effectiveSelectedActivityId === entry.id ? ' active' : ''}`}
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

      <div className="inline-actions">
        <Button type="button" variant="secondary" onClick={() => void fetch(true)} disabled={loading}>
          {loading ? 'Aggiornamento...' : 'Ricarica'}
        </Button>
        {hasMore ? (
          <Button type="button" onClick={() => void fetch(false)} disabled={loading}>
            {loading ? 'Caricamento...' : 'Carica altri'}
          </Button>
        ) : (
          <span className="muted">Fine lista</span>
        )}
      </div>
    </section>
  )
}