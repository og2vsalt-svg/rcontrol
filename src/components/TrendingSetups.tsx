import type { TrendingSetup } from "../types";

export default function TrendingSetups({
  setups,
}: {
  setups: TrendingSetup[];
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-[#444]">
        Popular Loadouts
      </div>
      <div className="space-y-2">
        {setups.map((s) => (
          <div
            key={s.id}
            className="rounded-md border border-white/[0.04] p-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#ccc]">{s.name}</span>
              <span
                className={`text-[9px] ${
                  s.trend === "up"
                    ? "text-green-400"
                    : s.trend === "down"
                    ? "text-red-400"
                    : "text-[#444]"
                }`}
              >
                {s.trend === "up" ? "↑" : s.trend === "down" ? "↓" : "—"}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1 text-[9px] text-[#555]">
              {[s.primary, s.secondary, s.melee, s.utility].map((item) => (
                <span
                  key={item}
                  className="rounded bg-white/[0.03] px-1 py-0.5"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-1.5 flex gap-3 text-[9px] text-[#555]">
              <span>{s.pickRate}% pick</span>
              <span>{s.winRate}% WR</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
