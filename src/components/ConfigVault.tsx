import { useMemo, useState } from "react";
import { useAuth } from "../auth";
import type {
  Config,
  ConfigMode,
  SoftwareType,
  SortOption,
} from "../types";
import { cn } from "../utils/cn";

interface Props {
  onOpenAuth: (mode: "login" | "register") => void;
}

const softwareOptions: { value: SoftwareType; label: string }[] = [
  { value: "kiciav3", label: "kiciav3" },
  { value: "unnamed", label: "unnamed" },
];

const modes: ConfigMode[] = ["All", "FFA", "1v1", "2v2", "Ranked"];

export default function ConfigVault({ onOpenAuth }: Props) {
  const { user, configs, settings, addConfig, voteConfig } = useAuth();

  const [sort, setSort] = useState<SortOption>("popular");
  const [modeFilter, setModeFilter] = useState<ConfigMode>("All");
  const [softwareFilter, setSoftwareFilter] =
    useState<SoftwareType | "all">("all");
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [software, setSoftware] = useState<SoftwareType>("kiciav3");
  const [mode, setMode] = useState<ConfigMode>("All");
  const [description, setDescription] = useState("");
  const [settingsText, setSettingsText] = useState("");
  const [fileContent, setFileContent] = useState<string | undefined>();
  const [filename, setFilename] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  if (!settings.configsEnabled) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-[13px] text-[#555]">
        Config vault is currently disabled.
      </div>
    );
  }

  const filteredConfigs = useMemo(() => {
    let list = [...configs];

    if (modeFilter !== "All") {
      list = list.filter((c) => c.mode === modeFilter);
    }

    if (softwareFilter !== "all") {
      list = list.filter((c) => c.software === softwareFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q)
      );
    }

    if (sort === "popular") {
      list.sort((a, b) => b.votes - a.votes);
    } else {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return list;
  }, [configs, modeFilter, softwareFilter, search, sort]);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileContent(undefined);
      setFilename(undefined);
      return;
    }

    const text = await file.text();
    setFileContent(text);
    setFilename(file.name);
  };

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth("login");
      return;
    }
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const settingsArr = settingsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      await addConfig({
        name: name.trim(),
        software,
        mode,
        description: description.trim(),
        settings: settingsArr,
        filename,
        jsonContent: fileContent,
      });

      setName("");
      setDescription("");
      setSettingsText("");
      setFileContent(undefined);
      setFilename(undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = (cfg: Config) => {
    if (!user) {
      onOpenAuth("login");
      return;
    }
    voteConfig(cfg.id);
  };

  const handleDownload = (cfg: Config) => {
    const content =
      cfg.jsonContent ||
      JSON.stringify({
        name: cfg.name,
        software: cfg.software,
        mode: cfg.mode,
        settings: cfg.settings,
      }, null, 2);

    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = cfg.filename || `${cfg.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[18px] font-medium text-white">Config Vault</h1>
          <p className="mt-1 text-[12px] text-[#555]">
            Share and download Roblox Rivals rage configs.
          </p>
        </div>
        <div className="flex gap-2 text-[11px] text-[#444]">
          <span>{configs.length} configs</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px]">
        <div className="flex gap-1">
          <button
            onClick={() => setSort("popular")}
            className={cn(
              "rounded-md px-2.5 py-1",
              sort === "popular"
                ? "bg-white text-black"
                : "text-[#555] hover:text-white"
            )}
          >
            Popular
          </button>
          <button
            onClick={() => setSort("newest")}
            className={cn(
              "rounded-md px-2.5 py-1",
              sort === "newest"
                ? "bg-white text-black"
                : "text-[#555] hover:text-white"
            )}
          >
            Newest
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as ConfigMode)}
            className="rounded-md border border-white/[0.08] bg-black/40 px-2 py-1 text-[11px] text-white outline-none"
          >
            {modes.map((m) => (
              <option key={m} value={m} className="bg-black">
                Mode: {m}
              </option>
            ))}
          </select>

          <select
            value={softwareFilter}
            onChange={(e) =>
              setSoftwareFilter(e.target.value as SoftwareType | "all")
            }
            className="rounded-md border border-white/[0.08] bg-black/40 px-2 py-1 text-[11px] text-white outline-none"
          >
            <option value="all" className="bg-black">
              Software: All
            </option>
            {softwareOptions.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-black"
              >
                Software: {opt.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search configs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[160px] flex-1 rounded-md border border-white/[0.08] bg-black/40 px-2 py-1 text-[11px] text-white outline-none placeholder:text-[#333]"
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        {/* Config list */}
        <div className="space-y-3">
          {filteredConfigs.map((cfg) => (
            <ConfigCard
              key={cfg.id}
              cfg={cfg}
              onVote={() => handleVote(cfg)}
              onDownload={() => handleDownload(cfg)}
            />
          ))}
          {filteredConfigs.length === 0 && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4 text-center text-[12px] text-[#555]">
              No configs match your filters.
            </div>
          )}
        </div>

        {/* Submit form */}
        <div className="h-max rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
          <h2 className="mb-3 text-[13px] font-medium text-white">
            {user ? "Upload Config" : "Sign in to upload"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
            {/* Name */}
            <div>
              <label className="mb-1 block text-[10px] text-[#666]">
                Config Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#333] focus:border-white/20"
                placeholder="My rage config"
                disabled={submitting}
              />
            </div>

            {/* Software */}
            <div>
              <label className="mb-1 block text-[10px] text-[#666]">
                Software
              </label>
              <select
                value={software}
                onChange={(e) =>
                  setSoftware(e.target.value as SoftwareType)
                }
                className="w-full rounded-md border border-white/[0.08] bg-black/40 px-3 py-2 text-[12px] text-white outline-none"
                disabled={submitting}
              >
                {softwareOptions.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="bg-black"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode */}
            <div>
              <label className="mb-1 block text-[10px] text-[#666]">
                Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as ConfigMode)}
                className="w-full rounded-md border border-white/[0.08] bg-black/40 px-3 py-2 text-[12px] text-white outline-none"
                disabled={submitting}
              >
                {modes.map((m) => (
                  <option key={m} value={m} className="bg-black">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-[10px] text-[#666]">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-[12px] text-white outline-none placeholder:text-[#333] focus:border-white/20 resize-none"
                placeholder="What this config is for, strengths, notes..."
                disabled={submitting}
              />
            </div>

            {/* Settings list */}
            <div>
              <label className="mb-1 block text-[10px] text-[#666]">
                Settings (one per line)
              </label>
              <textarea
                value={settingsText}
                onChange={(e) => setSettingsText(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-[12px] text-white outline-none placeholder:text-[#333] focus:border-white/20"
                placeholder="aimbot fov: 3.5
smoothness: 0.25
agebot: enabled"
                disabled={submitting}
              />
            </div>

            {/* File upload */}
            <div>
              <label className="mb-1 block text-[10px] text-[#666]">
                Optional JSON file
              </label>
              <input
                type="file"
                accept=".json,.txt"
                onChange={handleFileChange}
                className="block w-full text-[11px] text-[#555] file:mr-2 file:rounded-md file:border-0 file:bg-white/5 file:px-2 file:py-1 file:text-[11px] file:text-white hover:file:bg-white/10"
                disabled={submitting}
              />
              {filename && (
                <div className="mt-1 text-[10px] text-[#555]">
                  Attached: {filename}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 w-full rounded-md bg-white py-2 text-[12px] font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
            >
              {submitting ? "Uploading..." : "Submit Config"}
            </button>

            {!user && (
              <p className="mt-2 text-[10px] text-[#555]">
                You need an account to upload configs.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function ConfigCard({
  cfg,
  onVote,
  onDownload,
}: {
  cfg: Config;
  onVote: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[13px] font-medium text-white">{cfg.name}</h2>
            <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-[#888]">
              {cfg.software} · {cfg.mode}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#555]">{cfg.description}</p>
        </div>

        <button
          onClick={onVote}
          className={cn(
            "flex flex-col items-center rounded-md border px-2 py-1 text-[10px] transition-colors",
            cfg.voted
              ? "border-green-500/40 bg-green-500/10 text-green-300"
              : "border-white/10 bg-black/40 text-[#777] hover:border-white/30 hover:text-white"
          )}
        >
          <span>{cfg.votes}</span>
          <span>{cfg.voted ? "Voted" : "Upvote"}</span>
        </button>
      </div>

      {cfg.settings.length > 0 && (
        <div className="mt-3 grid gap-1 text-[10px] text-[#666] sm:grid-cols-2">
          {cfg.settings.map((s, i) => (
            <div key={i} className="truncate">
              • {s}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#444]">
        <span>
          by {cfg.author} · {cfg.createdAt}
        </span>
        <div className="flex gap-2">
          {cfg.jsonContent && (
            <button
              onClick={onDownload}
              className="text-[#555] hover:text-white"
            >
              Download JSON
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
