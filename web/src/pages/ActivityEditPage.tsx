import { Navigate, useParams } from 'react-router-dom'
import { ActivityFormPage } from '@/pages/ActivityFormPage'
import { useActivitiesStore } from '@/stores/activitiesStore'

export function ActivityEditPage() {
  const params = useParams<{ id: string }>()
  const activity = useActivitiesStore((state) =>
    state.activities.find((entry) => entry.id === params.id)
  )

  if (!params.id || !activity) {
    return <Navigate to="/" replace />
  }

  return <ActivityFormPage mode="edit" activity={activity} />
}