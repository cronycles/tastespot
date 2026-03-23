import { useState, useRef } from 'react'

export type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const USER_AGENT = 'TasteSpot/1.0'

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: 'json',
      addressdetails: '1',
    })
    const res = await fetch(`${NOMINATIM_REVERSE_URL}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    })
    if (res.ok) {
      const data: {
        display_name?: string
        address?: {
          road?: string
          pedestrian?: string
          house_number?: string
          city?: string
          town?: string
          village?: string
          suburb?: string
          county?: string
          postcode?: string
        }
      } = await res.json()
      // Build address from structured components (excludes venue name)
      if (data.address) {
        const a = data.address
        const street = [a.road ?? a.pedestrian, a.house_number].filter(Boolean).join(' ')
        const locality = a.city ?? a.town ?? a.village ?? a.suburb ?? a.county ?? ''
        const parts = [street, locality, a.postcode].filter(Boolean)
        if (parts.length > 0) return parts.join(', ')
      }
      return data.display_name ?? null
    }
  } catch {
    // ignore network errors
  }
  return null
}

export function useNominatim() {
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          limit: '5',
          addressdetails: '0',
        })
        const res = await fetch(`${NOMINATIM_URL}?${params}`, {
          headers: { 'User-Agent': USER_AGENT },
        })
        if (res.ok) {
          const data: NominatimResult[] = await res.json()
          setResults(data)
        }
      } catch {
        // ignore network errors silently
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  const clear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setResults([])
  }

  return { results, loading, search, clear }
}
