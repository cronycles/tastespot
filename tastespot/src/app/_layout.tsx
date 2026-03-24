import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as Linking from 'expo-linking'
import { useAuthStore } from '@/stores/authStore'
import { useActivitiesStore } from '@/stores/activitiesStore'
import { logger } from '@/lib/logger'

// Extracts coordinates from a Google Maps share URL or plain text.
// Google Maps shares text like: "Place Name\nhttps://maps.app.goo.gl/..."
// or URLs like: "https://www.google.com/maps/place/Name/@lat,lng,zoom"
function parseGoogleMapsShare(text: string): { name?: string; lat?: number; lng?: number } | null {
  // Try to extract coordinates from google.com/maps URL (@lat,lng)
  const coordsMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (coordsMatch) {
    const lat = parseFloat(coordsMatch[1])
    const lng = parseFloat(coordsMatch[2])
    // Try to extract place name from the first line of shared text
    const firstLine = text.split('\n')[0].trim()
    const name = firstLine && !firstLine.startsWith('http') ? firstLine : undefined
    return { name, lat, lng }
  }
  // Try query param format: /maps?q=lat,lng or /maps/place/name/.../@lat,lng
  const qMatch = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
  }
  return null
}

export default function RootLayout() {
  const init = useAuthStore((s) => s.init)
  const token = useAuthStore((s) => s.token)
  const initialized = useAuthStore((s) => s.initialized)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    logger.log('RootLayout', 'useEffect mount — calling init')
    init()
  }, [init])

  // Handle auth redirects after initialization — always keep Stack mounted
  useEffect(() => {
    if (!initialized) return
    const inAuthGroup = segments[0] === '(auth)'
    logger.log('RootLayout', 'auth check — token:', !!token, '| inAuthGroup:', inAuthGroup)
    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (token && inAuthGroup) {
      router.replace('/(tabs)')
    } else if (token && (segments as string[]).length === 0) {
      router.replace('/(tabs)')
    }
  }, [initialized, token, segments])

  // Handle incoming deep links and Android ACTION_SEND shares (e.g. from Google Maps)
  useEffect(() => {
    if (!token) return

    const handleUrl = (url: string) => {
      // tastespot:// deep link — Expo Router handles navigation directly
      if (url.startsWith('tastespot://')) return

      // Plain text shared via ACTION_SEND from another app (Android)
      const parsed = parseGoogleMapsShare(url)
      if (!parsed) return

      const { activities } = useActivitiesStore.getState()
      if (parsed.lat !== undefined && parsed.lng !== undefined) {
        // Check if an activity already exists near these coordinates (~50m radius)
        const existing = activities.find((a) => {
          if (!a.lat || !a.lng) return false
          const dlat = a.lat - parsed.lat!
          const dlng = a.lng - parsed.lng!
          return Math.sqrt(dlat * dlat + dlng * dlng) < 0.0005
        })
        if (existing) {
          router.push({ pathname: '/activity/[id]', params: { id: existing.id } })
        } else {
          router.push({
            pathname: '/activity/add',
            params: {
              lat: String(parsed.lat),
              lng: String(parsed.lng),
              ...(parsed.name && { name: parsed.name }),
            },
          })
        }
      }
    }

    // Handle URL if app was opened via a share/link
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url)
    })

    // Handle URL while app is already open
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url))
    return () => sub.remove()
  }, [token])

  // Always render Stack so navigation (router.back, router.push, etc.) always works
  return <Stack screenOptions={{ headerShown: false }} />
}
