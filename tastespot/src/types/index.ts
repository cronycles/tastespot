export type ActivityType = {
  id: string
  user_id: string
  name: string
  description: string | null
  icon_key: string
  display_order: number
  created_at: string
}

export type Activity = {
  id: string
  user_id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  notes: string | null
  tags: string[]
  created_at: string
  updated_at: string
  last_viewed_at: string | null
}

export type ActivityTypeAssignment = {
  activity_id: string
  activity_type_id: string
}

export type Review = {
  id: string
  activity_id: string
  activity_type_id: string | null
  user_id: string
  score_location: number | null
  score_food: number | null
  score_service: number | null
  score_price: number | null
  cost_per_person: number | null
  liked: string | null
  disliked: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Favorite = {
  user_id: string
  activity_id: string
  created_at: string
}

export type ActivityPhoto = {
  id: string
  activity_id: string
  storage_path: string
  display_order: number
  created_at: string
}

export type SmileScore = 1 | 3 | 5.5 | 7.5 | 10

export const SMILE_VALUES: SmileScore[] = [1, 3, 5.5, 7.5, 10]

export const DEFAULT_ICON_KEY = 'storefront-outline'

export const AVAILABLE_ICONS = [
  'restaurant-outline',
  'cafe-outline',
  'beer-outline',
  'wine-outline',
  'pizza-outline',
  'fast-food-outline',
  'ice-cream-outline',
  'nutrition-outline',
  'storefront-outline',
  'basket-outline',
] as const

export type AvailableIconKey = (typeof AVAILABLE_ICONS)[number]
