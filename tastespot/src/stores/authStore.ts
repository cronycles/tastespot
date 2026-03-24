import { create } from 'zustand'
import { api, loadToken, setToken } from '@/lib/api'

type AuthState = {
  token: string | null
  initialized: boolean
  loading: boolean
  isNewUser: boolean
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (name: string, email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  dismissWelcome: () => void
}

function parseAuthError(message: string): string {
  if (message.includes('Credenziali non valide')) return 'Email o password non corretti.'
  if (message.includes('già registrat')) return 'Esiste già un account con questa email.'
  if (message.includes('Network request failed')) return 'Errore di connessione. Controlla la rete.'
  return message || 'Si è verificato un errore. Riprova.'
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  initialized: false,
  loading: false,
  isNewUser: false,

  init: async () => {
    const token = await loadToken()
    if (!token) {
      set({ initialized: true })
      return
    }
    try {
      await api.get('/auth/me')
      set({ token, initialized: true })
    } catch {
      // Token invalid/expired — clear it
      setToken(null)
      set({ token: null, initialized: true })
    }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { token } = await api.post<{ token: string }>('/auth/login', { email, password })
      setToken(token)
      set({ token, loading: false })
      return null
    } catch (e: unknown) {
      set({ loading: false })
      return parseAuthError((e as Error).message)
    }
  },

  signUp: async (name, email, password) => {
    set({ loading: true })
    try {
      const { token } = await api.post<{ token: string }>('/auth/register', {
        name,
        email,
        password,
        password_confirmation: password,
      })
      setToken(token)
      set({ token, loading: false, isNewUser: true })
      return null
    } catch (e: unknown) {
      set({ loading: false })
      return parseAuthError((e as Error).message)
    }
  },

  dismissWelcome: () => set({ isNewUser: false }),

  signOut: async () => {
    try { await api.post('/auth/logout') } catch { /* best effort */ }
    setToken(null)
    set({ token: null })
  },
}))
