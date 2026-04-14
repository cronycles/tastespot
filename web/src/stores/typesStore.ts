import { create } from 'zustand'
import { api } from '@/lib/api'
import type { ActivityType } from '@/types'

type TypesState = {
  types: ActivityType[]
  loading: boolean
  fetch: () => Promise<void>
  create: (name: string, description: string | null, iconKey: string) => Promise<string | null>
  update: (
    id: string,
    name: string,
    description: string | null,
    iconKey: string
  ) => Promise<string | null>
  remove: (id: string) => Promise<string | null>
  reorder: (id: string, direction: 'up' | 'down') => Promise<void>
  reorderByIndex: (fromIndex: number, toIndex: number) => Promise<void>
}

export const useTypesStore = create<TypesState>((set, get) => ({
  types: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const response = await api.get<{ data: ActivityType[] }>('/types')
      set({ types: response.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  create: async (name, description, iconKey) => {
    try {
      const type = await api.post<ActivityType>('/types', {
        name,
        description,
        icon_key: iconKey,
      })
      set({ types: [...get().types, type] })
      return null
    } catch {
      return 'Errore durante il salvataggio. Riprova.'
    }
  },

  update: async (id, name, description, iconKey) => {
    try {
      const type = await api.put<ActivityType>(`/types/${id}`, {
        name,
        description,
        icon_key: iconKey,
      })
      set({ types: get().types.map((entry) => (entry.id === id ? type : entry)) })
      return null
    } catch {
      return 'Errore durante il salvataggio. Riprova.'
    }
  },

  remove: async (id) => {
    try {
      await api.delete(`/types/${id}`)
      const remaining = get().types.filter((entry) => entry.id !== id)
      set({
        types: remaining.map((entry, index) => ({
          ...entry,
          display_order: index,
        })),
      })
      return null
    } catch {
      return "Errore durante l'eliminazione. Riprova."
    }
  },

  reorder: async (id, direction) => {
    const types = get().types
    const index = types.findIndex((entry) => entry.id === id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1

    if (swapIndex < 0 || swapIndex >= types.length) {
      return
    }

    const next = [...types]
    const firstOrder = next[index].display_order
    const secondOrder = next[swapIndex].display_order

    next[index] = { ...next[index], display_order: secondOrder }
    next[swapIndex] = { ...next[swapIndex], display_order: firstOrder }
    next.sort((a, b) => a.display_order - b.display_order)
    set({ types: next })

    const ordered = next.map((entry) => entry.id)
    try {
      await api.post('/types/reorder', { ordered })
    } catch {
      // best effort
    }
  },

  reorderByIndex: async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    const sorted = [...get().types].sort((a, b) => a.display_order - b.display_order)
    const next = [...sorted]
    const [item] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, item)
    const updated = next.map((entry, idx) => ({ ...entry, display_order: idx }))
    set({ types: updated })
    const ordered = updated.map((entry) => entry.id)
    try {
      await api.post('/types/reorder', { ordered })
    } catch {
      // best effort
    }
  },
}))