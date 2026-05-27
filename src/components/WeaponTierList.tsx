import type { Weapon, Tier } from "../types";
import TierBadge from "./TierBadge";

interface Props { weapons: Weapon[] }

const tierOrder: Tier[] = ["S+", "S", "A", "B", "C"];

export default function WeaponTierList({ weapons }: Props) {
  const grouped = tierOrder.map((tier) => ({
    tier,
    items: weapons.filter((w) => w.tier === tier),
  }));

  return (
    <div>
      <div className="mb-3 text-[10px] uppercase tracking-wider text-[#444]">
        Tier List
      </div>
      <div className="space-y-2">
        {grouped.map(({ tier, items }) => (
          <div key={tier} className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-2.5">
            <div className="mb-1.5">
              <TierBadge tier={tier} />
            </div>
            <div className="space-y-px">
              {items.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded px-2 py-1 text-[11px] hover:bg-white/[0.02]">
                  <span className="text-[#ccc]">{w.name}</span>
                  <span className={`font-mono text-[10px] ${
                    w.trendDelta > 0 ? "text-green-400" : w.trendDelta < 0 ? "text-red-400" : "text-[#444]"
                  }`}>
                    {w.winRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
