import { useState } from 'react'
import { Button } from '@/components/Button'
import { getApiBaseUrl } from '@/lib/api'
import { useLocationStore } from '@/stores/locationStore'

export function MapPage() {
  const { coords, hasPermission, requestAndFetch } = useLocationStore()
  const [loading, setLoading] = useState(false)

  async function handleLocate(): Promise<void> {
    setLoading(true)
    await requestAndFetch()
    setLoading(false)
  }

  return (
    <>
      <section className="page-card">
        <div className="stack">
          <p className="eyebrow">Fase 1 completata</p>
          <h1>La shell web è attiva.</h1>
          <p className="muted">
            Il prossimo blocco di lavoro collega qui la mappa MapLibre GL JS, l'autocomplete Nominatim e i marker delle attività.
          </p>
        </div>

        <div className="metric-row">
          <div className="metric-card">
            <span className="muted">API attuale</span>
            <span className="metric-value">{getApiBaseUrl()}</span>
          </div>
          <div className="metric-card">
            <span className="muted">Permesso posizione</span>
            <span className="metric-value">{hasPermission ? 'Concesso' : 'Da richiedere'}</span>
          </div>
        </div>

        <div className="inline-actions">
          <Button onClick={handleLocate} disabled={loading}>
            {loading ? 'Recupero posizione...' : 'Usa la mia posizione'}
          </Button>
          <span className="pill">
            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
        </div>
      </section>

      <section className="empty-state">
        <div className="stack">
          <h3>Mappa in arrivo</h3>
          <p className="muted">
            Qui finiranno ricerca attività, suggerimenti indirizzo, conferma posizione e markers. Ho già adattato la parte auth e posizione browser per sbloccare la prossima fase.
          </p>
        </div>
      </section>
    </>
  )
}