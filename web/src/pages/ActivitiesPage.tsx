import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ActivitiesListPanel } from '@/components/ActivitiesListPanel'

export function ActivitiesPage() {
  const [searchParams] = useSearchParams()

  const initialQuery = useMemo(() => searchParams.get('query')?.trim() ?? '', [searchParams])

  return (
    <ActivitiesListPanel
      title={initialQuery ? 'Risultati ricerca' : 'Attivita'}
      eyebrow={initialQuery ? 'Dalla mappa' : 'Lista completa'}
      initialQuery={initialQuery}
    />
  )
}