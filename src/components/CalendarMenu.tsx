import { useEffect, useRef, useState } from "react";
import { Calendar, Check, ChevronDown } from "lucide-react";
import { COLOR } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";
import {
  googleCalendarUrl,
  outlookCalendarUrl,
  office365CalendarUrl,
  downloadIcs,
} from "../lib/ics";

interface IcsEvent {
  id: string;
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  venue?: string;
  url?: string;
}

interface Props {
  event: IcsEvent;
  variant?: "primary" | "ghost";
  fullWidth?: boolean;
}

export default function CalendarMenu({ event, variant = "ghost", fullWidth }: Props) {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function flashAdded() {
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  function pick(provider: "google" | "outlook" | "office365" | "apple") {
    tap();
    setOpen(false);
    if (provider === "google") {
      window.open(googleCalendarUrl(event), "_blank", "noopener,noreferrer");
    } else if (provider === "outlook") {
      window.open(outlookCalendarUrl(event), "_blank", "noopener,noreferrer");
    } else if (provider === "office365") {
      window.open(office365CalendarUrl(event), "_blank", "noopener,noreferrer");
    } else {
      // Apple / iCal / fallback — download .ics; iOS opens it in Calendar.app
      downloadIcs(event);
    }
    flashAdded();
  }

  const buttonClass =
    variant === "primary"
      ? "btn-primary flex items-center justify-center gap-2"
      : "btn-ghost flex items-center justify-center gap-2";

  return (
    <div ref={ref} className={`relative ${fullWidth ? "flex-1" : ""}`}>
      <button
        onClick={() => { tap(); setOpen((o) => !o); }}
        className={buttonClass}
        style={fullWidth ? { width: "100%" } : undefined}
      >
        {added ? <Check size={14} /> : <Calendar size={14} />}
        {added ? "Added" : "Add to calendar"}
        <ChevronDown size={12} style={{ opacity: 0.7 }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 rounded-[12px] overflow-hidden"
          style={{
            background: COLOR.surface,
            border: `1px solid ${COLOR.border}`,
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
            minWidth: 220,
          }}
        >
          <MenuItem icon="📅" label="Google Calendar" onClick={() => pick("google")} />
          <MenuItem icon="📨" label="Outlook (personal)" onClick={() => pick("outlook")} />
          <MenuItem icon="🏢" label="Outlook 365 (work)" onClick={() => pick("office365")} />
          <MenuItem icon="🍎" label="Apple Calendar (.ics)" onClick={() => pick("apple")} last />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  last,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-black/5"
      style={{
        borderBottom: last ? "none" : `1px solid ${COLOR.divider}`,
        fontSize: 13,
        fontWeight: 600,
        color: COLOR.ink,
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  );
}
