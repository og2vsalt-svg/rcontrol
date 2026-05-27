import type { Tier } from "../types";

const tierStyles: Record<Tier, string> = {
  "S+": "bg-red-500/10 text-red-400",
  S: "bg-amber-500/10 text-amber-400",
  A: "bg-blue-500/10 text-blue-400",
  B: "bg-cyan-500/10 text-cyan-400",
  C: "bg-white/5 text-[#555]",
};

export default function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${tierStyles[tier]}`}
    >
      {tier}
    </span>
  );
}
