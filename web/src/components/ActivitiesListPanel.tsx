import { useEffect, useMemo, useState } from 'react'
import { IoHeart, IoHeartOutline, IoLocationOutline, IoSearchOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { useActivitiesStore, type ActivityWithDetails } from '@/stores/activitiesStore'
import { useLocationStore } from '@/stores/locationStore'
import { useTypesStore } from '@/stores/typesStore'

type SortKey = 'alpha' | 'last_viewed' | 'distance'
type SortDir = 'asc' | 'desc'

type Props = {
  title: string
  fixedFavoritesOnly?: boolean
}

function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number | null,
  lng2: number | null
): number {
  if (lat2 == null || lng2 == null) {
    return Number.POSITIVE_INFINITY
  }

  const radius = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function sortActivities(
  entries: ActivityWithDetails[],
  sortKey: SortKey,
  sortDir: SortDir,
  lat: number,
  lng: number
): ActivityWithDetails[] {
  const sign = sortDir === 'asc' ? 1 : -1

  return [...entries].sort((first, second) => {
    if (sortKey === 'distance') {
      const firstDistance = distanceKm(lat, lng, first.lat, first.lng)
      const secondDistance = distanceKm(lat, lng, second.lat, second.lng)
      return sign * (firstDistance - secondDistance)
    }

    if (sortKey === 'last_viewed') {
      const firstViewed = first.last_viewed_at ?? ''
      const secondViewed = second.last_viewed_at ?? ''
      return sign * firstViewed.localeCompare(secondViewed)
    }

    return sign * first.name.localeCompare(second.name, 'it')
  })
}

export function ActivitiesListPanel({ title, fixedFavoritesOnly = false }: Props) {
  const navigate = useNavigate()
  const {
    activities,
    loading,
    hasMore,
    fetch,
    toggleFavorite,
  } = useActivitiesStore()
  const { types, fetch: fetchTypes } = useTypesStore()
  const { coords, hasPermission, requestAndFetch } = useLocationStore()

  const [query, setQuery] = useState('')
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('alpha')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    void fetch(true)
    void fetchTypes()
  }, [fetch, fetchTypes])

  const typeNamesById = useMemo(() => {
    return new Map(types.map((type) => [type.id, type.name]))
  }, [types])

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const activeFavoritesOnly = fixedFavoritesOnly || favoritesOnly

    const filtered = activities.filter((entry) => {
      if (activeFavoritesOnly && !entry.is_favorite) {
        return false
      }

      if (selectedTypeId && !entry.type_ids.includes(selectedTypeId)) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const haystack = [
        entry.name,
        entry.address ?? '',
        ...(entry.tags ?? []),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })

    return sortActivities(filtered, sortKey, sortDir, coords.lat, coords.lng)
  }, [activities, coords.lat, coords.lng, favoritesOnly, fixedFavoritesOnly, query, selectedTypeId, sortDir, sortKey])

  function toggleSort(key: SortKey): void {
    if (key === sortKey) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortDir('asc')
  }

  return (
    <section className="page-card">
      <div className="stack">
        <p className="eyebrow">Fase 4</p>
        <h1>{title}</h1>
      </div>

      <div className="activities-filters">
        <div className="inline-actions">
          <Button type="button" onClick={() => navigate('/activity/add')}>
            Aggiungi attivita'
          </Button>
        </div>

        <div className="field activities-search-field">
          <label htmlFor="activities-search">Ricerca</label>
          <div className="activities-search-input-wrap">
            <IoSearchOutline className="activities-search-icon" />
            <input
              id="activities-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, indirizzo, tag"
            />
          </div>
        </div>

        <div className="stack">
          <h3>Tipologia</h3>
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
        </div>

        <div className="activities-sort-row">
          <button
            type="button"
            className={`activities-chip${sortKey === 'alpha' ? ' active' : ''}`}
            onClick={() => toggleSort('alpha')}
          >
            A-Z {sortKey === 'alpha' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            type="button"
            className={`activities-chip${sortKey === 'last_viewed' ? ' active' : ''}`}
            onClick={() => toggleSort('last_viewed')}
          >
            Ultimi visti {sortKey === 'last_viewed' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            type="button"
            className={`activities-chip${sortKey === 'distance' ? ' active' : ''}`}
            onClick={() => toggleSort('distance')}
          >
            Distanza {sortKey === 'distance' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
        </div>

        <div className="inline-actions">
          {!fixedFavoritesOnly ? (
            <Button
              type="button"
              variant={favoritesOnly ? 'primary' : 'secondary'}
              onClick={() => setFavoritesOnly((current) => !current)}
            >
              {favoritesOnly ? 'Solo preferiti: ON' : 'Solo preferiti: OFF'}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => void requestAndFetch()}
          >
            <span className="types-add-button">
              <IoLocationOutline />
              {hasPermission ? 'Aggiorna posizione' : 'Abilita posizione'}
            </span>
          </Button>
        </div>
      </div>

      {visible.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="stack">
            <h3>Nessuna attivita' trovata</h3>
            <p className="muted">Prova a cambiare filtro o ricerca.</p>
          </div>
        </div>
      ) : null}

      {visible.length > 0 ? (
        <div className="list">
          {visible.map((entry) => (
            <div className="list-item activities-item" key={entry.id}>
              <div className="activities-item-main">
                <div className="activities-item-header">
                  <button
                    type="button"
                    className="activities-name-link"
                    onClick={() => navigate(`/activity/${entry.id}`)}
                  >
                    {entry.name}
                  </button>
                  <button
                    type="button"
                    className="activities-favorite-button"
                    onClick={() => void toggleFavorite(entry.id)}
                    aria-label="Toggle preferito"
                  >
                    {entry.is_favorite ? <IoHeart /> : <IoHeartOutline />}
                  </button>
                </div>
                {entry.address ? <span className="muted">{entry.address}</span> : null}

                <div className="activities-meta-row">
                  {entry.type_ids.map((typeId) => (
                    <span className="pill" key={typeId}>
                      {typeNamesById.get(typeId) ?? 'Tipo'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

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