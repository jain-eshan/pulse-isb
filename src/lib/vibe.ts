import type { VibeTag, VibeMeterPersona } from "../types";

const personaMap: Array<{ tags: VibeTag[]; persona: VibeMeterPersona; color: string }> = [
  { tags: ["Party Animal", "Night Owl"], persona: "Night Owl Explorer", color: "#4A3ADB" },
  { tags: ["Foodie", "Explorer"], persona: "Foodie Adventurer", color: "#D4621A" },
  { tags: ["Budget Backpacker", "Explorer"], persona: "Budget Backpacker", color: "#1A7A4A" },
  { tags: ["Luxury Seeker"], persona: "Luxury Seeker", color: "#C47D0E" },
  { tags: ["Chill"], persona: "Chill Wanderer", color: "#3B82F6" },
  { tags: ["Party Animal", "Explorer"], persona: "Party Explorer", color: "#EC4899" },
  { tags: ["Culture Vulture", "Foodie"], persona: "Culture Foodie", color: "#D4621A" },
];

export function getPersona(tags: VibeTag[]): { persona: VibeMeterPersona; color: string } {
  for (const entry of personaMap) {
    if (entry.tags.every((t) => tags.includes(t))) {
      return { persona: entry.persona, color: entry.color };
    }
  }
  return { persona: "The Adventurer", color: "#1C3A6E" };
}

export function getVibeScore(tags: VibeTag[]): number {
  const scores: Record<VibeTag, number> = {
    "Party Animal": 95,
    "Night Owl": 88,
    "Explorer": 82,
    "Foodie": 78,
    "Culture Vulture": 72,
    "Budget Backpacker": 68,
    "Chill": 60,
    "Luxury Seeker": 85,
  };
  if (tags.length === 0) return 50;
  return Math.round(tags.reduce((sum, t) => sum + (scores[t] ?? 70), 0) / tags.length);
}
