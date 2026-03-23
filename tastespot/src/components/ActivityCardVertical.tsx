import { Linking, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { FavoriteButton } from '@/components/FavoriteButton'
import { useActivitiesStore, ActivityWithDetails } from '@/stores/activitiesStore'
import { useReviewsStore, calcActivityAvgScore, scoreToSmileIndex, ReviewWithType } from '@/stores/reviewsStore'
import { theme } from '@/theme'

const SMILES = ['😞', '😕', '😐', '🙂', '😛'] as const
// Stable empty array so the useReviewsStore selector never returns a new reference
const EMPTY_REVIEWS: ReviewWithType[] = []

type Props = {
  activity: ActivityWithDetails
}

function getPhotoUrl(storagePath: string): string {
  // storage_path from Laravel API is the full public URL
  return storagePath
}

export function ActivityCardVertical({ activity }: Props) {
  const router = useRouter()
  const { width: SCREEN_WIDTH } = useWindowDimensions()
  const CARD_HEIGHT = 100
  const PHOTO_WIDTH = SCREEN_WIDTH * 0.35

  const reviews = useReviewsStore((s) => s.reviewsByActivity[activity.id] ?? EMPTY_REVIEWS)
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
      {/* Top row: info left + photo right */}
      <View style={[styles.topRow, { height: CARD_HEIGHT }]}>
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
          {activity.address ? (
            <Text style={styles.address} numberOfLines={1}>{activity.address}</Text>
          ) : null}
        </View>

        <View style={[styles.photoWrap, { width: PHOTO_WIDTH, height: CARD_HEIGHT }]}>
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
        </View>
      </View>

      {/* Bottom row: favorite + directions */}
      <View style={styles.bottomRow}>
        <FavoriteButton activityId={activity.id} isFavorite={activity.is_favorite} />
        {(activity.address || (activity.lat && activity.lng)) && (
          <TouchableOpacity onPress={handleOpenMaps} hitSlop={8} style={styles.dirBtn}>
            <Ionicons name="navigate-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
  },
  infoCol: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  name: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreSmile: {
    fontSize: 16,
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
  address: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  photoWrap: {
    overflow: 'hidden',
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
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  dirBtn: {
    padding: 4,
  },
})
