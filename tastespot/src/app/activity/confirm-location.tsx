import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { ScreenHeader } from '@/components/ScreenHeader'
import { theme } from '@/theme'

MapLibreGL.setAccessToken(null)

export default function ConfirmLocationScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ lat: string; lng: string; name?: string }>()

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
    // Pass only coords — add.tsx will reverse-geocode the address automatically
    router.replace({
      pathname: '/activity/add',
      params: { lat: String(lat), lng: String(lng) },
    })
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Conferma posizione" topInset={insets.top > 0} />

      <View style={styles.mapWrapper}>
        <MapLibreGL.MapView
          style={styles.map}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
          onRegionDidChange={handleRegionDidChange}
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
