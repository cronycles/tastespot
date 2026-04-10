import { create } from 'zustand'
import { CATEGORY_WEIGHTS } from '@/config/scoring'
import { api } from '@/lib/api'
import type { Review } from '@/types'

type ScoreLikeReview = Pick<Review, 'score_location' | 'score_food' | 'score_service' | 'score_price'>

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

export function calcActivityAvgScore(reviews: ScoreLikeReview[]): number | null {
  let weightedSum = 0
  let totalWeight = 0

  for (const review of reviews) {
    const pairs: [number | null, number][] = [
      [review.score_location, CATEGORY_WEIGHTS.location],
      [review.score_food, CATEGORY_WEIGHTS.food],
      [review.score_service, CATEGORY_WEIGHTS.service],
      [review.score_price, CATEGORY_WEIGHTS.price],
    ]

    for (const [score, weight] of pairs) {
      if (score !== null) {
        weightedSum += score * weight
        totalWeight += weight
      }
    }
  }

  if (totalWeight === 0) {
    return null
  }

  return weightedSum / totalWeight
}

export function calcCategoryAvgs(reviews: ScoreLikeReview[]): {
  location: number | null
  food: number | null
  service: number | null
  price: number | null
} {
  const avg = (key: keyof ScoreLikeReview) => {
    const values = reviews.map((review) => review[key]).filter((value): value is number => value !== null)
    if (values.length === 0) {
      return null
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  return {
    location: avg('score_location'),
    food: avg('score_food'),
    service: avg('score_service'),
    price: avg('score_price'),
  }
}

type ReviewsState = {
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
      const response = await api.get<{ data: ReviewWithType[] }>(`/activities/${activityId}/reviews`)
      set((state) => ({
        loading: false,
        reviewsByActivity: {
          ...state.reviewsByActivity,
          [activityId]: response.data,
        },
      }))
    } catch {
      set({ loading: false })
    }
  },

  upsert: async (data) => {
    try {
      const saved = await api.post<ReviewWithType>('/reviews', data)
      set((state) => {
        const existing = state.reviewsByActivity[data.activity_id] ?? []
        const others = existing.filter((review) => review.activity_type_id !== data.activity_type_id)
        return {
          reviewsByActivity: {
            ...state.reviewsByActivity,
            [data.activity_id]: [...others, saved],
          },
        }
      })
      return null
    } catch {
      return 'Errore durante il salvataggio recensione. Riprova.'
    }
  },

  getForActivity: (activityId) => get().reviewsByActivity[activityId] ?? [],

  getForType: (activityId, typeId) => {
    return (
      get().reviewsByActivity[activityId]?.find((review) => review.activity_type_id === typeId) ?? null
    )
  },
}))
