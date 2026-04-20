import { useState } from "react";
import type { User, Place, PlaceCategory } from "../types";
import { SEED_PLACES } from "../lib/places";
import PlaceCard from "../components/PlaceCard";
import { Search } from "lucide-react";

const CATEGORIES: { key: PlaceCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "food", label: "Food" },
  { key: "cafe", label: "Cafes" },
  { key: "nightlife", label: "Nightlife" },
  { key: "travel", label: "Trips" },
];

interface HomeProps {
  user: User;
  onGoingClick: (place: Place) => void;
}

export default function Home({ user, onGoingClick }: HomeProps) {
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = SEED_PLACES.filter((p) => {
    const matchCategory = category === "all" || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.includes(search.toLowerCase());
    const budgetPer = p.budget_level === "low" ? 300 : p.budget_level === "mid" ? 2000 : 5000;
    const matchBudget = budgetPer <= user.budget_max;
    return matchCategory && matchSearch && matchBudget;
  });

  return (
    <div className="px-5 lg:px-10 py-7 lg:py-10 max-w-6xl mx-auto">
      <header className="mb-7">
        <p className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-2">
          Section {user.section} · Cohort {user.cohort_year}
        </p>
        <h1 className="font-serif text-[32px] lg:text-[40px] leading-[1.05] text-ink">Discover.</h1>
        <p className="font-serif italic text-navy text-[17px] lg:text-[20px] mt-1">Find the moment.</p>
        <p className="text-ink-2 text-sm mt-3 leading-relaxed">
          Curated spots around ISB Mohali, matched to your vibe and budget.
        </p>
      </header>

      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
          <input
            type="text"
            placeholder="Search places or cities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-line rounded-md pl-9 pr-4 py-2.5 text-sm text-ink placeholder-ink-3 focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/10 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-7">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`text-[13px] px-4 py-[7px] rounded-full font-semibold transition-colors border ${
              category === key
                ? "bg-navy text-white border-navy shadow-navy"
                : "bg-surface text-ink-2 border-line hover:border-navy hover:text-navy"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-line rounded-lg bg-surface">
          <p className="font-serif text-[22px] text-ink">No spots match your filters.</p>
          <p className="text-ink-3 text-sm mt-2">Try a different category or widen your budget.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onGoingClick={() => onGoingClick(place)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
