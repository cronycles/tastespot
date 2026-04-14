import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { getActivityTypeIcon } from '@/lib/activityTypeIcons'
import { AVAILABLE_ICONS, DEFAULT_ICON_KEY } from '@/types'
import { useTypesStore } from '@/stores/typesStore'

const EMPTY_FORM = {
  name: '',
  description: '',
  iconKey: DEFAULT_ICON_KEY,
}

export function TypeFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { types, fetch, create, update } = useTypesStore()

  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isEditing = Boolean(id)

  useEffect(() => {
    if (types.length === 0) void fetch()
  }, [fetch, types.length])

  useEffect(() => {
    if (!id) return
    const type = types.find((t) => t.id === id)
    if (type) {
      setForm({ name: type.name, description: type.description ?? '', iconKey: type.icon_key })
    }
  }, [id, types])

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setFormError(null)

    if (!form.name.trim()) {
      setFormError("Il nome e' obbligatorio.")
      return
    }

    setSaving(true)
    const error =
      isEditing && id
        ? await update(id, form.name.trim(), form.description || null, form.iconKey)
        : await create(form.name.trim(), form.description || null, form.iconKey)
    setSaving(false)

    if (error) {
      setFormError(error)
      return
    }

    navigate('/private/types')
  }

  return (
    <section className="page-card types-editor">
      <div className="types-editor-header">
        <div className="content-stack">
          <h2>{isEditing ? 'Modifica tipologia' : 'Nuova tipologia'}</h2>
        </div>
      </div>

      <form className="types-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="field">
          <label htmlFor="type-name">Nome *</label>
          <input
            id="type-name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="es. Ristorante, Bar, Gelateria"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="type-description">Descrizione</label>
          <textarea
            id="type-description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Descrizione opzionale"
            rows={3}
          />
        </div>

        <div className="content-stack">
          <h3>Icona</h3>
          <div className="types-icon-grid">
            {AVAILABLE_ICONS.map((iconKey) => {
              const Icon = getActivityTypeIcon(iconKey)
              const active = form.iconKey === iconKey

              return (
                <button
                  key={iconKey}
                  type="button"
                  className={`types-icon-cell${active ? ' active' : ''}`}
                  onClick={() => setForm((current) => ({ ...current, iconKey }))}
                  aria-label={`Seleziona icona ${iconKey}`}
                >
                  <Icon />
                </button>
              )
            })}
          </div>
        </div>

        {formError ? <div className="status-banner error">{formError}</div> : null}

        <div className="inline-actions">
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvataggio...' : isEditing ? 'Salva modifiche' : 'Crea tipologia'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/private/types')}>
            Annulla
          </Button>
        </div>
      </form>
    </section>
  )
}
