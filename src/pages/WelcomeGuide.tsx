/**
 * WelcomeGuide — Apple/Headspace-style explainer screens shown on first login.
 * Walks new users through Pulse's four core features before onboarding questions.
 *
 * Design: Full-screen slides with large icon, headline, description.
 * Swipeable on mobile, arrow keys on desktop. Progress dots at bottom.
 */
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Compass,
  Activity,
  MessageCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { COLOR, FONT } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";
import Logo from "../components/Logo";

interface Slide {
  icon: React.ReactNode;
  color: string;
  tint: string;
  title: string;
  subtitle: string;
  bullets: string[];
}

const SLIDES: Slide[] = [
  {
    icon: <Calendar size={44} strokeWidth={1.5} />,
    color: "#1C3A6E",
    tint: "#EEF2FF",
    title: "Your campus events hub",
    subtitle: "Create, discover, and RSVP to everything happening at ISB.",
    bullets: [
      "Host events in seconds — sports, sessions, parties, anything",
      "Browse what's happening today and this week",
      "RSVP and get reminders so you never miss out",
    ],
  },
  {
    icon: <Compass size={44} strokeWidth={1.5} />,
    color: "#059669",
    tint: "#ECFDF5",
    title: "Discover places near campus",
    subtitle: "Restaurants, cafes, weekend trips — curated by your cohort.",
    bullets: [
      "Find the best food spots, cafes, and getaways near Mohali",
      "See Google ratings and reviews from fellow ISB students",
      "One tap to get directions on Google Maps",
    ],
  },
  {
    icon: <Activity size={44} strokeWidth={1.5} />,
    color: "#D97706",
    tint: "#FFFBEB",
    title: "Campus heatmap",
    subtitle: "See where the crowd is — in real time.",
    bullets: [
      "Live density view of campus spots: gym, Sarover, library, MPH",
      "Decide if it's too crowded before you walk over",
      "Opt in or out of location sharing anytime",
    ],
  },
  {
    icon: <MessageCircle size={44} strokeWidth={1.5} />,
    color: "#7C3AED",
    tint: "#F5F3FF",
    title: "Pulse Bot on WhatsApp",
    subtitle: "Post an event in your group — the bot does the rest.",
    bullets: [
      "Share an event in any WhatsApp group where Pulse Bot is added",
      "The bot reads it, parses the details, and DMs you to confirm",
      "One tap to publish it to Pulse — no manual form filling",
    ],
  },
];

type Props = {
  onFinish: () => void;
};

export default function WelcomeGuide({ onFinish }: Props) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = left, 1 = right
  const isLast = current === SLIDES.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      tap();
      onFinish();
      return;
    }
    tap();
    setDirection(1);
    setCurrent((c) => c + 1);
  }, [isLast, onFinish]);

  const goBack = useCallback(() => {
    if (current === 0) return;
    tap();
    setDirection(-1);
    setCurrent((c) => c - 1);
  }, [current]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goBack]);

  // Touch swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX);
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (diff < -50) goNext();
    if (diff > 50) goBack();
    setTouchStart(null);
  }

  const slide = SLIDES[current];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        userSelect: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div style={{
        padding: "20px 24px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Logo height={28} />
        <button
          onClick={() => { tap(); onFinish(); }}
          style={{
            fontFamily: FONT.sans,
            fontSize: 13,
            fontWeight: 600,
            color: COLOR.ink3,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 12px",
          }}
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            {/* Icon badge */}
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 24,
                background: slide.tint,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: slide.color,
                marginBottom: 28,
              }}
            >
              {slide.icon}
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: FONT.serif,
                fontSize: 28,
                fontWeight: 700,
                color: COLOR.ink,
                textAlign: "center",
                lineHeight: 1.2,
                marginBottom: 10,
              }}
            >
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: FONT.sans,
                fontSize: 15,
                color: COLOR.ink2,
                textAlign: "center",
                maxWidth: 340,
                lineHeight: 1.5,
                marginBottom: 28,
              }}
            >
              {slide.subtitle}
            </p>

            {/* Bullets */}
            <div style={{ maxWidth: 360, width: "100%" }}>
              {slide.bullets.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: slide.tint,
                      color: slide.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: FONT.sans,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </div>
                  <p
                    style={{
                      fontFamily: FONT.sans,
                      fontSize: 14,
                      color: COLOR.ink2,
                      lineHeight: 1.5,
                    }}
                  >
                    {b}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav: dots + buttons */}
      <div style={{ padding: "0 24px 32px", flexShrink: 0 }}>
        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? COLOR.navy : COLOR.border,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {current > 0 && (
            <button
              onClick={goBack}
              style={{
                padding: "14px 18px",
                borderRadius: 14,
                background: COLOR.surface,
                border: `1.5px solid ${COLOR.border}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={18} color={COLOR.ink2} />
            </button>
          )}
          <button
            onClick={goNext}
            style={{
              flex: 1,
              padding: 15,
              borderRadius: 14,
              background: isLast ? COLOR.navy : COLOR.navy,
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              fontFamily: FONT.sans,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isLast ? "Get started" : "Next"}
            {isLast ? <ArrowRight size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
