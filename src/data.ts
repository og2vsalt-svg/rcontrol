import type { Weapon, TrendingSetup, PatchChange, UsageDataPoint } from "./types";

export const weapons: Weapon[] = [
  // S+ tier
  { id: "1", name: "Permafrost", tier: "S+", pickRate: 31.2, winRate: 68.4, category: "Primary", trending: "up", trendDelta: 4.1, note: "2-burst freeze, broken rn" },
  { id: "2", name: "Scythe", tier: "S+", pickRate: 42.8, winRate: 64.1, category: "Melee", trending: "stable", trendDelta: 0.3, note: "Dash is too good" },
  { id: "3", name: "Katana", tier: "S+", pickRate: 38.5, winRate: 63.7, category: "Melee", trending: "up", trendDelta: 2.8, note: "Bullet deflect" },
  { id: "4", name: "Uzi", tier: "S+", pickRate: 36.1, winRate: 61.2, category: "Secondary", trending: "stable", trendDelta: 0.5 },
  // S tier
  { id: "5", name: "Assault Rifle", tier: "S", pickRate: 44.3, winRate: 59.8, category: "Primary", trending: "stable", trendDelta: -0.2, note: "Free & still meta" },
  { id: "6", name: "Paintball Gun", tier: "S", pickRate: 22.4, winRate: 62.3, category: "Primary", trending: "up", trendDelta: 3.5, note: "Insane fire rate" },
  { id: "7", name: "Sniper", tier: "S", pickRate: 18.9, winRate: 58.1, category: "Primary", trending: "down", trendDelta: -1.2 },
  { id: "8", name: "Freeze Ray", tier: "S", pickRate: 15.7, winRate: 57.4, category: "Utility", trending: "up", trendDelta: 5.7, note: "CC is king" },
  // A tier
  { id: "9", name: "Burst Rifle", tier: "A", pickRate: 19.3, winRate: 55.2, category: "Primary", trending: "down", trendDelta: -2.8, note: "Nerfed in Lucky Update" },
  { id: "10", name: "Shotgun", tier: "A", pickRate: 16.8, winRate: 56.9, category: "Primary", trending: "stable", trendDelta: 0.4 },
  { id: "11", name: "Revolver", tier: "A", pickRate: 21.2, winRate: 53.1, category: "Secondary", trending: "stable", trendDelta: -0.6 },
  { id: "12", name: "Flamethrower", tier: "A", pickRate: 11.4, winRate: 54.2, category: "Primary", trending: "down", trendDelta: -1.5 },
  { id: "13", name: "Medkit", tier: "A", pickRate: 28.6, winRate: 55.8, category: "Utility", trending: "stable", trendDelta: 0.1 },
  { id: "14", name: "Molotov", tier: "A", pickRate: 14.2, winRate: 52.3, category: "Utility", trending: "up", trendDelta: 1.9 },
  // B tier
  { id: "15", name: "RPG", tier: "B", pickRate: 9.8, winRate: 50.1, category: "Primary", trending: "stable", trendDelta: 0.2 },
  { id: "16", name: "Crossbow", tier: "B", pickRate: 7.3, winRate: 49.6, category: "Secondary", trending: "down", trendDelta: -0.9 },
  { id: "17", name: "Minigun", tier: "B", pickRate: 8.1, winRate: 48.8, category: "Primary", trending: "up", trendDelta: 1.1 },
  { id: "18", name: "Knife", tier: "B", pickRate: 12.4, winRate: 47.2, category: "Melee", trending: "down", trendDelta: -1.7 },
  { id: "19", name: "War Horn", tier: "B", pickRate: 10.5, winRate: 51.4, category: "Utility", trending: "stable", trendDelta: 0.0 },
  // C tier
  { id: "20", name: "Grenade Launcher", tier: "C", pickRate: 4.2, winRate: 43.1, category: "Primary", trending: "down", trendDelta: -2.3 },
  { id: "21", name: "Fists", tier: "C", pickRate: 8.9, winRate: 38.4, category: "Melee", trending: "down", trendDelta: -0.5 },
  { id: "22", name: "Energy Pistols", tier: "C", pickRate: 5.6, winRate: 41.7, category: "Secondary", trending: "down", trendDelta: -3.1 },
];

export const trendingSetups: TrendingSetup[] = [
  {
    id: "1", name: "Perma Rush",
    primary: "Permafrost", secondary: "Uzi", melee: "Scythe", utility: "Molotov",
    pickRate: 14.2, winRate: 71.3, trend: "up",
  },
  {
    id: "2", name: "F2P King",
    primary: "Assault Rifle", secondary: "Revolver", melee: "Katana", utility: "Medkit",
    pickRate: 18.7, winRate: 62.4, trend: "stable",
  },
  {
    id: "3", name: "Sniper Setup",
    primary: "Sniper", secondary: "Revolver", melee: "Scythe", utility: "Medkit",
    pickRate: 8.3, winRate: 59.1, trend: "down",
  },
  {
    id: "4", name: "Paintball Aggro",
    primary: "Paintball Gun", secondary: "Uzi", melee: "Scythe", utility: "Molotov",
    pickRate: 11.1, winRate: 65.8, trend: "up",
  },
  {
    id: "5", name: "RPG Troll",
    primary: "RPG", secondary: "Daggers", melee: "Knife", utility: "War Horn",
    pickRate: 6.4, winRate: 52.1, trend: "stable",
  },
];

export const patchChanges: PatchChange[] = [
  { id: "1", date: "Mar 2026", weapon: "Burst Rifle", change: "Body damage nerfed 20 → 18 in Lucky Update", type: "nerf" },
  { id: "2", date: "Mar 2026", weapon: "Assault Rifle", change: "Fire rate buffed 0.11s → 0.10s, damage adjusted 13 → 12", type: "rework" },
  { id: "3", date: "Feb 2026", weapon: "Permafrost", change: "Freeze duration slightly reduced, still dominant", type: "nerf" },
  { id: "4", date: "Feb 2026", weapon: "Scythe", change: "Dash distance unchanged despite community requests", type: "rework" },
  { id: "5", date: "Jan 2026", weapon: "Shotgun", change: "Spread tightened, more consistent at close range", type: "buff" },
  { id: "6", date: "Jan 2026", weapon: "Flamethrower", change: "Range reduced, DPS remains same", type: "nerf" },
];

export const usageChartData: UsageDataPoint[] = [
  { name: "AR", pickRate: 44.3, winRate: 59.8 },
  { name: "Scythe", pickRate: 42.8, winRate: 64.1 },
  { name: "Katana", pickRate: 38.5, winRate: 63.7 },
  { name: "Uzi", pickRate: 36.1, winRate: 61.2 },
  { name: "Perma", pickRate: 31.2, winRate: 68.4 },
  { name: "Medkit", pickRate: 28.6, winRate: 55.8 },
  { name: "PB Gun", pickRate: 22.4, winRate: 62.3 },
  { name: "Revolver", pickRate: 21.2, winRate: 53.1 },
];

export const weeklyTrendData = [
  { day: "Mon", pickRate: 29, winRate: 61 },
  { day: "Tue", pickRate: 31, winRate: 63 },
  { day: "Wed", pickRate: 30, winRate: 62 },
  { day: "Thu", pickRate: 33, winRate: 65 },
  { day: "Fri", pickRate: 36, winRate: 67 },
  { day: "Sat", pickRate: 41, winRate: 69 },
  { day: "Sun", pickRate: 38, winRate: 68 },
];
