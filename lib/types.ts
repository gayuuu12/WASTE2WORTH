export type CompanyRole = "supplier" | "buyer" | "both"
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected"
export type ListingStatus = "draft" | "active" | "reserved" | "sold" | "inactive" | "expired"
export type RequirementStatus = "active" | "fulfilled" | "paused" | "closed"
export type OfferStatus = "pending" | "countered" | "accepted" | "rejected" | "withdrawn" | "expired"
export type TransactionStatus =
  | "agreed"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed"

export interface Company {
  id: string
  name: string
  description: string | null
  industry: string | null
  business_type: string | null
  role: CompanyRole
  website: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  logo_url: string | null
  verification_status: VerificationStatus
  verification_doc_path: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  company_id: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface WasteCategory {
  id: string
  slug: string
  name: string
  description: string | null
  created_at: string
}

export interface ListingImage {
  id: string
  listing_id: string
  storage_path: string
  image_url: string
  created_at: string
}

export interface WasteListing {
  id: string
  supplier_company_id: string
  created_by: string | null
  title: string
  description: string | null
  category_id: string | null
  material_name: string
  material_grade: string | null
  quantity: number
  quantity_unit: string
  minimum_order_quantity: number | null
  condition: string | null
  contamination_level: string | null
  moisture_level: string | null
  quality_notes: string | null
  asking_price: number | null
  currency: string
  price_unit: string | null
  negotiable: boolean
  recurring: boolean
  availability_frequency: string | null
  available_from: string | null
  location_text: string | null
  city: string | null
  state: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  status: ListingStatus
  created_at: string
  updated_at: string
  // joined
  category?: WasteCategory | null
  company?: Company | null
  images?: ListingImage[]
}

export interface BuyerRequirement {
  id: string
  buyer_company_id: string
  created_by: string | null
  title: string
  description: string | null
  category_id: string | null
  material_name: string
  desired_grade: string | null
  quantity_needed: number | null
  minimum_acceptable_quantity: number | null
  quantity_unit: string
  max_price: number | null
  currency: string
  preferred_quality: string | null
  max_distance_km: number | null
  preferred_city: string | null
  preferred_state: string | null
  preferred_country: string | null
  latitude: number | null
  longitude: number | null
  recurring: boolean
  required_by: string | null
  notes: string | null
  status: RequirementStatus
  created_at: string
  updated_at: string
  category?: WasteCategory | null
}

export interface Match {
  id: string
  requirement_id: string
  listing_id: string
  score: number
  score_breakdown: MatchScoreBreakdown | null
  distance_km: number | null
  status: "suggested" | "viewed" | "dismissed" | "contacted"
  created_at: string
  updated_at?: string
  requirement?: BuyerRequirement
  listing?: WasteListing
}

export interface MatchScoreBreakdown {
  material: number
  quantity: number | null
  quality: number | null
  distance: number | null
  price: number | null
  distance_unavailable?: boolean
  price_unavailable?: boolean
}

/** @deprecated Use Match */
export interface MatchResult {
  id: string
  requirement_id: string
  listing_id: string
  score: number
  score_breakdown: Record<string, number> | null
  distance_km: number | null
  status: "suggested" | "viewed" | "dismissed" | "contacted"
  created_at: string
  listing?: WasteListing
}

export interface Offer {
  id: string
  listing_id: string
  buyer_company_id: string
  supplier_company_id: string
  created_by: string | null
  offered_price: number
  quantity: number
  quantity_unit: string
  currency: string
  message: string | null
  status: OfferStatus
  parent_offer_id: string | null
  is_counter: boolean
  created_at: string
  updated_at: string
  listing?: WasteListing
  buyer?: Company
  supplier?: Company
}

export interface Transaction {
  id: string
  offer_id: string | null
  listing_id: string
  buyer_company_id: string
  supplier_company_id: string
  material_name: string
  quantity: number
  quantity_unit: string
  agreed_price: number
  currency: string
  total_value: number
  status: TransactionStatus
  co2_saved_kg: number | null
  waste_diverted_kg: number | null
  created_at: string
  updated_at: string
  listing?: WasteListing
  buyer?: Company
  supplier?: Company
}

export interface Conversation {
  id: string
  listing_id: string | null
  buyer_company_id: string
  supplier_company_id: string
  last_message_at: string
  created_at: string
  listing?: WasteListing
  buyer?: Company
  supplier?: Company
  messages?: Message[]
  last_message?: Message | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_company_id: string | null
  body: string
  read_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  link: string | null
  data: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}
