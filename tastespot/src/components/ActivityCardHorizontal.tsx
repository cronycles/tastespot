import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { FavoriteButton } from '@/components/FavoriteButton'
import { ActivityWithDetails } from '@/stores/activitiesStore'
import { useReviewsStore, calcActivityAvgScore, scoreToSmileIndex } from '@/stores/reviewsStore'
import { theme } from '@/theme'

const SMILES = ['😞', '😕', '😐', '🙂', '😛'] as const

const CARD_WIDTH = 180
const CARD_HEIGHT = 220
const PHOTO_HEIGHT = CARD_HEIGHT / 2

type Props = {
  activity: ActivityWithDetails
}

function getPhotoUrl(storagePath: string): string {
  // storage_path from Laravel API is the full public URL
  return storagePath
}

export function ActivityCardHorizontal({ activity }: Props) {
  const router = useRouter()

  const reviews = useReviewsStore((s) => s.reviewsByActivity[activity.id] ?? [])
  const avg = calcActivityAvgScore(reviews)
  const smileIdx = avg !== null ? scoreToSmileIndex(avg) : null

  const firstPhoto = activity.photos[0]

  const handleOpenMaps = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    const query = activity.address ?? `${activity.lat},${activity.lng}`
    const url =
      Platform.OS === 'ios'
        ? `maps://?q=${encodeURIComponent(query)}`
        : `geo:0,0?q=${encodeURIComponent(query)}`
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`)
    )
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/activity/[id]', params: { id: activity.id } })}
      activeOpacity={0.85}
    >
      {/* Photo */}
      <View style={styles.photoWrap}>
        {firstPhoto ? (
          <Image
            source={getPhotoUrl(firstPhoto.storage_path)}
            style={styles.photo}
            contentFit="cover"
            cachePolicy="disk"
          />
        ) : (
          <View style={styles.photoPlaceholder} />
        )}
        <View style={styles.favOverlay}>
          <FavoriteButton activityId={activity.id} isFavorite={activity.is_favorite} size={20} />
          {(activity.address || (activity.lat && activity.lng)) && (
            <TouchableOpacity onPress={handleOpenMaps} hitSlop={8} style={styles.dirOverlayBtn}>
              <Ionicons name="navigate-outline" size={18} color={theme.colors.surface} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoCol}>
        <Text style={styles.name} numberOfLines={2}>{activity.name}</Text>
        {smileIdx !== null && avg !== null ? (
          <View style={styles.scoreRow}>
            <Text style={styles.scoreSmile}>{SMILES[smileIdx]}</Text>
            <Text style={styles.scoreNum}>{avg.toFixed(1)}</Text>
          </View>
        ) : (
          <Text style={styles.noScore}>Non valutato</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginRight: theme.spacing.sm,
  },
  photoWrap: {
    width: CARD_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.border,
  },
  favOverlay: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: theme.borderRadius.full,
    padding: 6,
    gap: 8,
    alignItems: 'center',
  },
  dirOverlayBtn: {
    padding: 2,
  },
  infoCol: {
    flex: 1,
    padding: theme.spacing.sm + 2,
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  name: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreSmile: {
    fontSize: 15,
  },
  scoreNum: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  noScore: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
})
