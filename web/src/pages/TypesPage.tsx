import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoAdd, IoPencilOutline, IoReorderThreeOutline, IoTrashOutline } from 'react-icons/io5'
import { Button } from '@/components/Button'
import { getActivityTypeIcon } from '@/lib/activityTypeIcons'
import type { ActivityType } from '@/types'
import { useTypesStore } from '@/stores/typesStore'

export function TypesPage() {
  const navigate = useNavigate()
  const { types, loading, fetch, remove, reorderByIndex } = useTypesStore()

  useEffect(() => {
    void fetch()
  }, [fetch])

  const sortedTypes = useMemo(
    () => [...types].sort((a, b) => a.display_order - b.display_order),
    [types],
  )

  // Drag-to-reorder state
  const listRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ from: number; to: number } | null>(null)
  const itemMidsRef = useRef<number[]>([])
  const [dragging, setDragging] = useState<{ from: number; to: number } | null>(null)

  function startDrag(e: React.PointerEvent<HTMLButtonElement>, fromIndex: number): void {
    if (!listRef.current) return
    e.preventDefault()
    const items = Array.from(listRef.current.querySelectorAll<HTMLElement>('[data-drag-item]'))
    itemMidsRef.current = items.map((el) => {
      const r = el.getBoundingClientRect()
      return r.top + r.height / 2
    })
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { from: fromIndex, to: fromIndex }
    setDragging({ from: fromIndex, to: fromIndex })
  }

  function moveDrag(e: React.PointerEvent<HTMLButtonElement>): void {
    if (!dragRef.current) return
    const mids = itemMidsRef.current
    const y = e.clientY
    let newIdx = mids.length - 1
    for (let i = 0; i < mids.length; i++) {
      if (y < mids[i]) {
        newIdx = i
        break
      }
    }
    dragRef.current = { ...dragRef.current, to: newIdx }
    setDragging({ ...dragRef.current })
  }

  function endDrag(): void {
    if (!dragRef.current) return
    const { from, to } = dragRef.current
    dragRef.current = null
    setDragging(null)
    if (from !== to) {
      void reorderByIndex(from, to)
    }
  }

  async function handleDelete(type: ActivityType): Promise<void> {
    const confirmed = window.confirm(
      `Eliminando "${type.name}" verranno rimosse anche le associazioni con le attivita'. Continuare?`,
    )
    if (!confirmed) return
    const error = await remove(type.id)
    if (error) window.alert(error)
  }

  return (
    <section className="page-card types-page">
      <div className="types-hero-card">
        <div className="panel-title-row">
          <div className="content-stack">
            <p className="eyebrow">Catalogo</p>
            <h1>Tipologie attivita'</h1>
          </div>
          <Button onClick={() => navigate('/private/types/new')}>
            <span className="types-add-button">
              <IoAdd />
              Nuova tipologia
            </span>
          </Button>
        </div>
      </div>

      {loading && sortedTypes.length === 0 ? (
        <div className="empty-state">
          <div className="content-stack">
            <h3>Caricamento tipologie...</h3>
          </div>
        </div>
      ) : null}

      {!loading && sortedTypes.length === 0 ? (
        <div className="empty-state">
          <div className="content-stack">
            <h3>Nessuna tipologia</h3>
            <p className="muted">Crea la prima tipologia con il pulsante in alto.</p>
          </div>
        </div>
      ) : null}

      {sortedTypes.length > 0 ? (
        <div className={`list${dragging ? ' is-dragging' : ''}`} ref={listRef}>
          {sortedTypes.map((type, index) => {
            const Icon = getActivityTypeIcon(type.icon_key)
            const isDragging = dragging?.from === index
            const isTarget =
              dragging !== null && dragging.to === index && dragging.from !== index

            return (
              <div
                data-drag-item
                className={`surface-item types-item${isDragging ? ' types-item--dragging' : ''}${isTarget ? ' types-item--drop-target' : ''}`}
                key={type.id}
              >
                <button
                  type="button"
                  className="types-drag-handle"
                  onPointerDown={(e) => startDrag(e, index)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  aria-label="Trascina per riordinare"
                >
                  <IoReorderThreeOutline />
                </button>

                <span className="types-main-icon">
                  <Icon />
                </span>

                <div className="types-content">
                  <strong>{type.name}</strong>
                  {type.description ? <span className="muted">{type.description}</span> : null}
                </div>

                <div className="types-row-actions">
                  <button
                    type="button"
                    className="types-icon-button"
                    onClick={() => navigate(`/private/types/${type.id}/edit`)}
                    aria-label="Modifica tipologia"
                  >
                    <IoPencilOutline />
                  </button>
                  <button
                    type="button"
                    className="types-icon-button danger"
                    onClick={() => void handleDelete(type)}
                    aria-label="Elimina tipologia"
                  >
                    <IoTrashOutline />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

