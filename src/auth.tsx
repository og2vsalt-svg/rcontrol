import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { Config, SiteSettings } from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  joinedAt: string;
  banned: boolean;
  role: "owner" | "admin" | "user";
}

interface AuthState {
  user: User | null;
  users: User[];
  configs: Config[];
  settings: SiteSettings;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  isOwner: boolean;
  isAdmin: boolean;
  ownerId: string | null;
  adminIds: string[];
  claimAdmin: () => Promise<boolean>;
  promoteAdmin: (id: string) => Promise<void>;
  demoteAdmin: (id: string) => Promise<void>;
  banUser: (id: string) => Promise<void>;
  unbanUser: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateSettings: (s: Partial<SiteSettings>) => Promise<void>;
  addConfig: (config: Omit<Config, "id" | "author" | "authorId" | "votes" | "createdAt" | "voted">) => Promise<void>;
  voteConfig: (id: string) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  refreshConfigs: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// ─── API Base URL ─────────────────────────────────────────────────────────────
// Since this is a static Vite build without a server, we use a self-contained
// approach: IndexedDB for persistence + BroadcastChannel for cross-tab sync.
// This gives real "server-like" behaviour: all tabs/windows share the same data
// and changes propagate in real time.

// ─── IndexedDB helpers ───────────────────────────────────────────────────────

const DB_NAME = "rcontrol_db";
const DB_VERSION = 3;

type StoreNames = "users" | "configs" | "settings" | "passwords" | "meta" | "votes";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("users"))
        db.createObjectStore("users", { keyPath: "id" });
      if (!db.objectStoreNames.contains("configs"))
        db.createObjectStore("configs", { keyPath: "id" });
      if (!db.objectStoreNames.contains("settings"))
        db.createObjectStore("settings", { keyPath: "key" });
      if (!db.objectStoreNames.contains("passwords"))
        db.createObjectStore("passwords", { keyPath: "username" });
      if (!db.objectStoreNames.contains("meta"))
        db.createObjectStore("meta", { keyPath: "key" });
      if (!db.objectStoreNames.contains("votes"))
        db.createObjectStore("votes", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll<T>(store: StoreNames): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet<T>(store: StoreNames, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(store: StoreNames, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(store: StoreNames, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Simple ID generator ─────────────────────────────────────────────────────

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Default settings ────────────────────────────────────────────────────────

const defaultSettings: SiteSettings = {
  announcement: "",
  configsEnabled: true,
  registrationOpen: true,
};

// ─── BroadcastChannel for cross-tab sync ─────────────────────────────────────

const SYNC_CHANNEL = "rcontrol_sync";

// ─── AuthProvider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Broadcast a sync event to other tabs
  const broadcast = useCallback((type: string) => {
    try {
      channelRef.current?.postMessage({ type });
    } catch {}
  }, []);

  // ── Load from IndexedDB ──────────────────────────────────────────────────

  const loadUsers = useCallback(async () => {
    const all = await dbGetAll<User>("users");
    setUsers(all);
    return all;
  }, []);

  const loadConfigs = useCallback(async () => {
    // Load votes for current user from session
    const sessionUserId = sessionStorage.getItem("rc_user_id");
    const all = await dbGetAll<Config & { id: string }>("configs");
    const votes = sessionUserId
      ? await dbGetAll<{ id: string; userId: string; configId: string }>("votes")
      : [];
    const userVotes = new Set(votes.filter(v => v.userId === sessionUserId).map(v => v.configId));
    const withVoted = all.map(c => ({ ...c, voted: userVotes.has(c.id) }));
    // Sort by date descending
    withVoted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setConfigs(withVoted);
  }, []);

  const loadSettings = useCallback(async () => {
    const pairs = await dbGetAll<{ key: string; value: unknown }>("settings");
    const merged: Record<string, unknown> = { ...defaultSettings };
    for (const p of pairs) merged[p.key] = p.value;
    setSettings(merged as unknown as SiteSettings);
  }, []);

  const loadMeta = useCallback(async (): Promise<{
    ownerId: string | null;
    adminIds: string[];
  }> => {
    const ownerRec = await dbGet<{ key: string; value: string | null }>("meta", "ownerId");
    const adminRec = await dbGet<{ key: string; value: string[] }>("meta", "adminIds");
    return {
      ownerId: ownerRec?.value ?? null,
      adminIds: adminRec?.value ?? [],
    };
  }, []);

  const [ownerId, setOwnerIdState] = useState<string | null>(null);
  const [adminIds, setAdminIdsState] = useState<string[]>([]);

  const refreshAll = useCallback(async () => {
    const [allUsers, meta] = await Promise.all([
      dbGetAll<User>("users"),
      loadMeta(),
    ]);
    setUsers(allUsers);
    setOwnerIdState(meta.ownerId);
    setAdminIdsState(meta.adminIds);
    await loadConfigs();
    await loadSettings();
  }, [loadMeta, loadConfigs, loadSettings]);

  // ── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Restore session
        const savedId = sessionStorage.getItem("rc_user_id");
        const allUsers = await dbGetAll<User>("users");
        setUsers(allUsers);

        const meta = await loadMeta();
        setOwnerIdState(meta.ownerId);
        setAdminIdsState(meta.adminIds);

        if (savedId) {
          const found = allUsers.find(u => u.id === savedId);
          if (found && !found.banned) setUser(found);
          else sessionStorage.removeItem("rc_user_id");
        }

        await loadConfigs();
        await loadSettings();
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMeta, loadConfigs, loadSettings]);

  // ── Cross-tab sync ────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const ch = new BroadcastChannel(SYNC_CHANNEL);
      channelRef.current = ch;
      ch.onmessage = (e) => {
        if (e.data?.type) refreshAll();
      };
      return () => { ch.close(); channelRef.current = null; };
    } catch {
      return () => {};
    }
  }, [refreshAll]);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    const uname = username.trim().toLowerCase();
    if (!uname || !password) return "Enter username and password";

    const pwRec = await dbGet<{ username: string; password: string }>("passwords", uname);
    if (!pwRec) return "Account not found";
    if (pwRec.password !== password) return "Incorrect password";

    const allUsers = await dbGetAll<User>("users");
    const u = allUsers.find(u => u.username === uname);
    if (!u) return "Account not found";
    if (u.banned) return "Account suspended";

    sessionStorage.setItem("rc_user_id", u.id);
    setUser(u);
    await loadConfigs(); // reload so votes are correct for this user
    return null;
  }, [loadConfigs]);

  const register = useCallback(async (username: string, password: string): Promise<string | null> => {
    const settingRec = await dbGet<{ key: string; value: boolean }>("settings", "registrationOpen");
    const regOpen = settingRec !== undefined ? settingRec.value : true;
    const ownerRec = await dbGet<{ key: string; value: string | null }>("meta", "ownerId");
    if (!regOpen && ownerRec?.value !== null) return "Registration is closed";

    const uname = username.trim().toLowerCase();
    if (!uname || !password) return "Enter username and password";
    if (uname.length < 2 || uname.length > 20) return "Username must be 2-20 chars";
    if (!/^[a-z0-9_]+$/.test(uname)) return "Letters, numbers, underscores only";
    if (password.length < 6) return "Password must be at least 6 chars";

    // Check duplicate
    const existing = await dbGet<{ username: string }>("passwords", uname);
    if (existing) return "Username already taken";

    const newId = genId();
    const newUser: User = {
      id: newId,
      username: uname,
      joinedAt: new Date().toISOString().split("T")[0],
      banned: false,
      role: "user",
    };

    await dbPut("users", newUser);
    await dbPut("passwords", { username: uname, password });

    setUsers(prev => [...prev, newUser]);
    sessionStorage.setItem("rc_user_id", newId);
    setUser(newUser);
    await loadConfigs();
    broadcast("users");
    return null;
  }, [loadConfigs, broadcast]);

  const logout = useCallback(() => {
    sessionStorage.removeItem("rc_user_id");
    setUser(null);
    loadConfigs();
  }, [loadConfigs]);

  // ── Admin actions ─────────────────────────────────────────────────────────

  const claimAdmin = useCallback(async (): Promise<boolean> => {
    const ownerRec = await dbGet<{ key: string; value: string | null }>("meta", "ownerId");
    if (ownerRec?.value !== null && ownerRec !== undefined) return false;
    if (!user) return false;
    await dbPut("meta", { key: "ownerId", value: user.id });
    // Update user role
    const updated: User = { ...user, role: "owner" };
    await dbPut("users", updated);
    setUser(updated);
    setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    setOwnerIdState(user.id);
    broadcast("meta");
    return true;
  }, [user, broadcast]);

  const promoteAdmin = useCallback(async (id: string): Promise<void> => {
    if (!user || user.id !== ownerId) return;
    if (id === ownerId) return;
    const target = users.find(u => u.id === id);
    if (!target) return;
    const updated: User = { ...target, role: "admin" };
    await dbPut("users", updated);
    const newAdminIds = adminIds.includes(id) ? adminIds : [...adminIds, id];
    await dbPut("meta", { key: "adminIds", value: newAdminIds });
    setAdminIdsState(newAdminIds);
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
    broadcast("meta");
  }, [user, ownerId, adminIds, users, broadcast]);

  const demoteAdmin = useCallback(async (id: string): Promise<void> => {
    if (!user || user.id !== ownerId) return;
    const target = users.find(u => u.id === id);
    if (!target) return;
    const updated: User = { ...target, role: "user" };
    await dbPut("users", updated);
    const newAdminIds = adminIds.filter(a => a !== id);
    await dbPut("meta", { key: "adminIds", value: newAdminIds });
    setAdminIdsState(newAdminIds);
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
    broadcast("meta");
  }, [user, ownerId, adminIds, users, broadcast]);

  const banUser = useCallback(async (id: string): Promise<void> => {
    if (id === ownerId) return;
    if (adminIds.includes(id) && user?.id !== ownerId) return;
    const target = users.find(u => u.id === id);
    if (!target) return;
    const updated: User = { ...target, banned: true };
    await dbPut("users", updated);
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
    if (user?.id === id) { sessionStorage.removeItem("rc_user_id"); setUser(null); }
    broadcast("users");
  }, [user, ownerId, adminIds, users, broadcast]);

  const unbanUser = useCallback(async (id: string): Promise<void> => {
    const target = users.find(u => u.id === id);
    if (!target) return;
    const updated: User = { ...target, banned: false };
    await dbPut("users", updated);
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
    broadcast("users");
  }, [users, broadcast]);

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    if (id === ownerId) return;
    if (adminIds.includes(id) && user?.id !== ownerId) return;
    const target = users.find(u => u.id === id);
    if (!target) return;
    await dbDelete("users", id);
    await dbDelete("passwords", target.username);
    const newAdminIds = adminIds.filter(a => a !== id);
    await dbPut("meta", { key: "adminIds", value: newAdminIds });
    setAdminIdsState(newAdminIds);
    setUsers(prev => prev.filter(u => u.id !== id));
    if (user?.id === id) { sessionStorage.removeItem("rc_user_id"); setUser(null); }
    broadcast("users");
  }, [user, ownerId, adminIds, users, broadcast]);

  // ── Settings ──────────────────────────────────────────────────────────────

  const updateSettings = useCallback(async (s: Partial<SiteSettings>): Promise<void> => {
    for (const [key, value] of Object.entries(s)) {
      await dbPut("settings", { key, value });
    }
    setSettings(prev => ({ ...prev, ...s }));
    broadcast("settings");
  }, [broadcast]);

  // ── Configs ───────────────────────────────────────────────────────────────

  const addConfig = useCallback(async (
    cfg: Omit<Config, "id" | "author" | "authorId" | "votes" | "createdAt" | "voted">
  ): Promise<void> => {
    if (!user) return;
    const newConfig: Config = {
      ...cfg,
      id: genId(),
      author: user.username,
      authorId: user.id,
      votes: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    await dbPut("configs", newConfig);
    setConfigs(prev => [{ ...newConfig, voted: false }, ...prev]);
    broadcast("configs");
  }, [user, broadcast]);

  const voteConfig = useCallback(async (id: string): Promise<void> => {
    if (!user) return;
    const voteId = `${user.id}_${id}`;
    const existing = await dbGet<{ id: string }>("votes", voteId);
    const config = configs.find(c => c.id === id);
    if (!config) return;

    if (existing) {
      // Un-vote
      await dbDelete("votes", voteId);
      const updated = { ...config, votes: Math.max(0, config.votes - 1), voted: false };
      await dbPut("configs", { ...updated });
      setConfigs(prev => prev.map(c => c.id === id ? updated : c));
    } else {
      // Vote
      await dbPut("votes", { id: voteId, userId: user.id, configId: id });
      const updated = { ...config, votes: config.votes + 1, voted: true };
      await dbPut("configs", { ...updated });
      setConfigs(prev => prev.map(c => c.id === id ? updated : c));
    }
    broadcast("configs");
  }, [user, configs, broadcast]);

  const deleteConfig = useCallback(async (id: string): Promise<void> => {
    await dbDelete("configs", id);
    setConfigs(prev => prev.filter(c => c.id !== id));
    broadcast("configs");
  }, [broadcast]);

  const refreshConfigs = useCallback(async () => {
    await loadConfigs();
  }, [loadConfigs]);

  const refreshUsers = useCallback(async () => {
    await loadUsers();
    const meta = await loadMeta();
    setOwnerIdState(meta.ownerId);
    setAdminIdsState(meta.adminIds);
  }, [loadUsers, loadMeta]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const isOwner = user !== null && user.id === ownerId;
  const isAdmin = isOwner || (user !== null && adminIds.includes(user.id));

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        configs,
        settings,
        loading,
        login,
        register,
        logout,
        isOwner,
        isAdmin,
        ownerId,
        adminIds,
        claimAdmin,
        promoteAdmin,
        demoteAdmin,
        banUser,
        unbanUser,
        deleteUser,
        updateSettings,
        addConfig,
        voteConfig,
        deleteConfig,
        refreshConfigs,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
