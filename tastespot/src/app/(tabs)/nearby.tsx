import { useEffect } from 'react'
import { useActivitiesStore } from '@/stores/activitiesStore'
import { useLocationStore } from '@/stores/locationStore'
import { ActivityListScreen } from '@/components/ActivityListScreen'

export default function NearbyScreen() {
  const activities = useActivitiesStore((s) => s.activities)
  const { requestAndFetch } = useLocationStore()

  useEffect(() => {
    requestAndFetch()
  }, [requestAndFetch])

  return (
    <ActivityListScreen
      title="Vicino a me"
      activities={activities}
      defaultSortKey="distance"
      defaultSortDir="asc"
      topInset
    />
  )
}
