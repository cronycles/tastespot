import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { useActivitiesStore, ActivityWithDetails } from '@/stores/activitiesStore'
import { useAuthStore } from '@/stores/authStore'
import { useLocationStore } from '@/stores/locationStore'
import { useTypesStore } from '@/stores/typesStore'
import { useNominatim, NominatimResult } from '@/hooks/useNominatim'
import { theme } from '@/theme'

// ─── Suggestion types ───────────────────────────────────────────────────────

type Suggestion =
  | { kind: 'activity'; data: ActivityWithDetails }
  | { kind: 'address';  data: NominatimResult }
  | { kind: 'list';     query: string }

// ─── Component ──────────────────────────────────────────────────────────────

MapLibreGL.setAccessToken(null)

// Vector tiles via OpenFreeMap — free, no API key, sharp on all resolutions
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const ALL_FILTER = 'Tutti'

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const cameraRef = useRef<MapLibreGL.Camera>(null)
  const mapViewRef = useRef<MapLibreGL.MapView>(null)

  const { coords, hasPermission, requestAndFetch } = useLocationStore()
  const { results, loading: nominatimLoading, search, clear } = useNominatim()
  const { types, fetch: fetchTypes } = useTypesStore()
  const { activities, fetch: fetchActivities } = useActivitiesStore()
  const { isNewUser, dismissWelcome } = useAuthStore()

  const [searchText, setSearchText] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [activeFilter, setActiveFilter] = useState('Tutti')
  const [zoomLevel, setZoomLevel] = useState(14)
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null)
  // Incremented every time the screen gains focus — forces PointAnnotation re-mount
  // to work around MapLibre's known issue where onSelected stops firing after navigation
  const [markerEpoch, setMarkerEpoch] = useState(0)

  useFocusEffect(
    useCallback(() => {
      setMarkerEpoch((e) => e + 1)
    }, [])
  )

  useEffect(() => {
    requestAndFetch()
    fetchTypes()
    fetchActivities(true)
  }, [requestAndFetch, fetchTypes, fetchActivities])

  const activitySuggestions = useMemo<ActivityWithDetails[]>(() => {
    const q = searchText.trim().toLowerCase()
    if (q.length < 2) return []
    return activities
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.address?.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 4)
  }, [searchText, activities])

  const suggestions = useMemo<Suggestion[]>(() => {
    const list: Suggestion[] = [
      ...activitySuggestions.map((a): Suggestion => ({ kind: 'activity', data: a })),
      ...results.map((r): Suggestion => ({ kind: 'address', data: r })),
    ]
    if (searchText.trim().length >= 2) {
      list.push({ kind: 'list', query: searchText.trim() })
    }
    return list
  }, [activitySuggestions, results, searchText])

  const handleSelectSuggestion = (s: Suggestion) => {
    Keyboard.dismiss()
    if (s.kind === 'activity') {
      setShowResults(false)
      router.push({ pathname: '/activity/[id]', params: { id: s.data.id } })
    } else if (s.kind === 'address') {
      handleSelectResult(s.data)
    } else {
      setShowResults(false)
      router.push({ pathname: '/list', params: { q: s.query } })
    }
  }

  const handleSubmitSearch = () => {
    const q = searchText.trim()
    if (q.length === 0) return
    Keyboard.dismiss()
    setShowResults(false)
    router.push({ pathname: '/list', params: { q } })
  }

  const handleSearchChange = (text: string) => {
    setSearchText(text)
    setShowResults(true)
    search(text)
  }

  const handleSelectResult = (result: NominatimResult) => {
    Keyboard.dismiss()
    setSearchText(result.display_name.split(',')[0])
    setShowResults(false)
    clear()
    const coord: [number, number] = [parseFloat(result.lon), parseFloat(result.lat)]
    setSelectedCoords(coord)
    cameraRef.current?.setCamera({
      centerCoordinate: coord,
      zoomLevel: 16,
    })
  }

  const handleClearSearch = () => {
    setSearchText('')
    setShowResults(false)
    setSelectedCoords(null)
    clear()
  }

  const handleCenterOnUser = async () => {
    await requestAndFetch()
    // Read fresh coords from store after fetch completes (avoid stale closure)
    const { coords: fresh } = useLocationStore.getState()
    cameraRef.current?.setCamera({
      centerCoordinate: [fresh.lng, fresh.lat],
      zoomLevel: 14,
      animationMode: 'none',
      animationDuration: 0,
    })
  }

  const handleLongPress = useCallback(
    async (feature: {
      geometry?: { coordinates?: number[] }
      properties?: { screenPointX?: number; screenPointY?: number }
    }) => {
      const coordinates = feature?.geometry?.coordinates
      if (!coordinates) return

      const lat = coordinates[1]
      const lng = coordinates[0]

      // Extract POI data from vector tiles at the pressed screen point
      let poiName: string | undefined
      let osmAmenity: string | undefined
      let osmPhone: string | undefined
      let osmAddress: string | undefined

      const sx = feature?.properties?.screenPointX
      const sy = feature?.properties?.screenPointY
      if (sx !== undefined && sy !== undefined && mapViewRef.current) {
        try {
          const result = await mapViewRef.current.queryRenderedFeaturesAtPoint([sx, sy])
          const features = result?.features ?? []
          // Find first OSM POI with a name — OpenFreeMap uses class/subclass (not amenity)
          const poi = features.find(
            (f) =>
              f.properties?.name &&
              (f.properties.amenity ||
                f.properties.class ||
                f.properties.subclass ||
                f.properties.shop ||
                f.properties.tourism ||
                f.properties.leisure)
          )
          if (poi?.properties) {
            const p = poi.properties
            poiName = p.name as string
            osmAmenity = (p.amenity ?? p.subclass ?? p.class ?? p.shop ?? p.tourism ?? p.leisure) as string
            osmPhone = (p.phone ?? p['contact:phone'] ?? p['contact:mobile']) as
              | string
              | undefined
            const street = [p['addr:housenumber'], p['addr:street']].filter(Boolean).join(' ')
            const city = (p['addr:city'] ?? '') as string
            const addr = [street, city].filter(Boolean).join(', ')
            osmAddress = addr || undefined
          }
        } catch {
          // queryRenderedFeaturesAtPoint may fail on edge cases — continue without POI data
        }
      }

      const title = poiName ? `Aggiungere "${poiName}"?` : 'Aggiungi attività'
      const body = poiName
        ? 'I dati saranno pre-compilati automaticamente.'
        : 'Vuoi aggiungere una nuova attività in questo punto?'

      Alert.alert(title, body, [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Aggiungi',
          onPress: () =>
            router.push({
              pathname: '/activity/add',
              params: {
                lat: String(lat),
                lng: String(lng),
                ...(poiName && { name: poiName }),
                ...(osmAmenity && { osmAmenity }),
                ...(osmPhone && { phone: osmPhone }),
                ...(osmAddress && { address: osmAddress }),
              },
            }),
        },
      ])
    },
    [router]
  )

  const searchBarTop = insets.top + theme.spacing.sm

  return (
    <View style={styles.container}>
      {/* Mappa */}
      <MapLibreGL.MapView
        ref={mapViewRef}
        style={styles.map}
        mapStyle={MAP_STYLE}
        onLongPress={handleLongPress}
        compassEnabled
        compassViewPosition={3}
        compassViewMargins={{ x: theme.spacing.md + 8, y: insets.bottom + 148 }}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [8.9463, 44.4056],
            zoomLevel: 14,
          }}
        />
        {hasPermission && <MapLibreGL.UserLocation visible renderMode="native" />}
        {/* Markers per le attività salvate */}
        {activities
          .filter((a) => {
            if (!a.lat || !a.lng) return false
            if (activeFilter === ALL_FILTER) return true
            const matchedType = types.find((t) => t.name === activeFilter)
            return matchedType ? a.type_ids.includes(matchedType.id) : false
          })
          .map((a) => {
            const iconKey = (
              a.type_ids.length > 1
                ? 'apps-outline'
                : (types.find((t) => a.type_ids.includes(t.id))?.icon_key ?? 'restaurant-outline')
            ) as 'restaurant-outline'
            return (
              <MapLibreGL.PointAnnotation
                key={`activity-${a.id}-${markerEpoch}`}
                id={`activity-${a.id}-${markerEpoch}`}
                coordinate={[a.lng as number, a.lat as number]}
                onSelected={() => router.push({ pathname: '/activity/[id]', params: { id: a.id } })}
              >
                <View style={styles.activityMarker}>
                  <Ionicons name={iconKey} size={16} color={theme.colors.surface} />
                </View>
              </MapLibreGL.PointAnnotation>
            )
          })
        }

        {selectedCoords && (
          <MapLibreGL.PointAnnotation
            id="search-result"
            coordinate={selectedCoords}
          >
            <View style={styles.markerPin}>
              <Ionicons name="location" size={30} color={theme.colors.primary} />
            </View>
          </MapLibreGL.PointAnnotation>
        )}
      </MapLibreGL.MapView>

      {/* Search bar + risultati */}
      <View style={[styles.searchContainer, { top: searchBarTop }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca un posto..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchText}
            onChangeText={handleSearchChange}
            onFocus={() => searchText.length > 0 && setShowResults(true)}
            returnKeyType="search"
            onSubmitEditing={handleSubmitSearch}
          />
          {nominatimLoading ? (
            <ActivityIndicator size="small" color={theme.colors.textSecondary} style={styles.searchRight} />
          ) : searchText.length > 0 ? (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={8} style={styles.searchRight}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Dropdown suggerimenti misti */}
        {showResults && suggestions.length > 0 && (
          <View style={styles.resultsList}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) =>
                item.kind === 'activity'
                  ? `act-${item.data.id}`
                  : item.kind === 'address'
                  ? `addr-${item.data.place_id}`
                  : `list-${item.query}`
              }
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: s }) => {
                if (s.kind === 'activity') {
                  return (
                    <TouchableOpacity
                      style={styles.resultItem}
                      onPress={() => handleSelectSuggestion(s)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="star-outline" size={16} color={theme.colors.primary} style={styles.resultIcon} />
                      <View style={styles.resultTextWrap}>
                        <Text style={styles.resultText} numberOfLines={1}>{s.data.name}</Text>
                        {s.data.address ? (
                          <Text style={styles.resultSubtext} numberOfLines={1}>{s.data.address}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  )
                }
                if (s.kind === 'address') {
                  return (
                    <TouchableOpacity
                      style={styles.resultItem}
                      onPress={() => handleSelectSuggestion(s)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} style={styles.resultIcon} />
                      <Text style={styles.resultText} numberOfLines={2}>{s.data.display_name}</Text>
                    </TouchableOpacity>
                  )
                }
                // kind === 'list'
                return (
                  <TouchableOpacity
                    style={[styles.resultItem, styles.resultItemList]}
                    onPress={() => handleSelectSuggestion(s)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="list-outline" size={16} color={theme.colors.primary} style={styles.resultIcon} />
                    <Text style={[styles.resultText, styles.resultTextList]}>
                      Cerca "{s.query}" in lista
                    </Text>
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        )}

        {/* Filtri */}
        <View style={styles.filtersRow}>
          <FlatList
            data={[ALL_FILTER, ...types.slice(0, 5).map(t => t.name)]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.filtersContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
                onPress={() => setActiveFilter(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {/*
        Right side (bottom to top):
          [+] fabAdd   — bottom + 8   h=56
          gap 32px
          [◎] locate  — bottom + 96  h=44  (grouped visually with compass above)
        Center: fabAdd right=16→center=44px; locate right=22→center=44px. ✓
        Zoom pill: centered, bottom + 4 (flush to tab bar).
      */}
      <TouchableOpacity
        style={[styles.fabAdd, { bottom: insets.bottom + 2 }]}
        onPress={() => router.push('/activity/add')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={theme.colors.surface} />
      </TouchableOpacity>

      {/* Locate — well above fabAdd, visually grouped with compass */}
      <TouchableOpacity
        style={[styles.fabCenter, { bottom: insets.bottom + 96, right: theme.spacing.md + 6 }]}
        onPress={handleCenterOnUser}
        activeOpacity={0.85}
      >
        <Ionicons name="locate" size={20} color={theme.colors.primary} />
      </TouchableOpacity>

      {/* Zoom pill — horizontal, centered, flush to tab bar */}
      <View style={[styles.zoomRow, { bottom: insets.bottom + theme.spacing.sm }]}>
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => {
            const next = Math.max(zoomLevel - 1, 1)
            setZoomLevel(next)
            cameraRef.current?.setCamera({ zoomLevel: next, animationMode: 'none', animationDuration: 0 })
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="remove" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => {
            const next = Math.min(zoomLevel + 1, 20)
            setZoomLevel(next)
            cameraRef.current?.setCamera({ zoomLevel: next, animationMode: 'none', animationDuration: 0 })
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Banner benvenuto — mostrato solo dopo la registrazione */}
      {isNewUser && (
        <View style={[styles.welcomeBanner, { bottom: insets.bottom + theme.spacing.lg + 56 + theme.spacing.md }]}>
          <View style={styles.welcomeContent}>
            <Ionicons name="sparkles" size={20} color={theme.colors.primary} style={styles.welcomeIcon} />
            <View style={styles.welcomeTextWrap}>
              <Text style={styles.welcomeTitle}>Benvenuto in TasteSpot!</Text>
              <Text style={styles.welcomeBody}>Premi + per aggiungere la tua prima attività.</Text>
            </View>
          </View>
          <TouchableOpacity onPress={dismissWelcome} hitSlop={8} style={styles.welcomeClose}>
            <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  searchContainer: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  searchRight: {
    marginLeft: theme.spacing.sm,
  },

  resultsList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xs,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    maxHeight: 220,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  resultIcon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  resultTextWrap: {
    flex: 1,
  },
  resultText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  resultSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  resultItemList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  resultTextList: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium as 'normal',
  },

  filtersRow: {
    marginTop: theme.spacing.sm,
  },
  filtersContent: {
    gap: theme.spacing.sm,
    paddingHorizontal: 2,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.medium,
  },
  filterTextActive: {
    color: theme.colors.surface,
  },

  fabAdd: {
    position: 'absolute',
    right: theme.spacing.md,
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  welcomeBanner: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  welcomeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeIcon: {
    marginRight: theme.spacing.sm,
  },
  welcomeTextWrap: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  welcomeBody: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  welcomeClose: {
    marginLeft: theme.spacing.sm,
  },
  zoomRow: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -44 }],
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: theme.colors.border,
  },
  fabCenter: {
    position: 'absolute',
    right: theme.spacing.md,
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  markerPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
})

