import { useMemo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { ActivityListScreen } from '@/components/ActivityListScreen'
import { useActivitiesStore } from '@/stores/activitiesStore'

export default function ListScreen() {
  const insets = useSafeAreaInsets()
  const { q } = useLocalSearchParams<{ q?: string }>()
  const { activities } = useActivitiesStore()

  const query = (q ?? '').trim().toLowerCase()

  const filtered = useMemo(() => {
    if (query.length < 2) return activities
    return activities.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.address?.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query))
    )
  }, [activities, query])

  const title = query.length >= 2 ? `Risultati per "${q}"` : 'Tutte le attività'

  return (
    <ActivityListScreen
      title={title}
      activities={filtered}
      defaultSortKey="alpha"
      defaultSortDir="asc"
      showBack
      topInset
    />
  )
}
