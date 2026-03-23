import AsyncStorage from '@react-native-async-storage/async-storage'
import { ActivityPhoto } from '@/types'

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1'
const TOKEN_KEY = '@auth_token'

// In-memory token cache to avoid async overhead on every request
let _token: string | null = null

export function setToken(token: string | null) {
  _token = token
  if (token) {
    AsyncStorage.setItem(TOKEN_KEY, token)
  } else {
    AsyncStorage.removeItem(TOKEN_KEY)
  }
}

export async function loadToken(): Promise<string | null> {
  const t = await AsyncStorage.getItem(TOKEN_KEY)
  _token = t
  return t
}

function authHeaders(): Record<string, string> {
  return _token ? { Authorization: `Bearer ${_token}` } : {}
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null as T
  const json = await res.json()
  if (!res.ok) {
    throw Object.assign(
      new Error(json.message ?? 'Errore server'),
      { status: res.status, errors: json.errors }
    )
  }
  return json as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),

  async uploadPhoto(activityId: string, fileUri: string): Promise<ActivityPhoto> {
    const formData = new FormData()
    formData.append('photo', {
      uri: fileUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as unknown as Blob)

    const res = await fetch(`${BASE_URL}/activities/${activityId}/photos`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...authHeaders(),
      },
      body: formData,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message ?? 'Errore upload foto')
    return json as ActivityPhoto
  },
}
