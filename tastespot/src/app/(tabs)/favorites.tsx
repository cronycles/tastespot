import { useMemo } from 'react'
import { useActivitiesStore } from '@/stores/activitiesStore'
import { ActivityListScreen } from '@/components/ActivityListScreen'

export default function FavoritesScreen() {
  const activities = useActivitiesStore((s) => s.activities)
  const favorites = useMemo(() => activities.filter((a) => a.is_favorite), [activities])

  return (
    <ActivityListScreen
      title="Preferiti"
      activities={favorites}
      defaultSortKey="alpha"
      defaultSortDir="asc"
      topInset
    />
  )
}
