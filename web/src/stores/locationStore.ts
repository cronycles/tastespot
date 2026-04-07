import { create } from 'zustand'

const FALLBACK = { lat: 44.4056, lng: 8.9463 }

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
    if (!('geolocation' in navigator)) {
      set({ hasPermission: false })
      return
    }

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          set({
            hasPermission: true,
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          })
          resolve()
        },
        () => {
          set({ hasPermission: false })
          resolve()
        },
        {
          enableHighAccuracy: false,
          maximumAge: 30000,
          timeout: 10000,
        }
      )
    })
  },
}))