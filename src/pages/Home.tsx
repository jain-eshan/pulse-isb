import { MapPin, Utensils, Coffee, Mountain } from "lucide-react";
import type { User } from "../types";
import { COLOR, stripGradient } from "../lib/pulseTheme";

type Props = { user: User; onGoingClick: () => void };

// Curated placeholder — real places will hydrate from Supabase in Day 5.
const SAMPLE = [
  {
    id: "1",
    name: "Pal Dhaba",
    category: "Food",
    strip: "#D4621A",
    tint: "#FFF2EA",
    icon: Utensils,
    meta: "12 min from campus · open till 3AM",
    desc: "Legendary late-night dhaba near Sector 70. The butter chicken is non-negotiable.",
    budget: "₹150 – 300",
    tag: "Budget",
    tagBg: "#E8F8EF",
    tagColor: "#1A7A4A",
  },
  {
    id: "2",
    name: "Nik Baker's · Elante",
    category: "Cafe",
    strip: "#8B5E24",
    tint: "#F7EFE4",
    icon: Coffee,
    meta: "20 min · good wifi · quiet corners",
    desc: "Where half your section ends up after lectures. Croissants are the move.",
    budget: "₹350 – 600",
    tag: "Mid",
    tagBg: "#FDF4E0",
    tagColor: "#8B5E00",
  },
  {
    id: "3",
    name: "Kasauli · weekend trip",
    category: "Travel",
    strip: "#1A7A4A",
    tint: "#E8F8EF",
    icon: Mountain,
    meta: "2.5 hr drive · day-trip worthy",
    desc: "The closest you'll get to a proper mountain reset without skipping a class.",
    budget: "₹1,200 – 3,000",
    tag: "Mid",
    tagBg: "#FDF4E0",
    tagColor: "#8B5E00",
  },
];

export default function Home({ user }: Props) {
  const first = user.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen pb-28" style={{ background: COLOR.bg }}>
      <header className="px-5 md:px-8 pt-10 pb-6 max-w-2xl">
        <p className="t-label mb-2">Hey {first}</p>
        <h1 className="t-display mb-1" style={{ fontSize: 32 }}>
          Find <span className="t-italic">your spots.</span>
        </h1>
        <p className="t-body max-w-md">
          Places your cohort actually goes — filtered for distance, vibe, and budget.
        </p>
      </header>

      <main className="px-4 md:px-8 max-w-2xl space-y-3">
        {SAMPLE.map((p) => {
          const Icon = p.icon;
          return (
            <article key={p.id} className="card card-hover">
              <div
                style={{ height: 2, background: stripGradient(p.strip, p.tint) }}
              />
              <div className="px-5 pt-4 pb-5">
                <p className="t-label mb-2" style={{ color: p.strip }}>
                  {p.category} · Mohali
                </p>
                <h3 className="t-card-title mb-2 flex items-center gap-2">
                  <Icon size={16} strokeWidth={1.75} style={{ color: p.strip }} />
                  {p.name}
                </h3>
                <p className="t-body" style={{ fontSize: 13, marginBottom: 10 }}>
                  {p.desc}
                </p>
                <div className="flex items-center gap-3 t-meta mb-3">
                  <MapPin size={13} strokeWidth={1.75} />
                  {p.meta}
                </div>
                <div
                  className="flex items-center justify-between pt-3"
                  style={{ borderTop: `1px solid ${COLOR.divider}` }}
                >
                  <div>
                    <p className="t-label" style={{ marginBottom: 2 }}>
                      Per person
                    </p>
                    <p
                      className="font-serif"
                      style={{ fontSize: 16, color: COLOR.ink }}
                    >
                      {p.budget}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-md"
                    style={{ background: p.tagBg, color: p.tagColor }}
                  >
                    {p.tag}
                  </span>
                </div>
              </div>
            </article>
          );
        })}

        <p className="t-meta text-center pt-4 italic">
          More spots rolling in — seeded with the top 30 after launch.
        </p>
      </main>
    </div>
  );
}
