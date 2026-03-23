import { create } from 'zustand'
import { api } from '@/lib/api'
import { Activity, ActivityPhoto } from '@/types'

const PAGE_SIZE = 20

export type ActivityWithDetails = Activity & {
  type_ids: string[]
  is_favorite: boolean
  photos: ActivityPhoto[]
}

export type CreateActivityData = {
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  notes: string | null
  tags: string[]
  type_ids: string[]
  is_favorite: boolean
}

export type UpdateActivityData = {
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  notes: string | null
  tags: string[]
  type_ids: string[]
}

type ActivitiesState = {
  activities: ActivityWithDetails[]
  loading: boolean
  hasMore: boolean
  fetch: (reset?: boolean) => Promise<void>
  create: (data: CreateActivityData) => Promise<string | null>
  update: (id: string, data: UpdateActivityData) => Promise<string | null>
  remove: (id: string) => Promise<string | null>
  toggleFavorite: (id: string) => Promise<void>
  updateLastViewed: (id: string) => Promise<void>
  addPhoto: (activityId: string, photo: ActivityPhoto) => void
  removePhoto: (activityId: string, photoId: string) => void
}

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  activities: [],
  loading: false,
  hasMore: true,

  fetch: async (reset = false) => {
    const current = get()
    if (current.loading) return
    if (!reset && !current.hasMore) return

    const offset = reset ? 0 : current.activities.length
    set({ loading: true })

    try {
      const res = await api.get<{ data: ActivityWithDetails[]; has_more: boolean }>(
        `/activities?offset=${offset}&limit=${PAGE_SIZE}`
      )
      set({
        activities: reset ? res.data : [...current.activities, ...res.data],
        hasMore: res.has_more,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  create: async (data) => {
    try {
      const activity = await api.post<ActivityWithDetails>('/activities', {
        name: data.name,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone,
        notes: data.notes,
        tags: data.tags,
        type_ids: data.type_ids,
        is_favorite: data.is_favorite,
      })
      set({ activities: [activity, ...get().activities] })
      return null
    } catch {
      return 'Errore durante il salvataggio. Riprova.'
    }
  },

  update: async (id, data) => {
    try {
      const activity = await api.put<ActivityWithDetails>(`/activities/${id}`, {
        name: data.name,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone,
        notes: data.notes,
        tags: data.tags,
        type_ids: data.type_ids,
      })
      set({
        activities: get().activities.map((a) =>
          a.id === id ? { ...a, ...activity } : a
        ),
      })
      return null
    } catch {
      return 'Errore durante il salvataggio. Riprova.'
    }
  },

  remove: async (id) => {
    try {
      await api.delete(`/activities/${id}`)
      set({ activities: get().activities.filter((a) => a.id !== id) })
      return null
    } catch {
      return "Errore durante l'eliminazione. Riprova."
    }
  },

  toggleFavorite: async (id) => {
    const activity = get().activities.find((a) => a.id === id)
    if (!activity) return

    // Optimistic update
    set({
      activities: get().activities.map((a) =>
        a.id === id ? { ...a, is_favorite: !a.is_favorite } : a
      ),
    })

    try {
      const { is_favorite } = await api.post<{ is_favorite: boolean }>(`/activities/${id}/favorite`)
      set({
        activities: get().activities.map((a) =>
          a.id === id ? { ...a, is_favorite } : a
        ),
      })
    } catch {
      // Revert optimistic update on failure
      set({
        activities: get().activities.map((a) =>
          a.id === id ? { ...a, is_favorite: activity.is_favorite } : a
        ),
      })
    }
  },

  updateLastViewed: async (id) => {
    const now = new Date().toISOString()
    set({
      activities: get().activities.map((a) =>
        a.id === id ? { ...a, last_viewed_at: now } : a
      ),
    })
    try { await api.put(`/activities/${id}/viewed`) } catch { /* best effort */ }
  },

  addPhoto: (activityId, photo) => {
    set({
      activities: get().activities.map((a) =>
        a.id === activityId ? { ...a, photos: [...a.photos, photo] } : a
      ),
    })
  },

  removePhoto: (activityId, photoId) => {
    set({
      activities: get().activities.map((a) =>
        a.id === activityId
          ? { ...a, photos: a.photos.filter((p) => p.id !== photoId) }
          : a
      ),
    })
  },
}))
