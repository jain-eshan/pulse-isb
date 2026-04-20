export type VibeTag =
  | "Party Animal"
  | "Foodie"
  | "Explorer"
  | "Chill"
  | "Budget Backpacker"
  | "Luxury Seeker"
  | "Night Owl"
  | "Culture Vulture";

export type PlaceCategory = "food" | "nightlife" | "travel" | "cafe";
export type BudgetLevel = "low" | "mid" | "high";
export type PlaceCity = "mohali" | "chandigarh" | "shimla" | "kasauli" | "dharamshala" | "panchkula" | "manali";

export interface User {
  id: string;
  microsoft_id: string;
  name: string;
  email: string;
  section: string;
  cohort_year: number;
  vibe_tags: VibeTag[];
  budget_min: number;
  budget_max: number;
  location_sharing: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  city: PlaceCity;
  budget_level: BudgetLevel;
  budget_per_person: string;
  vibe_tags: VibeTag[];
  description: string;
  google_maps_url: string;
  image_url?: string;
  distance_from_campus?: string;
  created_at: string;
}

export interface Going {
  id: string;
  user_id: string;
  place_id: string;
  going_at: string;
  note?: string;
  is_active: boolean;
  created_at: string;
  user?: User;
  place?: Place;
}

export interface UserLocation {
  user_id: string;
  lat: number;
  lng: number;
  updated_at: string;
}

export type VibeMeterPersona =
  | "Night Owl Explorer"
  | "Foodie Adventurer"
  | "Budget Backpacker"
  | "Luxury Seeker"
  | "Chill Wanderer"
  | "Party Explorer"
  | "Culture Foodie"
  | "The Adventurer";
