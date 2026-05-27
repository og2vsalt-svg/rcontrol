import { useState } from "react";
import { useAuth } from "../auth";
import { weapons, patchChanges } from "../data";
import ConfirmModal from "../components/ConfirmModal";

type Tab = "overview" | "users" | "roles" | "configs" | "settings" | "data";

export default function AdminPanel() {
  const { user, isOwner, isAdmin, ownerId, claimAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  // Show claim button if no admin exists
  if (ownerId === null && user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4 text-[20px] text-[#333]">◇</div>
        <h1 className="text-[18px] font-medium text-white">Claim Admin</h1>
        <p className="mt-2 text-[13px] text-[#555]">
          No admin has been set yet. Claim admin access to manage the site.
        </p>
        <button
          onClick={() => claimAdmin()}
          className="mt-6 rounded-md bg-white px-5 py-2 text-[13px] font-medium text-black transition-colors hover:bg-white/90"
        >
          Claim Admin Access
        </button>
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-[14px] text-[#555]">Not authorized</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    ...(isOwner ? [{ id: "roles" as Tab, label: "Roles" }] : []),
    { id: "configs", label: "Configs" },
    { id: "settings", label: "Settings" },
    { id: "data", label: "Data" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
            {isOwner ? "OWNER" : "ADMIN"}
          </span>
          <h1 className="text-[15px] font-medium text-white">Control Panel</h1>
        </div>
        <p className="mt-0.5 text-[11px] text-[#444]">
          {user?.username} · #{user?.id.slice(0, 8)}
        </p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-white/[0.06]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-[12px] transition-colors ${
              tab === t.id
                ? "border-white text-white"
                : "border-transparent text-[#444] hover:text-[#888]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "roles" && isOwner && <RolesTab />}
      {tab === "configs" && <ConfigsTab />}
      {tab === "settings" && <SettingsTab />}
      {tab === "data" && <DataTab />}
    </div>
  );
}

function OverviewTab() {
  const { users, configs, settings, ownerId, adminIds } = useAuth();
  const owner = users.find(u => u.id === ownerId);

  const stats = [
    { label: "Users", value: users.length },
    { label: "Admins", value: adminIds.length + (ownerId !== null ? 1 : 0) },
    { label: "Banned", value: users.filter(u => u.banned).length },
    { label: "Configs", value: configs.length },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-3">
            <div className="text-[18px] font-medium text-white">{s.value}</div>
            <div className="text-[10px] text-[#444]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
          <h3 className="mb-3 text-[12px] font-medium text-white">Owner</h3>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#444]">Username</span>
              <span className="text-white">{owner?.username ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#444]">ID</span>
              <span className="text-white">#{ownerId?.slice(0, 8) ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#444]">Joined</span>
              <span className="text-white">{owner?.joinedAt ?? "—"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
          <h3 className="mb-3 text-[12px] font-medium text-white">Status</h3>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#444]">Registration</span>
              <span className={settings.registrationOpen ? "text-green-400" : "text-red-400"}>
                {settings.registrationOpen ? "Open" : "Closed"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#444]">Config Vault</span>
              <span className={settings.configsEnabled ? "text-green-400" : "text-[#555]"}>
                {settings.configsEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#444]">Weapons Tracked</span>
              <span className="text-white">{weapons.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const { users, ownerId, adminIds, isOwner, banUser, unbanUser, deleteUser, refreshUsers } = useAuth();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; username: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
  );

  const isProtected = (id: string) => {
    if (id === ownerId) return true;
    if (adminIds.includes(id) && !isOwner) return true;
    return false;
  };

  const handle = async (action: () => Promise<void>, id: string) => {
    setLoading(id);
    try {
      await action();
      await refreshUsers();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by username or ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-[12px] text-white outline-none placeholder:text-[#333] focus:border-white/20"
      />

      <div className="rounded-lg border border-white/[0.06]">
        <div className="border-b border-white/[0.05] px-4 py-2 text-[10px] uppercase text-[#444]">
          {filtered.length} users
        </div>
        <div className="divide-y divide-white/[0.04]">
          {filtered.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-[#555]">#{u.id.slice(0, 8)}</span>
                <span className="text-[12px] text-white">{u.username}</span>
                {u.id === ownerId && (
                  <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[9px] text-amber-400">OWNER</span>
                )}
                {u.id !== ownerId && adminIds.includes(u.id) && (
                  <span className="rounded bg-blue-500/10 px-1 py-0.5 text-[9px] text-blue-400">ADMIN</span>
                )}
                {u.banned && (
                  <span className="rounded bg-red-500/10 px-1 py-0.5 text-[9px] text-red-400">BANNED</span>
                )}
              </div>
              {!isProtected(u.id) && (
                <div className="flex gap-2 text-[10px]">
                  {u.banned ? (
                    <button
                      onClick={() => handle(() => unbanUser(u.id), u.id)}
                      disabled={loading === u.id}
                      className="text-[#555] hover:text-green-400 disabled:opacity-40"
                    >
                      {loading === u.id ? "..." : "Unban"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handle(() => banUser(u.id), u.id)}
                      disabled={loading === u.id}
                      className="text-[#555] hover:text-amber-400 disabled:opacity-40"
                    >
                      {loading === u.id ? "..." : "Ban"}
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget({ id: u.id, username: u.username })}
                    disabled={loading === u.id}
                    className="text-[#555] hover:text-red-400 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-[12px] text-[#444]">No users found</div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <ConfirmModal
          title="Delete User"
          message={`Delete "${deleteTarget.username}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            handle(() => deleteUser(deleteTarget.id), deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function RolesTab() {
  const { users, ownerId, adminIds, promoteAdmin, demoteAdmin, refreshUsers } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const nonOwner = users.filter(u => u.id !== ownerId);

  const handle = async (action: () => Promise<void>, id: string) => {
    setLoading(id);
    try {
      await action();
      await refreshUsers();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[#555]">
        Manage admin roles. Admins can ban/unban users and delete configs.
      </p>
      <div className="rounded-lg border border-white/[0.06]">
        <div className="border-b border-white/[0.05] px-4 py-2 text-[10px] uppercase text-[#444]">
          {nonOwner.length} users
        </div>
        <div className="divide-y divide-white/[0.04]">
          {nonOwner.map((u) => {
            const isAdminUser = adminIds.includes(u.id);
            return (
              <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-[12px] text-white">{u.username}</span>
                  {isAdminUser && (
                    <span className="rounded bg-blue-500/10 px-1 py-0.5 text-[9px] text-blue-400">ADMIN</span>
                  )}
                  {u.banned && (
                    <span className="rounded bg-red-500/10 px-1 py-0.5 text-[9px] text-red-400">BANNED</span>
                  )}
                </div>
                <button
                  onClick={() =>
                    handle(
                      isAdminUser ? () => demoteAdmin(u.id) : () => promoteAdmin(u.id),
                      u.id
                    )
                  }
                  disabled={loading === u.id}
                  className={`text-[11px] transition-colors disabled:opacity-40 ${
                    isAdminUser
                      ? "text-blue-400 hover:text-red-400"
                      : "text-[#555] hover:text-blue-400"
                  }`}
                >
                  {loading === u.id ? "..." : isAdminUser ? "Demote" : "Make Admin"}
                </button>
              </div>
            );
          })}
          {nonOwner.length === 0 && (
            <div className="px-4 py-6 text-center text-[12px] text-[#444]">No other users</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfigsTab() {
  const { configs, deleteConfig, refreshConfigs } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/[0.06]">
        <div className="border-b border-white/[0.05] px-4 py-2 text-[10px] uppercase text-[#444]">
          {configs.length} configs
        </div>
        <div className="divide-y divide-white/[0.04]">
          {configs.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-white">{c.name}</span>
                  <span className="text-[9px] text-[#444]">{c.software}</span>
                  <span className="text-[9px] text-[#444]">{c.mode}</span>
                </div>
                <div className="text-[10px] text-[#444]">
                  by {c.author} · {c.createdAt} · {c.votes} votes
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                disabled={loading === c.id}
                className="text-[11px] text-[#444] hover:text-red-400 disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          ))}
          {configs.length === 0 && (
            <div className="px-4 py-6 text-center text-[12px] text-[#444]">No configs</div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <ConfirmModal
          title="Delete Config"
          message={`Delete "${deleteTarget.name}"?`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            setLoading(deleteTarget.id);
            await deleteConfig(deleteTarget.id);
            await refreshConfigs();
            setLoading(null);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function SettingsTab() {
  const { settings, updateSettings } = useAuth();
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateSettings({ announcement });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (key: "configsEnabled" | "registrationOpen") => {
    await updateSettings({ [key]: !settings[key] });
  };

  return (
    <div className="space-y-4">
      {/* Announcement */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
        <h3 className="mb-3 text-[12px] font-medium text-white">Announcement Banner</h3>
        <textarea
          value={announcement}
          onChange={e => setAnnouncement(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-[12px] text-white outline-none placeholder:text-[#333] focus:border-white/20 resize-none"
          placeholder="Leave blank to hide banner"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-white px-3 py-1.5 text-[11px] font-medium text-black hover:bg-white/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
          </button>
          {announcement && (
            <button
              onClick={async () => { setAnnouncement(""); await updateSettings({ announcement: "" }); }}
              className="text-[11px] text-[#444] hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Toggles */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
        <h3 className="mb-3 text-[12px] font-medium text-white">Site Controls</h3>
        <div className="space-y-3">
          {[
            { key: "registrationOpen" as const, label: "Registration", desc: "Allow new accounts" },
            { key: "configsEnabled" as const, label: "Config Vault", desc: "Show config vault page" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-white">{label}</div>
                <div className="text-[10px] text-[#444]">{desc}</div>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  settings[key] ? "bg-white" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-black transition-transform ${
                    settings[key] ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataTab() {
  const weaponsByTier = weapons.reduce((acc, w) => {
    acc[w.tier] = (acc[w.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
        <h3 className="mb-3 text-[12px] font-medium text-white">Weapon Distribution</h3>
        <div className="space-y-1.5">
          {Object.entries(weaponsByTier).map(([tier, count]) => (
            <div key={tier} className="flex items-center gap-3 text-[11px]">
              <span className="w-6 text-[#888]">{tier}</span>
              <div className="flex-1 rounded-full bg-white/[0.04]">
                <div
                  className="h-1.5 rounded-full bg-white/20"
                  style={{ width: `${(count / weapons.length) * 100}%` }}
                />
              </div>
              <span className="text-[#444]">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
        <h3 className="mb-3 text-[12px] font-medium text-white">Recent Patch Changes</h3>
        <div className="space-y-2">
          {patchChanges.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-[11px]">
              <span className="text-[#ccc]">{c.weapon}</span>
              <span className={`rounded px-1.5 py-0.5 text-[9px] ${
                c.type === "buff" ? "bg-green-500/10 text-green-400" :
                c.type === "nerf" ? "bg-red-500/10 text-red-400" :
                "bg-amber-500/10 text-amber-400"
              }`}>{c.type}</span>
              <span className="text-[#333]">{c.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
