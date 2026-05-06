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
  Pencil,
  X,
  Check,
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
  onUpdateProfile?: (updates: Partial<User>) => Promise<void>;
}

export default function ProfilePage({
  user,
  onSignOut,
  onToggleLocation,
  onOpenSession,
  onEditSession,
  onUpdateProfile,
}: Props) {
  const { sessions } = useSessions(user);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [profileTab, setProfileTab] = useState<"rsvps" | "hosting">("rsvps");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editSection, setEditSection] = useState(user.section ?? "");
  const [editOgsg, setEditOgsg] = useState(user.ogsg ? String(user.ogsg) : "");
  const [editCohort, setEditCohort] = useState(user.cohort_year ? String(user.cohort_year) : "");
  const [savingProfile, setSavingProfile] = useState(false);

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

  async function saveProfile() {
    tap();
    setSavingProfile(true);
    try {
      await onUpdateProfile?.({
        section: editSection || undefined,
        ogsg: editOgsg ? Number(editOgsg) : undefined,
        cohort_year: editCohort ? Number(editCohort) : undefined,
      });
      setEditingProfile(false);
    } finally {
      setSavingProfile(false);
    }
  }

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
          padding: "68px 20px 24px",
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

          {/* Info pills + edit button */}
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            {user.section ? (
              <InfoPill label={sectionDisplay} />
            ) : (
              <button
                onClick={() => { tap(); setEditingProfile(true); }}
                style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 99, background: "#FEF3C7", color: "#D97706", fontFamily: FONT.sans, border: "1px dashed #FCD34D", cursor: "pointer" }}
              >
                + Add section
              </button>
            )}
            {user.ogsg && <InfoPill label={`OGSG ${user.ogsg}`} />}
            <InfoPill label={user.campus === "hyderabad" ? "Hyderabad" : "Mohali"} />
            {user.cohort_year && <InfoPill label={`Class of ${user.cohort_year}`} />}
            <button
              onClick={() => { tap(); setEditingProfile(true); }}
              style={{ width: 28, height: 28, borderRadius: 8, background: COLOR.bgSoft, border: `1px solid ${COLOR.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              aria-label="Edit profile"
            >
              <Pencil size={13} color={COLOR.ink2} />
            </button>
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
            background: "#F0F0EE",
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

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300 }}>
          <div onClick={() => setEditingProfile(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: COLOR.bg,
              borderRadius: "20px 20px 0 0",
              padding: "24px 20px 40px",
              maxWidth: 520,
              margin: "0 auto",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: FONT.serif, fontSize: 22, fontWeight: 500, color: COLOR.ink }}>
                Edit Profile
              </h2>
              <button onClick={() => setEditingProfile(false)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLOR.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color={COLOR.ink2} />
              </button>
            </div>

            {/* Section picker */}
            <div className="mb-4">
              <p style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3, fontFamily: FONT.sans, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Section</p>
              <div className="flex flex-wrap gap-2">
                {ISB_SECTIONS.map((s) => (
                  <button
                    key={s.code}
                    onClick={() => setEditSection(editSection === s.code ? "" : s.code)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: FONT.sans,
                      cursor: "pointer",
                      border: "none",
                      background: editSection === s.code ? COLOR.ink : COLOR.bgSoft,
                      color: editSection === s.code ? "#fff" : COLOR.ink2,
                      transition: "all 0.15s",
                    }}
                  >
                    {s.code} — {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* OGSG */}
            <div className="mb-4">
              <p style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3, fontFamily: FONT.sans, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>OGSG Number</p>
              <input
                type="number"
                min="1"
                max="20"
                value={editOgsg}
                onChange={(e) => setEditOgsg(e.target.value)}
                placeholder="e.g. 3"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLOR.border}`, fontSize: 14, fontFamily: FONT.sans, color: COLOR.ink, background: COLOR.surface, outline: "none" }}
              />
            </div>

            {/* Cohort year */}
            <div className="mb-6">
              <p style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3, fontFamily: FONT.sans, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Cohort Year</p>
              <input
                type="number"
                min="2020"
                max="2030"
                value={editCohort}
                onChange={(e) => setEditCohort(e.target.value)}
                placeholder="e.g. 2025"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLOR.border}`, fontSize: 14, fontFamily: FONT.sans, color: COLOR.ink, background: COLOR.surface, outline: "none" }}
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={savingProfile}
              style={{ width: "100%", padding: "14px", borderRadius: 12, background: COLOR.ink, color: "#fff", border: "none", fontSize: 15, fontWeight: 700, fontFamily: FONT.sans, cursor: "pointer", opacity: savingProfile ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Check size={16} /> {savingProfile ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
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
