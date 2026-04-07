import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import imageCompression from 'browser-image-compression'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { useActivitiesStore } from '@/stores/activitiesStore'
import { useTypesStore } from '@/stores/typesStore'

export function ActivityDetailPage() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const { activities, remove, toggleFavorite, addPhoto, removePhoto } = useActivitiesStore()
  const types = useTypesStore((state) => state.types)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photosError, setPhotosError] = useState<string | null>(null)

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

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const current = activity
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!current || !file) {
      return
    }

    setPhotosError(null)
    setUploadingPhoto(true)
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1200,
        maxSizeMB: 1,
        useWebWorker: true,
      })
      const uploaded = await api.uploadPhoto(current.id, compressed)
      addPhoto(current.id, uploaded)
    } catch {
      setPhotosError('Errore upload foto. Riprova.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handlePhotoDelete(photoId: string): Promise<void> {
    const current = activity
    if (!current) {
      return
    }

    const confirmed = window.confirm('Eliminare questa foto?')
    if (!confirmed) {
      return
    }

    setPhotosError(null)
    try {
      await api.delete(`/photos/${photoId}`)
      removePhoto(current.id, photoId)
    } catch {
      setPhotosError('Errore eliminazione foto. Riprova.')
    }
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

      <div className="stack">
        <h3>Foto</h3>
        <div className="inline-actions">
          <label className="activity-upload-label">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => void handlePhotoUpload(event)}
              disabled={uploadingPhoto}
            />
            {uploadingPhoto ? 'Upload in corso...' : 'Carica foto'}
          </label>
        </div>
        {photosError ? <div className="status-banner error">{photosError}</div> : null}

        {activity.photos.length === 0 ? (
          <p className="muted">Nessuna foto caricata</p>
        ) : (
          <div className="activity-photo-grid">
            {activity.photos.map((photo) => (
              <div className="activity-photo-card" key={photo.id}>
                <img src={photo.storage_path} alt="Foto attivita'" />
                <button
                  type="button"
                  className="activity-photo-delete"
                  onClick={() => void handlePhotoDelete(photo.id)}
                >
                  Elimina
                </button>
              </div>
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