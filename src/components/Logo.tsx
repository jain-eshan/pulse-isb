import { COLOR } from "../lib/pulseTheme";

type Props = {
  height?: number;
  /** Override color — defaults to navy + amber. */
  navy?: string;
  amber?: string;
  className?: string;
};

/**
 * Pulse wordmark — Concept A from the brand kit.
 * "P" + amber EKG spike + "ULSE" in Plus Jakarta Sans Extra-Bold.
 */
export default function Logo({
  height = 32,
  navy = COLOR.navy,
  amber = COLOR.amber,
  className,
}: Props) {
  return (
    <svg
      viewBox="0 0 248 54"
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Pulse"
    >
      <text
        x="0"
        y="42"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight={800}
        fontSize={44}
        fill={navy}
      >
        P
      </text>
      <path
        d="M32,30 L38,30 L42,12 L48,50 L52,30 L58,30"
        stroke={amber}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="63"
        y="42"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight={800}
        fontSize={44}
        fill={navy}
      >
        ULSE
      </text>
    </svg>
  );
}

/** Compact mark for nav / favicon usage — just the P + spike. */
export function LogoMark({
  size = 32,
  navy = COLOR.navy,
  amber = COLOR.amber,
}: { size?: number; navy?: string; amber?: string }) {
  return (
    <svg
      viewBox="0 0 58 54"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Pulse"
    >
      <text
        x="0"
        y="42"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontWeight={800}
        fontSize={44}
        fill={navy}
      >
        P
      </text>
      <path
        d="M32,30 L38,30 L42,12 L48,50 L52,30 L58,30"
        stroke={amber}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
