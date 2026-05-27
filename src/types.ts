export type Tier = "S+" | "S" | "A" | "B" | "C";
export type GameMode = "All" | "FFA" | "1v1" | "2v2" | "Ranked";
export type SortOption = "popular" | "newest";
export type ConfigMode = "FFA" | "1v1" | "2v2" | "Ranked" | "All";
export type SoftwareType = "kiciav3" | "unnamed";

export interface Weapon {
  id: string;
  name: string;
  tier: Tier;
  pickRate: number;
  winRate: number;
  category: "Primary" | "Secondary" | "Melee" | "Utility";
  trending: "up" | "down" | "stable";
  trendDelta: number;
  note?: string;
}

export interface TrendingSetup {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  melee: string;
  utility: string;
  pickRate: number;
  winRate: number;
  trend: "up" | "down" | "stable";
}

export interface PatchChange {
  id: string;
  date: string;
  weapon: string;
  change: string;
  type: "buff" | "nerf" | "rework";
}

export interface Config {
  id: string;
  name: string;
  author: string;
  authorId: string;
  mode: ConfigMode;
  software: SoftwareType;
  description: string;
  settings: string[];
  votes: number;
  createdAt: string;
  voted?: boolean;
  filename?: string;
  jsonContent?: string;
}

export interface UsageDataPoint {
  name: string;
  pickRate: number;
  winRate: number;
}

export interface UserProfile {
  id: string;
  username: string;
  joinedAt: string;
  banned: boolean;
  role: "owner" | "admin" | "user";
}

export interface SiteSettings {
  announcement: string;
  configsEnabled: boolean;
  registrationOpen: boolean;
}
