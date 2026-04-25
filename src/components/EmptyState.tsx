import type { LucideIcon } from "lucide-react";
import { COLOR } from "../lib/pulseTheme";

type Props = {
  /** Lucide icon component (e.g. `Calendar`). */
  icon?: LucideIcon;
  title: string;
  desc: string;
  cta?: React.ReactNode;
};

export default function EmptyState({ icon: Icon, title, desc, cta }: Props) {
  return (
    <div className="card p-10 text-center">
      {Icon && (
        <div
          className="mx-auto mb-5 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: COLOR.navyTint, color: COLOR.navy }}
        >
          <Icon size={22} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="t-heading mb-2">{title}</h3>
      <p className="t-body mb-6 max-w-xs mx-auto">{desc}</p>
      {cta}
    </div>
  );
}
