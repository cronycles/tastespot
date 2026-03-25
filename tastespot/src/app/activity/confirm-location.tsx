import { useCallback, useRef, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import MapLibreGL, { type MapViewRef } from '@maplibre/maplibre-react-native'
import { ScreenHeader } from '@/components/ScreenHeader'
import { theme } from '@/theme'

MapLibreGL.setAccessToken(null)

export default function ConfirmLocationScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ lat: string; lng: string; name?: string }>()
  const mapViewRef = useRef<MapViewRef>(null)

  const initialLat = parseFloat(params.lat)
  const initialLng = parseFloat(params.lng)

  const [centerCoords, setCenterCoords] = useState<[number, number]>([initialLng, initialLat])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRegionDidChange = (feature: any) => {
    const [lng, lat] = feature?.geometry?.coordinates ?? [initialLng, initialLat]
    setCenterCoords([lng, lat])
  }

  const handleConfirm = () => {
    const [lng, lat] = centerCoords
    router.replace({
      pathname: '/activity/add',
      params: { lat: String(lat), lng: String(lng) },
    })
  }

  const handleLongPress = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (feature: any) => {
      const coordinates = feature?.geometry?.coordinates
      if (!coordinates) return
      const lat = coordinates[1]
      const lng = coordinates[0]

      let poiName: string | undefined
      const sx = feature?.properties?.screenPointX
      const sy = feature?.properties?.screenPointY
      if (sx !== undefined && sy !== undefined && mapViewRef.current) {
        try {
          const result = await mapViewRef.current.queryRenderedFeaturesAtPoint([sx, sy], undefined, [])
          const poi = (result?.features ?? []).find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (f: any) =>
              f.properties?.name &&
              (f.properties.amenity || f.properties.class || f.properties.subclass ||
                f.properties.shop || f.properties.tourism || f.properties.leisure)
          )
          if (poi?.properties?.name) poiName = poi.properties.name as string
        } catch {
          // ignore
        }
      }

      const title = poiName ? `Aggiungere "${poiName}"?` : 'Aggiungi qui?'
      Alert.alert(title, 'Vuoi aggiungere una nuova attività in questo punto?', [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Aggiungi',
          onPress: () =>
            router.replace({
              pathname: '/activity/add',
              params: { lat: String(lat), lng: String(lng), ...(poiName && { name: poiName }) },
            }),
        },
      ])
    },
    [router]
  )

  return (
    <View style={styles.container}>
      <ScreenHeader title="Conferma posizione" topInset={insets.top > 0} />

      <View style={styles.mapWrapper}>
        <MapLibreGL.MapView
          ref={mapViewRef}
          style={styles.map}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          onRegionDidChange={handleRegionDidChange}
          onLongPress={handleLongPress}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <MapLibreGL.Camera
            defaultSettings={{ centerCoordinate: [initialLng, initialLat], zoomLevel: 16 }}
          />
        </MapLibreGL.MapView>

        {/* Fixed crosshair pin at map center */}
        <View style={styles.pinWrapper} pointerEvents="none">
          <Ionicons name="location" size={40} color={theme.colors.primary} />
          <View style={styles.pinShadow} />
        </View>

        <Text style={styles.hint}>Sposta la mappa per posizionare il pin sul posto esatto</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing.md }]}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Conferma posizione</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  pinWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
  },
  pinShadow: {
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: -4,
  },
  hint: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    textAlign: 'center',
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  confirmBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
})
