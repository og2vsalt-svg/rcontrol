import type { Weapon } from "../types";
import TierBadge from "./TierBadge";

export default function WinRateLeaderboard({ weapons }: { weapons: Weapon[] }) {
  const sorted = [...weapons].sort((a, b) => b.winRate - a.winRate).slice(0, 8);

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-[#444]">
        Win Rate
      </div>
      <div className="space-y-px">
        {sorted.map((w, i) => (
          <div key={w.id} className="flex items-center gap-2.5 rounded px-2 py-1 text-[11px] hover:bg-white/[0.02]">
            <span className="w-4 text-right font-mono text-[9px] text-[#333]">{i + 1}</span>
            <span className="flex-1 text-[#ccc]">{w.name}</span>
            <TierBadge tier={w.tier} />
            <span className="font-mono text-[10px] text-[#888]">{w.winRate}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
