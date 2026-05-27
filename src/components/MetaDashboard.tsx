import { useState } from "react";
import type { GameMode } from "../types";
import { weapons, usageChartData, weeklyTrendData, trendingSetups, patchChanges } from "../data";
import WeaponTierList from "./WeaponTierList";
import UsageChart from "./UsageChart";
import TrendChart from "./TrendChart";
import WinRateLeaderboard from "./WinRateLeaderboard";
import TrendingSetups from "./TrendingSetups";
import PatchNotes from "./PatchNotes";

const gameModes: GameMode[] = ["All", "FFA", "1v1", "2v2", "Ranked"];

export default function MetaDashboard() {
  const [activeMode, setActiveMode] = useState<GameMode>("All");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-[18px] font-medium text-white">Meta Dashboard</h1>
        <p className="mt-1 text-[12px] text-[#555]">
          Roblox Rivals weapon statistics
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-1">
        {gameModes.map((mode) => (
          <button
            key={mode}
            onClick={() => setActiveMode(mode)}
            className={`rounded-md px-2.5 py-1.5 text-[11px] transition-colors ${
              activeMode === mode
                ? "bg-white text-black"
                : "text-[#555] hover:text-white"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <WeaponTierList weapons={weapons} />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <UsageChart data={usageChartData} />
          <div className="grid gap-4 sm:grid-cols-2">
            <WinRateLeaderboard weapons={weapons} />
            <TrendChart data={weeklyTrendData} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TrendingSetups setups={trendingSetups} />
            <PatchNotes changes={patchChanges} />
          </div>
        </div>
      </div>
    </div>
  );
}
