import { useState } from "react";
import { ChevronUp, Lightbulb, Plus } from "lucide-react";
import type { User } from "../types";
import { COLOR } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";

type Props = { user: User };

type Item = {
  id: string;
  title: string;
  desc: string;
  votes: number;
  voted?: boolean;
  tag: string;
};

// Seed placeholder — real items hydrate from Supabase in Day 5.
const SEED: Item[] = [
  {
    id: "a",
    title: "AMA with an IB MD",
    desc: "Would love a candid session on recent hiring trends — pre-placement chat, not a polished talk.",
    tag: "Careers",
    votes: 41,
    voted: true,
  },
  {
    id: "b",
    title: "ISB Mohali × LBS / INSEAD social",
    desc: "Exchange folks have been asking. Let's host a joint mixer off-campus.",
    tag: "Social",
    votes: 27,
  },
  {
    id: "c",
    title: "Product case-crack night",
    desc: "Pick a real startup, 90 min, four teams, one honest critique.",
    tag: "Product",
    votes: 19,
  },
];

export default function PulsePage(_: Props) {
  const [items, setItems] = useState<Item[]>(SEED);

  function toggleVote(id: string) {
    tap();
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, voted: !i.voted, votes: i.votes + (i.voted ? -1 : 1) }
          : i
      )
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: COLOR.bg }}>
      <header className="px-5 md:px-8 pt-10 pb-6 max-w-2xl">
        <p className="t-label mb-2">Wishlist</p>
        <h1 className="t-display mb-1" style={{ fontSize: 32 }}>
          What should <span className="t-italic">actually</span> happen here?
        </h1>
        <p className="t-body max-w-md">
          The ideas your cohort keeps half-saying in the corridor. Upvote the ones you'd show up to.
        </p>
      </header>

      <main className="px-4 md:px-8 max-w-2xl space-y-3">
        {items
          .slice()
          .sort((a, b) => b.votes - a.votes)
          .map((i) => (
            <article key={i.id} className="card">
              <div className="flex items-stretch">
                {/* Vote cell */}
                <button
                  onClick={() => toggleVote(i.id)}
                  className="flex flex-col items-center justify-center px-4 py-4 border-r"
                  style={{
                    borderColor: COLOR.divider,
                    background: i.voted ? COLOR.navyTint : "transparent",
                    minWidth: 72,
                    color: i.voted ? COLOR.navy : COLOR.ink2,
                  }}
                >
                  <ChevronUp size={20} strokeWidth={2} />
                  <span className="font-serif text-lg mt-0.5">{i.votes}</span>
                </button>

                <div className="flex-1 px-5 py-4">
                  <p
                    className="t-label mb-1.5"
                    style={{ color: COLOR.navy }}
                  >
                    {i.tag}
                  </p>
                  <h3 className="t-card-title mb-1.5">{i.title}</h3>
                  <p className="t-body" style={{ fontSize: 13 }}>
                    {i.desc}
                  </p>
                </div>
              </div>
            </article>
          ))}

        <button
          className="card card-hover w-full px-5 py-5 flex items-center gap-3 text-left"
          onClick={() => tap()}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: COLOR.amberTint, color: COLOR.amber }}
          >
            <Plus size={16} strokeWidth={2} />
          </div>
          <div>
            <p
              className="font-semibold"
              style={{ color: COLOR.ink, fontSize: 14 }}
            >
              Suggest an idea
            </p>
            <p className="t-meta" style={{ marginTop: 2 }}>
              Short and specific — one line is plenty.
            </p>
          </div>
          <span className="flex-1" />
          <Lightbulb
            size={18}
            strokeWidth={1.5}
            style={{ color: COLOR.ink3 }}
          />
        </button>
      </main>
    </div>
  );
}
