import { sectionByCode } from "../lib/sections";

export default function SectionPill({
  code,
  size = "sm",
}: {
  code: string | null | undefined;
  size?: "sm" | "md";
}) {
  const s = sectionByCode(code);
  if (!s) return null;
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";
  const fontSize = size === "sm" ? 10 : 11;
  return (
    <span
      className={`inline-block rounded-full font-semibold ${padding}`}
      style={{ background: s.tint, color: s.color, fontSize, letterSpacing: 0.3 }}
    >
      {s.name}
    </span>
  );
}
