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
  interests: Interest[];
  wa_phone?: string;
  campus: "mohali" | "hyderabad";
  ogsg?: number;
  vibe_friday?: string;
  chaotic_thing?: string;
  onboarded_at?: string;
  is_admin?: boolean;
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
  google_rating?: number;
  review_count?: number;
  created_at: string;
}

export interface PlaceReview {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;          // 1-5 stars
  comment?: string;
  created_at: string;
  user?: Pick<User, "id" | "name" | "avatar_url">;
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

export type Interest =
  | "product"
  | "consulting"
  | "tech"
  | "careers"
  | "academics"
  | "social";

export const INTERESTS: { id: Interest; label: string; emoji: string }[] = [
  { id: "product",    label: "Product",    emoji: "💡" },
  { id: "consulting", label: "Consulting", emoji: "📊" },
  { id: "tech",       label: "Tech",       emoji: "🤖" },
  { id: "careers",    label: "Careers",    emoji: "🎯" },
  { id: "academics",  label: "Academics",  emoji: "📚" },
  { id: "social",     label: "Social",     emoji: "🎭" },
];

export type EventCategory = "Sports" | "Social" | "Professional";

export interface Session {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  venue?: string;
  tags: string[];
  category?: EventCategory;
  subcategory?: string;
  cover_image_url?: string;
  wa_event_id?: string;
  wa_group_jid?: string;
  archived: boolean;
  created_at: string;
  visible_to_sections?: string[];
  visible_to_ogsgs?: string[];
  creator?: Pick<User, "id" | "name" | "avatar_url" | "section">;
  rsvp_counts?: { going: number; maybe: number };
  my_rsvp?: RsvpStatus;
}

export type RsvpStatus = "going" | "maybe" | "cant";

export interface Rsvp {
  session_id: string;
  user_id: string;
  status: RsvpStatus;
  responded_via: "web" | "wa_native_event" | "bot_dm" | "calendar";
  created_at: string;
}

export interface PulseItem {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  tags: string[];
  status: "open" | "planned" | "done";
  linked_session_id?: string;
  created_at: string;
  vote_count?: number;
  my_vote?: boolean;
}

// ── ISB Section & OGSG constants ─────────────────────────────
export const ISB_SECTIONS = [
  { code: "G", name: "Gladiators" },
  { code: "H", name: "Heralds" },
  { code: "I", name: "Imperials" },
  { code: "J", name: "Jedi" },
  { code: "K", name: "Knights" },
  { code: "L", name: "Legends" },
] as const;

export type SectionCode = (typeof ISB_SECTIONS)[number]["code"];

export type VibeMeterPersona =
  | "Night Owl Explorer"
  | "Foodie Adventurer"
  | "Budget Backpacker"
  | "Luxury Seeker"
  | "Chill Wanderer"
  | "Party Explorer"
  | "Culture Foodie"
  | "The Adventurer";
