// src/lib/sections.ts

export type SectionCode = "G" | "H" | "I" | "J" | "K" | "L";

export const SECTIONS: {
  code: SectionCode;
  name: string;
  color: string;
  tint: string;
}[] = [
  { code: "G", name: "Gladiators", color: "#D4621A", tint: "#FFF2EA" },
  { code: "H", name: "Heralds",    color: "#1C3A6E", tint: "#EEF2FA" },
  { code: "I", name: "Imperials",  color: "#7A5000", tint: "#FDF4E0" },
  { code: "J", name: "Jedi",       color: "#1A7A4A", tint: "#E8F8EF" },
  { code: "K", name: "Knights",    color: "#6B2C5A", tint: "#F4E8F2" },
  { code: "L", name: "Legends",    color: "#3B5BBA", tint: "#E8EDF8" },
];

export function sectionByCode(code: string | null | undefined) {
  if (!code) return null;
  return SECTIONS.find((s) => s.code === code.toUpperCase()) ?? null;
}

export function sectionDisplay(code: string | null | undefined): string {
  return sectionByCode(code)?.name ?? "—";
}
