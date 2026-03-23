import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ActivityCardVertical } from '@/components/ActivityCardVertical'
import { FilterPanel, FilterState, EMPTY_FILTER, countActiveFilters, CategoryKey } from '@/components/FilterPanel'
import { useActivitiesStore, ActivityWithDetails } from '@/stores/activitiesStore'
import { useLocationStore } from '@/stores/locationStore'
import { useReviewsStore, calcActivityAvgScore, ReviewWithType } from '@/stores/reviewsStore'
import { theme } from '@/theme'

// ─── Filter ───────────────────────────────────────────────────────────────────

const CATEGORY_SCORE_KEY: Record<CategoryKey, keyof ReviewWithType> = {
  location: 'score_location',
  food:     'score_food',
  service:  'score_service',
  price:    'score_price',
}

function applyFilters(
  activities: ActivityWithDetails[],
  filters: FilterState,
  reviewsByActivity: ReturnType<typeof useReviewsStore.getState>['reviewsByActivity']
): ActivityWithDetails[] {
  return activities.filter((a) => {
    const reviews = reviewsByActivity[a.id] ?? []

    if (filters.favoritesOnly && !a.is_favorite) return false

    if (filters.typeIds.length > 0 && !filters.typeIds.some((tid) => a.type_ids.includes(tid)))
      return false

    if (filters.scoreMin != null || filters.scoreMax != null) {
      const avg = calcActivityAvgScore(reviews)
      if (avg === null) return false
      if (filters.scoreMin != null && avg < filters.scoreMin) return false
      if (filters.scoreMax != null && avg > filters.scoreMax) return false
    }

    if (filters.categoryKey != null) {
      const scoreKey = CATEGORY_SCORE_KEY[filters.categoryKey]
      const satisfies = reviews.some((r) => {
        const val = r[scoreKey] as number | null
        if (val == null) return false
        if (filters.categoryMin != null && val < filters.categoryMin) return false
        if (filters.categoryMax != null && val > filters.categoryMax) return false
        return true
      })
      if (!satisfies) return false
    }

    return true
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortKey = 'distance' | 'last_viewed' | 'last_reviewed' | 'alpha'
export type SortDir = 'asc' | 'desc'

type SortOption = {
  key: SortKey
  label: string
  iconAsc: keyof typeof Ionicons.glyphMap
  iconDesc: keyof typeof Ionicons.glyphMap
}

const SORT_OPTIONS: SortOption[] = [
  { key: 'distance',    label: 'Distanza',    iconAsc: 'location-outline',   iconDesc: 'location' },
  { key: 'last_viewed', label: 'Visti',       iconAsc: 'time-outline',       iconDesc: 'time' },
  { key: 'last_reviewed', label: 'Recensiti', iconAsc: 'star-outline',       iconDesc: 'star' },
  { key: 'alpha',       label: 'A→Z',         iconAsc: 'text-outline',       iconDesc: 'text' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(
  lat1: number, lng1: number,
  lat2: number | null, lng2: number | null
): number {
  if (lat2 == null || lng2 == null) return Infinity
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function lastReviewedAt(
  activityId: string,
  reviewsByActivity: ReturnType<typeof useReviewsStore.getState>['reviewsByActivity']
): string | null {
  const reviews = reviewsByActivity[activityId] ?? []
  if (reviews.length === 0) return null
  return reviews.reduce((latest, r) =>
    r.updated_at > latest.updated_at ? r : latest
  ).updated_at
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

function sortActivities(
  activities: ActivityWithDetails[],
  key: SortKey,
  dir: SortDir,
  userLat: number,
  userLng: number,
  reviewsByActivity: ReturnType<typeof useReviewsStore.getState>['reviewsByActivity']
): ActivityWithDetails[] {
  const sign = dir === 'asc' ? 1 : -1

  return [...activities].sort((a, b) => {
    switch (key) {
      case 'distance': {
        const da = haversineKm(userLat, userLng, a.lat, a.lng)
        const db = haversineKm(userLat, userLng, b.lat, b.lng)
        return sign * (da - db)
      }
      case 'last_viewed': {
        const va = a.last_viewed_at ?? ''
        const vb = b.last_viewed_at ?? ''
        return sign * va.localeCompare(vb)
      }
      case 'last_reviewed': {
        const ra = lastReviewedAt(a.id, reviewsByActivity) ?? ''
        const rb = lastReviewedAt(b.id, reviewsByActivity) ?? ''
        return sign * ra.localeCompare(rb)
      }
      case 'alpha':
      default:
        return sign * a.name.localeCompare(b.name, 'it')
    }
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  title: string
  /** Pre-filtered subset of activities to show. If undefined, uses all activities. */
  activities?: ActivityWithDetails[]
  /** Default sort key */
  defaultSortKey?: SortKey
  /** Default sort direction */
  defaultSortDir?: SortDir
  /** Extra header content rendered above the sort bar */
  headerExtra?: React.ReactNode
  /** Show a top safe-area padding (use for tab screens) */
  topInset?: boolean
  /** Show a back arrow (for stack-pushed screens) */
  showBack?: boolean
}

export function ActivityListScreen({
  title,
  activities: activitiesProp,
  defaultSortKey = 'alpha',
  defaultSortDir = 'asc',
  headerExtra,
  topInset = false,
  showBack = false,
}: Props) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { activities: allActivities, loading, fetch } = useActivitiesStore()
  const { coords, hasPermission } = useLocationStore()
  const reviewsByActivity = useReviewsStore((s) => s.reviewsByActivity)

  const [sortKey, setSortKey] = useState<SortKey>(defaultSortKey)
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir)
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTER)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const activeFilterCount = countActiveFilters(filters)

  useEffect(() => {
    fetch()
  }, [fetch])

  const source = activitiesProp ?? allActivities

  const filtered = useMemo(
    () => applyFilters(source, filters, reviewsByActivity),
    [source, filters, reviewsByActivity]
  )

  const sorted = useMemo(
    () => sortActivities(filtered, sortKey, sortDir, coords.lat, coords.lng, reviewsByActivity),
    [filtered, sortKey, sortDir, coords, reviewsByActivity]
  )

  const handleSortPress = (key: SortKey) => {
    if (key === sortKey) {
      // Toggle direction on same key
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Disable "distance" if no permission and coords are the Genova fallback
  const canUseDistance = hasPermission

  const SortBar = (
    <View style={styles.sortBar}>
      <View style={styles.sortPills}>
        {SORT_OPTIONS.map((opt) => {
          const active = sortKey === opt.key
          const disabled = opt.key === 'distance' && !canUseDistance
          const iconName = active && sortDir === 'desc' ? opt.iconDesc : opt.iconAsc
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortBtn, active && styles.sortBtnActive, disabled && styles.sortBtnDisabled]}
              onPress={() => !disabled && handleSortPress(opt.key)}
              activeOpacity={disabled ? 1 : 0.7}
            >
              <Ionicons
                name={iconName}
                size={14}
                color={active ? theme.colors.primary : disabled ? theme.colors.border : theme.colors.textSecondary}
              />
              <Text style={[styles.sortLabel, active && styles.sortLabelActive, disabled && styles.sortLabelDisabled]}>
                {opt.label}
              </Text>
              {active && (
                <Ionicons
                  name={sortDir === 'asc' ? 'chevron-up' : 'chevron-down'}
                  size={11}
                  color={theme.colors.primary}
                />
              )}
            </TouchableOpacity>
          )
        })}
      </View>
      <TouchableOpacity
        style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
        onPress={() => setFilterPanelOpen(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="options-outline"
          size={16}
          color={activeFilterCount > 0 ? theme.colors.primary : theme.colors.textSecondary}
        />
        {activeFilterCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={[styles.container, topInset && { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {showBack && (
            <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        {hasPermission === false && (
          <Text style={styles.noLocationHint}>Posizione non disponibile — distanza disabilitata</Text>
        )}
        {headerExtra}
        {SortBar}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => <ActivityCardVertical activity={item} />}
        onEndReached={() => fetch()}
        onEndReachedThreshold={0.3}
        contentContainerStyle={sorted.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyWrap}>
              <Ionicons name="restaurant-outline" size={48} color={theme.colors.border} />
              <Text style={styles.emptyText}>Nessuna attività</Text>
            </View>
          )
        }
        ListFooterComponent={
          loading ? <ActivityIndicator style={styles.spinner} color={theme.colors.primary} /> : null
        }
      />

      <FilterPanel
        visible={filterPanelOpen}
        value={filters}
        onApply={setFilters}
        onClose={() => setFilterPanelOpen(false)}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  noLocationHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  sortPills: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.xs + 1,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  sortBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '18',
  },
  sortBtnDisabled: {
    opacity: 0.4,
  },
  sortLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  sortLabelActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  sortLabelDisabled: {
    color: theme.colors.border,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '18',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.surface,
  },
  listContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  spinner: {
    paddingVertical: theme.spacing.lg,
  },
})
