import { create } from 'zustand'
import * as ExpoLocation from 'expo-location'

const FALLBACK = { lat: 44.4056, lng: 8.9463 } // Genova

type Coords = { lat: number; lng: number }

type LocationState = {
  coords: Coords
  hasPermission: boolean
  requestAndFetch: () => Promise<void>
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: FALLBACK,
  hasPermission: false,
  requestAndFetch: async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        set({ hasPermission: false })
        return
      }
      set({ hasPermission: true })
      const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })
      set({ coords: { lat: loc.coords.latitude, lng: loc.coords.longitude } })
    } catch {
      // keep fallback
    }
  },
}))
