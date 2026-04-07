import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { useActivitiesStore } from '@/stores/activitiesStore'
import { useTypesStore } from '@/stores/typesStore'

export function ActivityDetailPage() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const { activities, remove, toggleFavorite } = useActivitiesStore()
  const types = useTypesStore((state) => state.types)

  const activity = useMemo(
    () => activities.find((entry) => entry.id === params.id),
    [activities, params.id]
  )

  const typeNamesById = useMemo(() => {
    return new Map(types.map((type) => [type.id, type.name]))
  }, [types])

  if (!params.id || !activity) {
    return <Navigate to="/" replace />
  }

  async function handleDelete(): Promise<void> {
    const current = activity
    if (!current) {
      return
    }

    const confirmed = window.confirm(`Eliminare "${current.name}"?`)
    if (!confirmed) {
      return
    }

    const error = await remove(current.id)
    if (error) {
      window.alert(error)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <section className="page-card">
      <div className="types-toolbar">
        <div className="stack">
          <p className="eyebrow">Fase 5</p>
          <h1>{activity.name}</h1>
          {activity.address ? <p className="muted">{activity.address}</p> : null}
        </div>
        <div className="inline-actions">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Indietro
          </Button>
          <Button type="button" onClick={() => navigate(`/activity/${activity.id}/edit`)}>
            Modifica
          </Button>
        </div>
      </div>

      <div className="stack">
        <h3>Dettagli</h3>
        {activity.phone ? <p>Telefono: {activity.phone}</p> : null}
        {activity.lat != null && activity.lng != null ? (
          <p>Coordinate: {activity.lat.toFixed(5)}, {activity.lng.toFixed(5)}</p>
        ) : null}
        {activity.notes ? <p className="muted">{activity.notes}</p> : null}
      </div>

      <div className="stack">
        <h3>Tipologie</h3>
        <div className="activities-meta-row">
          {activity.type_ids.map((typeId) => (
            <span className="pill" key={typeId}>
              {typeNamesById.get(typeId) ?? 'Tipo'}
            </span>
          ))}
        </div>
      </div>

      <div className="stack">
        <h3>Tag</h3>
        {activity.tags.length === 0 ? (
          <p className="muted">Nessun tag</p>
        ) : (
          <div className="activities-meta-row">
            {activity.tags.map((tag) => (
              <span className="pill" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="inline-actions">
        <Button type="button" variant={activity.is_favorite ? 'primary' : 'secondary'} onClick={() => void toggleFavorite(activity.id)}>
          {activity.is_favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
        </Button>
        <Button type="button" variant="danger" onClick={() => void handleDelete()}>
          Elimina attivita'
        </Button>
      </div>
    </section>
  )
}