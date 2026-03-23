import { create } from 'zustand'
import { api } from '@/lib/api'
import { ActivityType } from '@/types'

type TypesState = {
  types: ActivityType[]
  loading: boolean
  fetch: () => Promise<void>
  create: (name: string, description: string | null, icon_key: string) => Promise<string | null>
  update: (
    id: string,
    name: string,
    description: string | null,
    icon_key: string
  ) => Promise<string | null>
  remove: (id: string) => Promise<string | null>
  reorder: (id: string, direction: 'up' | 'down') => Promise<void>
}

export const useTypesStore = create<TypesState>((set, get) => ({
  types: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const res = await api.get<{ data: ActivityType[] }>('/types')
      set({ types: res.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  create: async (name, description, icon_key) => {
    try {
      const type = await api.post<ActivityType>('/types', { name, description, icon_key })
      set({ types: [...get().types, type] })
      return null
    } catch {
      return 'Errore durante il salvataggio. Riprova.'
    }
  },

  update: async (id, name, description, icon_key) => {
    try {
      const type = await api.put<ActivityType>(`/types/${id}`, { name, description, icon_key })
      set({ types: get().types.map((t) => (t.id === id ? type : t)) })
      return null
    } catch {
      return 'Errore durante il salvataggio. Riprova.'
    }
  },

  remove: async (id) => {
    try {
      await api.delete(`/types/${id}`)
      const remaining = get().types.filter((t) => t.id !== id)
      set({ types: remaining.map((t, i) => ({ ...t, display_order: i })) })
      return null
    } catch {
      return "Errore durante l'eliminazione. Riprova."
    }
  },

  reorder: async (id, direction) => {
    const types = get().types
    const idx = types.findIndex((t) => t.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= types.length) return

    // Swap locally first for instant feedback
    const next = [...types]
    const aOrder = next[idx].display_order
    const bOrder = next[swapIdx].display_order
    next[idx] = { ...next[idx], display_order: bOrder }
    next[swapIdx] = { ...next[swapIdx], display_order: aOrder }
    next.sort((a, b) => a.display_order - b.display_order)
    set({ types: next })

    // Persist via API (sends ordered array of ids)
    const ordered = next.map((t) => t.id)
    try {
      await api.post('/types/reorder', { ordered })
    } catch { /* best effort */ }
  },
}))
