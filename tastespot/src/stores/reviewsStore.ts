import { create } from 'zustand'
import { api } from '@/lib/api'
import { Review } from '@/types'

export type ReviewWithType = Review & {
  type_name: string | null
  type_icon_key: string | null
}

export type UpsertReviewData = {
  activity_id: string
  activity_type_id: string
  score_location: number | null
  score_food: number | null
  score_service: number | null
  score_price: number | null
  cost_per_person: number | null
  liked: string | null
  disliked: string | null
  notes: string | null
}

// Returns avg of all non-null scores in a ReviewWithType
export function calcAvgScore(review: Review): number | null {
  const scores = [
    review.score_location,
    review.score_food,
    review.score_service,
    review.score_price,
  ].filter((s): s is number => s !== null)
  if (scores.length === 0) return null
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

// Returns avg across all reviews for an activity (all types combined)
export function calcActivityAvgScore(reviews: Review[]): number | null {
  const allScores = reviews.flatMap((r) =>
    [r.score_location, r.score_food, r.score_service, r.score_price].filter(
      (s): s is number => s !== null
    )
  )
  if (allScores.length === 0) return null
  return allScores.reduce((a, b) => a + b, 0) / allScores.length
}

// Returns per-category avg across all reviews for an activity
export function calcCategoryAvgs(reviews: Review[]): {
  location: number | null
  food: number | null
  service: number | null
  price: number | null
} {
  const avg = (key: keyof Pick<Review, 'score_location' | 'score_food' | 'score_service' | 'score_price'>) => {
    const vals = reviews.map((r) => r[key]).filter((v): v is number => v !== null)
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }
  return {
    location: avg('score_location'),
    food: avg('score_food'),
    service: avg('score_service'),
    price: avg('score_price'),
  }
}

// Maps a 1-10 score to a smile index 0-4
export function scoreToSmileIndex(score: number): number {
  if (score <= 1) return 0
  if (score <= 3) return 1
  if (score <= 5.5) return 2
  if (score <= 7.5) return 3
  return 4
}

// Smile values: index → numeric score
export const SMILE_VALUES = [1, 3, 5.5, 7.5, 10] as const

type ReviewsState = {
  // Map of activity_id → reviews for that activity
  reviewsByActivity: Record<string, ReviewWithType[]>
  loading: boolean
  fetch: (activityId: string) => Promise<void>
  upsert: (data: UpsertReviewData) => Promise<string | null>
  getForActivity: (activityId: string) => ReviewWithType[]
  getForType: (activityId: string, typeId: string) => ReviewWithType | null
}

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviewsByActivity: {},
  loading: false,

  fetch: async (activityId) => {
    set({ loading: true })
    try {
      const res = await api.get<{ data: ReviewWithType[] }>(`/activities/${activityId}/reviews`)
      set((state) => ({
        loading: false,
        reviewsByActivity: { ...state.reviewsByActivity, [activityId]: res.data },
      }))
    } catch {
      set({ loading: false })
    }
  },

  upsert: async (data) => {
    try {
      const saved = await api.post<ReviewWithType>('/reviews', {
        activity_id: data.activity_id,
        activity_type_id: data.activity_type_id,
        score_location: data.score_location,
        score_food: data.score_food,
        score_service: data.score_service,
        score_price: data.score_price,
        cost_per_person: data.cost_per_person,
        liked: data.liked,
        disliked: data.disliked,
        notes: data.notes,
      })

      set((state) => {
        const existing = state.reviewsByActivity[data.activity_id] ?? []
        const others = existing.filter((r) => r.activity_type_id !== data.activity_type_id)
        return {
          reviewsByActivity: {
            ...state.reviewsByActivity,
            [data.activity_id]: [...others, saved],
          },
        }
      })
      return null
    } catch {
      return 'Errore durante il salvataggio. Riprova.'
    }
  },

  getForActivity: (activityId) => get().reviewsByActivity[activityId] ?? [],

  getForType: (activityId, typeId) =>
    (get().reviewsByActivity[activityId] ?? []).find(
      (r) => r.activity_type_id === typeId
    ) ?? null,
}))
