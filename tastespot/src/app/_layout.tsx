import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useAuthStore } from '@/stores/authStore'
import { logger } from '@/lib/logger'

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

  // Always render Stack so navigation (router.back, router.push, etc.) always works
  return <Stack screenOptions={{ headerShown: false }} />
}
