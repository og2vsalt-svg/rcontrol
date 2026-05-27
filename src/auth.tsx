import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabaseClient";
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
  addConfig: (
    config: Omit<
      Config,
      "id" | "author" | "authorId" | "votes" | "createdAt" | "voted"
    >
  ) => Promise<void>;
  voteConfig: (id: string) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  refreshConfigs: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// We treat usernames as synthetic emails in Supabase auth so that the
// UI can stay "username + password" while Supabase still uses email fields.
const APP_EMAIL_DOMAIN = "@rcontrol.local";
const toEmail = (username: string) => `${username}${APP_EMAIL_DOMAIN}`;

const defaultSettings: SiteSettings = {
  announcement: "",
  configsEnabled: true,
  registrationOpen: true,
};

function mapProfile(row: any): User {
  return {
    id: row.id,
    username: row.username,
    joinedAt: (row.joined_at ?? row.created_at ?? new Date().toISOString()).slice(
      0,
      10
    ),
    banned: Boolean(row.banned),
    role: (row.role as User["role"]) ?? "user",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [adminIds, setAdminIds] = useState<string[]>([]);

  // ── Load helpers ──────────────────────────────────────────────────────────

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, joined_at, banned, role")
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("[rcontrol] loadUsers error", error);
      setUsers([]);
      setOwnerId(null);
      setAdminIds([]);
      return [] as User[];
    }

    const mapped = (data ?? []).map(mapProfile);
    setUsers(mapped);

    const owner = mapped.find((u) => u.role === "owner") ?? null;
    setOwnerId(owner?.id ?? null);
    setAdminIds(mapped.filter((u) => u.role === "admin").map((u) => u.id));

    return mapped;
  }, []);

  const loadSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value");

    if (error) {
      console.error("[rcontrol] loadSettings error", error);
      setSettings(defaultSettings);
      return;
    }

    const merged: SiteSettings = { ...defaultSettings };
    (data ?? []).forEach((row: any) => {
      if (row.key in merged) {
        (merged as any)[row.key] = row.value;
      }
    });
    setSettings(merged);
  }, []);

  const loadConfigs = useCallback(
    async (currentUserId?: string | null) => {
      const activeUserId = currentUserId ?? user?.id ?? null;

      const { data, error } = await supabase
        .from("configs")
        .select(
          "id, name, author_id, author_name, mode, software, description, settings, votes, created_at, filename, json_content"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[rcontrol] loadConfigs error", error);
        setConfigs([]);
        return;
      }

      let votedIds = new Set<string>();
      if (activeUserId) {
        const { data: votesData, error: votesError } = await supabase
          .from("config_votes")
          .select("config_id")
          .eq("user_id", activeUserId);

        if (!votesError && votesData) {
          votedIds = new Set(votesData.map((v: any) => v.config_id));
        }
      }

      const mapped: Config[] = (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        authorId: row.author_id,
        author: row.author_name,
        mode: row.mode,
        software: row.software,
        description: row.description,
        settings: row.settings ?? [],
        votes: row.votes ?? 0,
        createdAt: (row.created_at ?? "").slice(0, 10),
        voted: activeUserId ? votedIds.has(row.id) : false,
        filename: row.filename ?? undefined,
        jsonContent: row.json_content ?? undefined,
      }));

      setConfigs(mapped);
    },
    [user]
  );

  const loadCurrentUser = useCallback(async (): Promise<User | null> => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) {
      console.error("[rcontrol] getSession error", sessionError);
      setUser(null);
      return null;
    }

    const session = sessionData.session;
    if (!session) {
      setUser(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, joined_at, banned, role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error || !data) {
      console.error("[rcontrol] loadCurrentUser profile error", error);
      setUser(null);
      return null;
    }

    const profile = mapProfile(data);
    if (profile.banned) {
      await supabase.auth.signOut().catch(() => {});
      setUser(null);
      return null;
    }

    setUser(profile);
    return profile;
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const profile = await loadCurrentUser();
        await Promise.all([
          loadUsers(),
          loadSettings(),
          loadConfigs(profile?.id),
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadCurrentUser, loadUsers, loadSettings, loadConfigs]);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const login = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      const uname = username.trim().toLowerCase();
      if (!uname || !password) return "Enter username and password";

      const { data, error } = await supabase.auth.signInWithPassword({
        email: toEmail(uname),
        password,
      });

      if (error || !data.session) {
        return "Invalid username or password";
      }

      const profile = await loadCurrentUser();
      if (!profile) {
        return "Account not found or suspended";
      }

      await Promise.all([
        loadUsers(),
        loadSettings(),
        loadConfigs(profile.id),
      ]);

      return null;
    },
    [loadCurrentUser, loadUsers, loadSettings, loadConfigs]
  );

  const register = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      if (!settings.registrationOpen && ownerId !== null) {
        return "Registration is closed";
      }

      const uname = username.trim().toLowerCase();
      if (!uname || !password) return "Enter username and password";
      if (uname.length < 2 || uname.length > 20)
        return "Username must be 2-20 chars";
      if (!/^[a-z0-9_]+$/.test(uname))
        return "Letters, numbers, underscores only";
      if (password.length < 6)
        return "Password must be at least 6 chars";

      // Check duplicate username
      const { data: existing, error: existingError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", uname)
        .maybeSingle();

      if (!existingError && existing) return "Username already taken";

      const { data, error } = await supabase.auth.signUp({
        email: toEmail(uname),
        password,
        options: { data: { username: uname } },
      });

      if (error) {
        console.error("[rcontrol] signUp error", error);
        return error.message ?? "Failed to create account";
      }

      const authUser = data.user;
      if (!authUser) {
        // In some Supabase configs, email confirmation is required.
        return "Check your email to confirm this account before signing in.";
      }

      const joinedAt = new Date().toISOString().slice(0, 10);

      const { error: profileError } = await supabase.from("profiles").insert({
        id: authUser.id,
        username: uname,
        joined_at: joinedAt,
        banned: false,
        role: "user",
      });

      if (profileError) {
        console.error("[rcontrol] insert profile error", profileError);
        return "Account created, but failed to create profile";
      }

      const profile: User = {
        id: authUser.id,
        username: uname,
        joinedAt,
        banned: false,
        role: "user",
      };

      setUser(profile);
      await Promise.all([
        loadUsers(),
        loadSettings(),
        loadConfigs(profile.id),
      ]);

      return null;
    },
    [settings.registrationOpen, ownerId, loadUsers, loadSettings, loadConfigs]
  );

  const logout = useCallback(() => {
    supabase.auth.signOut().catch((err) => {
      console.error("[rcontrol] signOut error", err);
    });
    setUser(null);
    loadConfigs(null).catch((err) =>
      console.error("[rcontrol] loadConfigs after logout", err)
    );
  }, [loadConfigs]);

  // ── Admin actions ─────────────────────────────────────────────────────────

  const claimAdmin = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const { data: existingOwner, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "owner")
      .maybeSingle();

    if (!error && existingOwner) {
      return false;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: "owner" })
      .eq("id", user.id);

    if (updateError) {
      console.error("[rcontrol] claimAdmin error", updateError);
      return false;
    }

    const updated: User = { ...user, role: "owner" };
    setUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    setOwnerId(user.id);

    return true;
  }, [user]);

  const promoteAdmin = useCallback(
    async (id: string): Promise<void> => {
      if (!user || user.id !== ownerId) return;
      if (id === ownerId) return;

      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", id);

      if (error) {
        console.error("[rcontrol] promoteAdmin error", error);
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: "admin" } : u))
      );
      setAdminIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    },
    [user, ownerId]
  );

  const demoteAdmin = useCallback(
    async (id: string): Promise<void> => {
      if (!user || user.id !== ownerId) return;

      const { error } = await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("id", id);

      if (error) {
        console.error("[rcontrol] demoteAdmin error", error);
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: "user" } : u))
      );
      setAdminIds((prev) => prev.filter((a) => a !== id));
    },
    [user, ownerId]
  );

  const banUser = useCallback(
    async (id: string): Promise<void> => {
      if (id === ownerId) return;
      if (adminIds.includes(id) && user?.id !== ownerId) return;

      const { error } = await supabase
        .from("profiles")
        .update({ banned: true })
        .eq("id", id);

      if (error) {
        console.error("[rcontrol] banUser error", error);
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, banned: true } : u))
      );

      if (user?.id === id) {
        supabase.auth.signOut().catch(() => {});
        setUser(null);
      }
    },
    [user, ownerId, adminIds]
  );

  const unbanUser = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("profiles")
      .update({ banned: false })
      .eq("id", id);

    if (error) {
      console.error("[rcontrol] unbanUser error", error);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, banned: false } : u))
    );
  }, []);

  const deleteUser = useCallback(
    async (id: string): Promise<void> => {
      if (id === ownerId) return;
      if (adminIds.includes(id) && user?.id !== ownerId) return;

      const { error: votesError } = await supabase
        .from("config_votes")
        .delete()
        .eq("user_id", id);

      if (votesError) {
        console.error("[rcontrol] deleteUser votes error", votesError);
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);

      if (profileError) {
        console.error("[rcontrol] deleteUser profile error", profileError);
        return;
      }

      setAdminIds((prev) => prev.filter((a) => a !== id));
      setUsers((prev) => prev.filter((u) => u.id !== id));

      if (user?.id === id) {
        supabase.auth.signOut().catch(() => {});
        setUser(null);
      }
    },
    [user, ownerId, adminIds]
  );

  // ── Settings ──────────────────────────────────────────────────────────────

  const updateSettings = useCallback(
    async (s: Partial<SiteSettings>): Promise<void> => {
      const entries = Object.entries(s) as [
        keyof SiteSettings,
        SiteSettings[keyof SiteSettings]
      ][];

      for (const [key, value] of entries) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key, value }, { onConflict: "key" });

        if (error) {
          console.error("[rcontrol] updateSettings error", error);
        }
      }

      setSettings((prev) => ({ ...prev, ...s }));
    },
    []
  );

  // ── Configs ───────────────────────────────────────────────────────────────

  const addConfig = useCallback(
    async (
      cfg: Omit<
        Config,
        "id" | "author" | "authorId" | "votes" | "createdAt" | "voted"
      >
    ): Promise<void> => {
      if (!user) return;

      const { data, error } = await supabase
        .from("configs")
        .insert({
          name: cfg.name,
          author_id: user.id,
          author_name: user.username,
          mode: cfg.mode,
          software: cfg.software,
          description: cfg.description,
          settings: cfg.settings,
          votes: 0,
          filename: cfg.filename ?? null,
          json_content: cfg.jsonContent ?? null,
        })
        .select(
          "id, name, author_id, author_name, mode, software, description, settings, votes, created_at, filename, json_content"
        )
        .maybeSingle();

      if (error || !data) {
        console.error("[rcontrol] addConfig error", error);
        return;
      }

      const mapped: Config = {
        id: data.id,
        name: data.name,
        authorId: data.author_id,
        author: data.author_name,
        mode: data.mode,
        software: data.software,
        description: data.description,
        settings: data.settings ?? [],
        votes: data.votes ?? 0,
        createdAt: (data.created_at ?? "").slice(0, 10),
        voted: false,
        filename: data.filename ?? undefined,
        jsonContent: data.json_content ?? undefined,
      };

      setConfigs((prev) => [mapped, ...prev]);
    },
    [user]
  );

  const voteConfig = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;

      const existingConfig = configs.find((c) => c.id === id);
      if (!existingConfig) return;

      const { data: existingVote, error: existingError } = await supabase
        .from("config_votes")
        .select("id")
        .eq("user_id", user.id)
        .eq("config_id", id)
        .maybeSingle();

      if (!existingError && existingVote) {
        // Un-vote
        const { error: deleteError } = await supabase
          .from("config_votes")
          .delete()
          .eq("id", existingVote.id);

        if (deleteError) {
          console.error("[rcontrol] voteConfig delete error", deleteError);
          return;
        }

        const newVotes = Math.max(0, existingConfig.votes - 1);
        const { error: updateError } = await supabase
          .from("configs")
          .update({ votes: newVotes })
          .eq("id", id);

        if (updateError) {
          console.error("[rcontrol] voteConfig update error", updateError);
          return;
        }

        setConfigs((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, votes: newVotes, voted: false } : c
          )
        );
      } else {
        // Vote
        const { error: insertError } = await supabase
          .from("config_votes")
          .insert({ user_id: user.id, config_id: id });

        if (insertError) {
          console.error("[rcontrol] voteConfig insert error", insertError);
          return;
        }

        const newVotes = existingConfig.votes + 1;
        const { error: updateError } = await supabase
          .from("configs")
          .update({ votes: newVotes })
          .eq("id", id);

        if (updateError) {
          console.error("[rcontrol] voteConfig update error", updateError);
          return;
        }

        setConfigs((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, votes: newVotes, voted: true } : c
          )
        );
      }
    },
    [user, configs]
  );

  const deleteConfig = useCallback(async (id: string): Promise<void> => {
    const { error: votesError } = await supabase
      .from("config_votes")
      .delete()
      .eq("config_id", id);

    if (votesError) {
      console.error("[rcontrol] deleteConfig votes error", votesError);
    }

    const { error } = await supabase.from("configs").delete().eq("id", id);

    if (error) {
      console.error("[rcontrol] deleteConfig error", error);
      return;
    }

    setConfigs((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const refreshConfigs = useCallback(async () => {
    await loadConfigs();
  }, [loadConfigs]);

  const refreshUsers = useCallback(async () => {
    await loadUsers();
  }, [loadUsers]);

  // ── Derived flags ─────────────────────────────────────────────────────────

  const isOwner = user !== null && user.id === ownerId;
  const isAdmin = isOwner || (user !== null && adminIds.includes(user.id));

  const value: AuthState = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
