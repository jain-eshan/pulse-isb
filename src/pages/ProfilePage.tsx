import { useState } from "react";
import { CheckCircle2, LogOut, MapPin, MessageCircle, RotateCcw } from "lucide-react";
import type { User } from "../types";
import { INTERESTS } from "../types";
import { COLOR } from "../lib/pulseTheme";
import { sectionByCode } from "../lib/sections";
import Logo from "../components/Logo";

interface Props {
  user: User;
  onSignOut: () => void;
  onToggleLocation: (enabled: boolean) => void;
}

export default function ProfilePage({ user, onSignOut, onToggleLocation }: Props) {
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);

  async function requestLinkCode() {
    setLinkBusy(true);
    try {
      const r = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ user_id: user.id }),
        }
      );
      const { code } = await r.json();
      setLinkCode(code ?? "482 163"); // fallback placeholder during demo
    } catch {
      setLinkCode("482 163"); // demo fallback so the UI path is visible
    } finally {
      setLinkBusy(false);
    }
  }

  const interestLabels = user.interests?.map(
    (id) => INTERESTS.find((i) => i.id === id)?.label ?? id
  ) ?? [];

  return (
    <div
      className="min-h-screen px-5 md:px-8 py-8 max-w-2xl"
      style={{ background: COLOR.bg }}
    >
      <div className="flex items-center justify-between mb-8">
        <Logo height={24} />
        <button
          onClick={() => {
            window.location.search = "?reset=1";
          }}
          className="flex items-center gap-1 t-meta hover:opacity-70"
          title="Reset demo profile"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <h1 className="t-display mb-1" style={{ fontSize: 32 }}>
        {user.name || "You"}
      </h1>
      <p className="t-body mb-8">{user.email}</p>

      {/* Info rows */}
      <div
        className="card mb-6"
        style={{ padding: 0 }}
      >
        <Row label="Campus" value={user.campus === "hyderabad" ? "Hyderabad" : "Mohali"} />
        <Row
          label="Section"
          value={
            user.section
              ? `${sectionByCode(user.section)?.name ?? "Section " + user.section}${user.ogsg ? " · OGSG " + user.ogsg : ""}`
              : "—"
          }
        />
        <Row
          label="Cohort"
          value={user.cohort_year ? `Class of ${user.cohort_year}` : "—"}
        />
        <Row
          label="Interests"
          value={
            interestLabels.length ? (
              <div className="flex flex-wrap gap-1.5 justify-end max-w-[240px]">
                {interestLabels.map((l) => (
                  <span
                    key={l}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: COLOR.navyTint, color: COLOR.navy }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            ) : (
              "—"
            )
          }
          last
        />
      </div>

      {/* WhatsApp linking */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle size={16} strokeWidth={1.75} style={{ color: COLOR.navy }} />
          <p className="t-label">WhatsApp</p>
        </div>

        {user.wa_phone ? (
          <p
            className="flex items-center gap-2 font-semibold"
            style={{ color: "#1A7A4A" }}
          >
            <CheckCircle2 size={16} /> Linked ✓
          </p>
        ) : !linkCode ? (
          <>
            <p className="t-body mb-4">
              Link WhatsApp to RSVP with a single message, and get reminders before your sessions start.
            </p>
            <button
              onClick={requestLinkCode}
              disabled={linkBusy}
              className="btn-primary"
            >
              {linkBusy ? "Generating…" : "Generate link code"}
            </button>
          </>
        ) : (
          <div
            className="rounded-[10px] p-5 mt-2"
            style={{ background: COLOR.navyTint }}
          >
            <p className="t-label mb-2" style={{ color: COLOR.navy }}>
              Valid for 15 minutes
            </p>
            <p
              className="font-serif mb-4"
              style={{
                fontSize: 34,
                letterSpacing: "0.18em",
                color: COLOR.navy,
              }}
            >
              {linkCode}
            </p>
            <p className="t-body" style={{ fontSize: 13 }}>
              DM <strong>Pulse Bot</strong> on WhatsApp with:
            </p>
            <code
              className="inline-block mt-2 px-3 py-1.5 rounded-md text-sm font-mono"
              style={{
                background: "#fff",
                color: COLOR.navy,
                border: `1px solid ${COLOR.border}`,
              }}
            >
              link {linkCode}
            </code>
          </div>
        )}
      </div>

      {/* Location sharing */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={16} strokeWidth={1.75} style={{ color: COLOR.navy }} />
          <p className="t-label">Campus Location</p>
        </div>
        <p className="t-body mb-4">
          Share your approximate location on campus so your cohort can see where the crowd is. Only visible to other Pulse users.
        </p>
        <button
          onClick={() => onToggleLocation(!user.location_sharing)}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-[10px] transition-colors"
          style={{
            background: user.location_sharing ? "#DCFCE7" : COLOR.bg,
            border: `1.5px solid ${user.location_sharing ? "#86EFAC" : COLOR.border}`,
          }}
        >
          {/* Toggle pill */}
          <div
            className="relative flex-shrink-0"
            style={{ width: 40, height: 22 }}
          >
            <div
              className="absolute inset-0 rounded-full transition-colors"
              style={{ background: user.location_sharing ? "#16A34A" : COLOR.borderLight }}
            />
            <div
              className="absolute top-1 rounded-full transition-all"
              style={{
                width: 14, height: 14,
                background: "#fff",
                left: user.location_sharing ? 22 : 4,
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: user.location_sharing ? "#15803D" : COLOR.ink2 }}
          >
            {user.location_sharing ? "Sharing — visible on campus map" : "Not sharing location"}
          </span>
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={onSignOut}
        className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-[10px]"
        style={{
          border: "1.5px solid #FECACA",
          color: "#B91C1C",
          background: "#fff",
        }}
      >
        <LogOut size={14} /> Sign out
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-4"
      style={{
        borderBottom: last ? "none" : `1px solid ${COLOR.divider}`,
      }}
    >
      <span className="t-label">{label}</span>
      <span
        className="text-sm font-semibold text-right"
        style={{ color: COLOR.ink }}
      >
        {value}
      </span>
    </div>
  );
}
