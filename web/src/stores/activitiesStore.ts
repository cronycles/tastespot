import { create } from 'zustand'
import { api } from '@/lib/api'
import type { Activity, ActivityPhoto, ActivityReviewSummary } from '@/types'

const PAGE_SIZE = 20

export type ActivityWithDetails = Activity & {
  type_ids: string[]
  is_favorite: boolean
  review_summaries: ActivityReviewSummary[]
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
  markViewed: (id: string) => Promise<void>
  addPhoto: (activityId: string, photo: ActivityPhoto) => void
  removePhoto: (activityId: string, photoId: string) => void
}

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  activities: [],
  loading: false,
  hasMore: true,

  fetch: async (reset = false) => {
    const current = get()
    if (current.loading) {
      return
    }

    if (!reset && !current.hasMore) {
      return
    }

    const offset = reset ? 0 : current.activities.length
    set({ loading: true })

    try {
      const response = await api.get<{ data: ActivityWithDetails[]; has_more: boolean }>(
        `/activities?offset=${offset}&limit=${PAGE_SIZE}`
      )
      set({
        activities: reset ? response.data : [...current.activities, ...response.data],
        hasMore: response.has_more,
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
        activities: get().activities.map((entry) => (entry.id === id ? { ...entry, ...activity } : entry)),
      })
      return null
    } catch {
      return 'Errore durante il salvataggio. Riprova.'
    }
  },

  remove: async (id) => {
    try {
      await api.delete(`/activities/${id}`)
      set({ activities: get().activities.filter((entry) => entry.id !== id) })
      return null
    } catch {
      return "Errore durante l'eliminazione. Riprova."
    }
  },

  toggleFavorite: async (id) => {
    const current = get().activities.find((entry) => entry.id === id)
    if (!current) {
      return
    }

    set({
      activities: get().activities.map((entry) =>
        entry.id === id ? { ...entry, is_favorite: !entry.is_favorite } : entry
      ),
    })

    try {
      const response = await api.post<{ is_favorite: boolean }>(`/activities/${id}/favorite`)
      set({
        activities: get().activities.map((entry) =>
          entry.id === id ? { ...entry, is_favorite: response.is_favorite } : entry
        ),
      })
    } catch {
      set({
        activities: get().activities.map((entry) =>
          entry.id === id ? { ...entry, is_favorite: current.is_favorite } : entry
        ),
      })
    }
  },

  markViewed: async (id) => {
    try {
      const response = await api.put<{ last_viewed_at: string }>(`/activities/${id}/viewed`)
      set({
        activities: get().activities.map((entry) =>
          entry.id === id ? { ...entry, last_viewed_at: response.last_viewed_at } : entry
        ),
      })
    } catch {
      return
    }
  },

  addPhoto: (activityId, photo) => {
    set({
      activities: get().activities.map((entry) =>
        entry.id === activityId
          ? { ...entry, photos: [...entry.photos, photo] }
          : entry
      ),
    })
  },

  removePhoto: (activityId, photoId) => {
    set({
      activities: get().activities.map((entry) =>
        entry.id === activityId
          ? { ...entry, photos: entry.photos.filter((photo) => photo.id !== photoId) }
          : entry
      ),
    })
  },
}))