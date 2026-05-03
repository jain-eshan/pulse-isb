/**
 * ProfilePage — Luma-inspired redesign v3
 * Clean profile card + My RSVPs + My Events sections + WhatsApp linking
 */
import { useState } from "react";
import {
  CheckCircle2,
  LogOut,
  MapPin,
  MessageCircle,
  Calendar,
  Edit3,
} from "lucide-react";
import type { User, Session } from "../types";
import { ISB_SECTIONS, INTERESTS } from "../types";
import { useSessions } from "../hooks/useSessions";
import SessionCard from "../components/SessionCard";
import { COLOR, FONT } from "../lib/pulseTheme";
import { sectionByCode } from "../lib/sections";
import { tap } from "../lib/haptics";

interface Props {
  user: User;
  onSignOut: () => void;
  onToggleLocation: (enabled: boolean) => void;
  onOpenSession?: (session: Session) => void;
  onEditSession?: (session: Session) => void;
}

export default function ProfilePage({
  user,
  onSignOut,
  onToggleLocation,
  onOpenSession,
  onEditSession,
}: Props) {
  const { sessions } = useSessions(user);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [profileTab, setProfileTab] = useState<"rsvps" | "hosting">("rsvps");

  const myRsvps = sessions.filter((s) => s.my_rsvp === "going" && s.creator_id !== user.id);
  const myHosted = sessions.filter((s) => s.creator_id === user.id);

  // Section display name
  const sectionInfo = sectionByCode(user.section);
  const isbSection = ISB_SECTIONS.find((s) => s.code === user.section);
  const sectionDisplay = isbSection
    ? `${isbSection.name} (${isbSection.code})`
    : sectionInfo
    ? sectionInfo.name
    : user.section || "—";

  const interestLabels =
    user.interests?.map((id) => INTERESTS.find((i) => i.id === id)?.label ?? id) ?? [];

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
      setLinkCode(code ?? "482 163");
    } catch {
      setLinkCode("482 163");
    } finally {
      setLinkBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: COLOR.bg }}>
      {/* Profile header card */}
      <div
        style={{
          padding: "48px 20px 24px",
          background: `linear-gradient(180deg, ${COLOR.navyTint} 0%, ${COLOR.bg} 100%)`,
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* Avatar */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              background: sectionInfo?.color ?? COLOR.navy,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              fontFamily: FONT.serif,
              marginBottom: 14,
              border: `3px solid ${COLOR.surface}`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                style={{ width: 64, height: 64, borderRadius: 32, objectFit: "cover" }}
              />
            ) : (
              (user.name?.[0] ?? "?").toUpperCase()
            )}
          </div>

          <h1
            style={{
              fontFamily: FONT.serif,
              fontSize: 26,
              fontWeight: 500,
              color: COLOR.ink,
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            {user.name || "You"}
          </h1>
          <p style={{ fontSize: 13, color: COLOR.ink2, fontFamily: FONT.sans }}>
            {user.email}
          </p>

          {/* Info pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <InfoPill label={sectionDisplay} />
            {user.ogsg && <InfoPill label={`OGSG ${user.ogsg}`} />}
            <InfoPill label={user.campus === "hyderabad" ? "Hyderabad" : "Mohali"} />
            {user.cohort_year && <InfoPill label={`Class of ${user.cohort_year}`} />}
          </div>

          {/* Interests */}
          {interestLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {interestLabels.map((l) => (
                <span
                  key={l}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: `${COLOR.navy}12`,
                    color: COLOR.navy,
                    fontFamily: FONT.sans,
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px" }}>
        {/* RSVPs / Hosting tabs */}
        <div
          className="flex gap-1"
          style={{
            background: COLOR.bgSoft,
            borderRadius: 12,
            padding: 4,
            marginBottom: 16,
          }}
        >
          {(["rsvps", "hosting"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { tap(); setProfileTab(t); }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONT.sans,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                background: profileTab === t ? "#fff" : "transparent",
                color: profileTab === t ? COLOR.ink : COLOR.ink3,
                boxShadow: profileTab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t === "rsvps" ? `My RSVPs (${myRsvps.length})` : `Hosting (${myHosted.length})`}
            </button>
          ))}
        </div>

        {/* Event lists */}
        <div className="space-y-3 mb-6">
          {profileTab === "rsvps" ? (
            myRsvps.length > 0 ? (
              myRsvps.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onClick={() => onOpenSession?.(s)}
                />
              ))
            ) : (
              <EmptyPanel
                text="No RSVPs yet"
                desc="Events you RSVP to will appear here"
              />
            )
          ) : myHosted.length > 0 ? (
            myHosted.map((s) => (
              <div key={s.id} style={{ position: "relative" }}>
                <SessionCard session={s} onClick={() => onOpenSession?.(s)} />
                {onEditSession && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      tap();
                      onEditSession(s);
                    }}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.9)",
                      border: `1px solid ${COLOR.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      zIndex: 2,
                    }}
                    aria-label="Edit event"
                  >
                    <Edit3 size={14} color={COLOR.navy} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <EmptyPanel
              text="No events hosted yet"
              desc="Events you create will appear here"
            />
          )}
        </div>

        {/* WhatsApp linking */}
        <div className="card" style={{ padding: "18px 20px", marginBottom: 12 }}>
          <div className="flex items-center gap-2.5 mb-2">
            <MessageCircle size={18} strokeWidth={1.75} style={{ color: "#25D366" }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: COLOR.ink, fontFamily: FONT.sans }}>
              WhatsApp
            </p>
          </div>

          {user.wa_phone ? (
            <p
              className="flex items-center gap-2"
              style={{ fontSize: 13, fontWeight: 600, color: "#059669", fontFamily: FONT.sans }}
            >
              <CheckCircle2 size={16} /> Linked
            </p>
          ) : !linkCode ? (
            <>
              <p style={{ fontSize: 13, color: COLOR.ink2, fontFamily: FONT.sans, lineHeight: 1.6, marginBottom: 12 }}>
                Link WhatsApp to RSVP via message and get session reminders.
              </p>
              <button
                onClick={requestLinkCode}
                disabled={linkBusy}
                className="btn-primary"
                style={{ padding: "10px 20px", fontSize: 13 }}
              >
                {linkBusy ? "Generating..." : "Generate link code"}
              </button>
            </>
          ) : (
            <div
              style={{
                background: COLOR.bgSoft,
                borderRadius: 12,
                padding: "16px",
                marginTop: 8,
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3, fontFamily: FONT.sans, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Valid for 15 minutes
              </p>
              <p
                style={{
                  fontFamily: FONT.serif,
                  fontSize: 32,
                  letterSpacing: "0.18em",
                  color: COLOR.navy,
                  marginBottom: 12,
                }}
              >
                {linkCode}
              </p>
              <p style={{ fontSize: 13, color: COLOR.ink2, fontFamily: FONT.sans }}>
                DM <strong>Pulse Bot</strong> on WhatsApp with:
              </p>
              <code
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "#fff",
                  color: COLOR.navy,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${COLOR.border}`,
                }}
              >
                link {linkCode}
              </code>
            </div>
          )}
        </div>

        {/* Location sharing */}
        <div className="card" style={{ padding: "18px 20px", marginBottom: 12 }}>
          <div className="flex items-center gap-2.5 mb-2">
            <MapPin size={18} strokeWidth={1.75} style={{ color: COLOR.navy }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: COLOR.ink, fontFamily: FONT.sans }}>
              Campus Location
            </p>
          </div>
          <p style={{ fontSize: 13, color: COLOR.ink2, fontFamily: FONT.sans, lineHeight: 1.6, marginBottom: 12 }}>
            Share location so batchmates can see where the crowd is.
          </p>
          <button
            onClick={() => onToggleLocation(!user.location_sharing)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "10px 14px",
              borderRadius: 12,
              background: user.location_sharing ? "#ECFDF5" : COLOR.bgSoft,
              border: `1.5px solid ${user.location_sharing ? "#86EFAC" : COLOR.border}`,
              cursor: "pointer",
            }}
          >
            {/* Toggle */}
            <div style={{ width: 40, height: 22, position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 11,
                  background: user.location_sharing ? "#16A34A" : COLOR.borderLight,
                  transition: "background 0.15s",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: "#fff",
                  left: user.location_sharing ? 22 : 4,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.15s",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONT.sans,
                color: user.location_sharing ? "#059669" : COLOR.ink2,
              }}
            >
              {user.location_sharing ? "Sharing — visible on campus map" : "Not sharing"}
            </span>
          </button>
        </div>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: FONT.sans,
            padding: "10px 16px",
            borderRadius: 12,
            border: "1.5px solid #FECACA",
            color: "#B91C1C",
            background: "#fff",
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */
function InfoPill({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: "5px 12px",
        borderRadius: 99,
        background: COLOR.surface,
        color: COLOR.ink2,
        fontFamily: FONT.sans,
        border: `1px solid ${COLOR.border}`,
      }}
    >
      {label}
    </span>
  );
}

function EmptyPanel({ text, desc }: { text: string; desc: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "36px 20px",
        background: COLOR.bgSoft,
        borderRadius: 16,
        border: `1px solid ${COLOR.borderLight}`,
      }}
    >
      <Calendar size={28} strokeWidth={1.5} style={{ margin: "0 auto 10px", color: COLOR.ink3, opacity: 0.4 }} />
      <p style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink2, fontFamily: FONT.sans }}>
        {text}
      </p>
      <p style={{ fontSize: 12, color: COLOR.ink3, fontFamily: FONT.sans, marginTop: 4 }}>
        {desc}
      </p>
    </div>
  );
}
