import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useActivitiesStore } from '@/stores/activitiesStore'
import { theme } from '@/theme'

type Props = {
  activityId: string
  isFavorite: boolean
  size?: number
}

export function FavoriteButton({ activityId, isFavorite, size = 22 }: Props) {
  const { toggleFavorite } = useActivitiesStore()

  return (
    <TouchableOpacity
      onPress={() => toggleFavorite(activityId)}
      hitSlop={8}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={size}
        color={isFavorite ? theme.colors.favorite : theme.colors.textSecondary}
      />
    </TouchableOpacity>
  )
}
