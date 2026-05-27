import { useState, useEffect } from "react";
import { useAuth } from "../auth";
import type { Config, ConfigMode, SoftwareType, SortOption } from "../types";
import ConfirmModal from "./ConfirmModal";

interface Props {
  onOpenAuth: (mode: "login" | "register") => void;
}

const modes: ConfigMode[] = ["All", "FFA", "1v1", "2v2", "Ranked"];
const softwareOptions: SoftwareType[] = ["kiciav3", "unnamed"];

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadProps {
  onClose: () => void;
}

function UploadModal({ onClose }: UploadProps) {
  const { addConfig } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<ConfigMode>("All");
  const [software, setSoftware] = useState<SoftwareType>("kiciav3");
  const [settings, setSettings] = useState("");
  const [jsonContent, setJsonContent] = useState("");
  const [filename, setFilename] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setJsonContent(content);
      // Try to parse and extract settings
      try {
        const parsed = JSON.parse(content);
        const extracted = Object.entries(parsed)
          .slice(0, 8)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
        setSettings(extracted.join("\n"));
      } catch {
        // Not JSON, treat as raw
        setSettings(content.slice(0, 500));
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required");
    if (name.trim().length > 40) return setError("Name too long (max 40 chars)");

    setLoading(true);
    try {
      await addConfig({
        name: name.trim(),
        description: description.trim(),
        mode,
        software,
        settings: settings.split("\n").map(s => s.trim()).filter(Boolean),
        filename: filename || undefined,
        jsonContent: jsonContent || undefined,
      });
      onClose();
    } catch {
      setError("Failed to upload config");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-5 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#444] transition-colors hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-5">
          <h2 className="text-[14px] font-medium text-white">Upload Config</h2>
          <p className="mt-1 text-[11px] text-[#555]">Share your rage config</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <label className="mb-1 block text-[10px] text-[#666]">Config Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#333] focus:border-white/20"
              placeholder="My rage config"
              disabled={loading}
            />
          </div>

          {/* Software */}
          <div>
            <label className="mb-1 block text-[10px] text-[#666]">Software</label>
            <div className="flex gap-1.5">
              {softwareOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSoftware(opt)}
                  className={`rounded-md px-3 py-1.5 text-[11px] transition-colors ${
                    software === opt ? "bg-white text-black" : "border border-white/[0.08] text-[#555] hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="mb-1 block text-[10px] text-[#666]">Mode</label>
            <div className="flex flex-wrap gap-1.5">
              {modes.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] transition-colors ${
                    mode === m ? "bg-white text-black" : "border border-white/[0.08] text-[#555] hover:text-white"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-[10px] text-[#666]">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#333] focus:border-white/20 resize-none"
              placeholder="Brief description..."
              disabled={loading}
            />
          </div>

          {/* File upload */}
          <div>
            <label className="mb-1 block text-[10px] text-[#666]">Config File (optional)</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-white/[0.08] px-3 py-2 text-[12px] text-[#555] hover:border-white/20 hover:text-white transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {filename ? filename : "Upload .json / .cfg file"}
              <input type="file" accept=".json,.cfg,.txt" onChange={handleFileUpload} className="sr-only" disabled={loading} />
            </label>
          </div>

          {/* Manual settings */}
          <div>
            <label className="mb-1 block text-[10px] text-[#666]">Settings Preview (auto-filled from file or enter manually)</label>
            <textarea
              value={settings}
              onChange={e => setSettings(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 font-mono text-[11px] text-[#888] outline-none placeholder:text-[#333] focus:border-white/20 resize-none"
              placeholder={"FOV: 90\nSensitivity: 1.2\n..."}
              disabled={loading}
            />
          </div>

          {error && <p className="text-[11px] text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-md bg-white py-2 text-[12px] font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Config"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Config Card ─────────────────────────────────────────────────────────────

interface CardProps {
  config: Config;
  onVote: () => void;
  onDelete?: () => void;
  canVote: boolean;
}

function ConfigCard({ config, onVote, onDelete, canVote }: CardProps) {
  const handleDownload = () => {
    if (!config.jsonContent && !config.settings.length) return;
    const content = config.jsonContent || config.settings.join("\n");
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = config.filename || `${config.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4 transition-colors hover:border-white/[0.1]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-medium text-white">{config.name}</span>
            <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-[#555]">{config.software}</span>
            <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-[#555]">{config.mode}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#555]">
            by{" "}
            <span className="text-[#888]">{config.author}</span>
            <span className="ml-2 text-[#333]">{config.createdAt}</span>
          </p>
          {config.description && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#666]">{config.description}</p>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {(config.jsonContent || config.settings.length > 0) && (
            <button
              onClick={handleDownload}
              title="Download config"
              className="flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-1.5 text-[10px] text-[#555] transition-colors hover:border-white/20 hover:text-white"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {config.filename ? config.filename.split(".").pop() : "dl"}
            </button>
          )}

          <button
            onClick={canVote ? onVote : undefined}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors ${
              config.voted
                ? "border-white/20 text-white"
                : canVote
                ? "border-white/[0.06] text-[#555] hover:border-white/20 hover:text-white"
                : "border-white/[0.04] text-[#333] cursor-default"
            }`}
          >
            <span>{config.voted ? "▲" : "△"}</span>
            <span>{config.votes}</span>
          </button>

          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded-md border border-white/[0.06] px-2 py-1.5 text-[10px] text-[#444] transition-colors hover:border-red-500/30 hover:text-red-400"
            >
              del
            </button>
          )}
        </div>
      </div>

      {config.settings.length > 0 && (
        <div className="mt-3 rounded-md bg-white/[0.02] p-2.5">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {config.settings.slice(0, 6).map((s, i) => (
              <span key={i} className="font-mono text-[10px] text-[#555]">{s}</span>
            ))}
            {config.settings.length > 6 && (
              <span className="text-[10px] text-[#333]">+{config.settings.length - 6} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Config Vault ─────────────────────────────────────────────────────────────

export default function ConfigVault({ onOpenAuth }: Props) {
  const { user, configs, settings, voteConfig, deleteConfig, isAdmin, refreshConfigs } = useAuth();
  const [modeFilter, setModeFilter] = useState<ConfigMode | "All">("All");
  const [softwareFilter, setSoftwareFilter] = useState<SoftwareType | "all">("all");
  const [sort, setSort] = useState<SortOption>("popular");
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Refresh configs when component mounts
  useEffect(() => {
    refreshConfigs();
  }, []);

  const filtered = configs
    .filter(c => modeFilter === "All" || c.mode === modeFilter)
    .filter(c => softwareFilter === "all" || c.software === softwareFilter)
    .sort((a, b) =>
      sort === "popular"
        ? b.votes - a.votes
        : b.createdAt.localeCompare(a.createdAt)
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[18px] font-medium text-white">Config Vault</h1>
          <p className="mt-0.5 text-[12px] text-[#555]">
            Rage configs for kiciav3 &amp; unnamed enhancements
          </p>
        </div>
        {settings.configsEnabled && user && (
          <button
            onClick={() => setShowUpload(true)}
            className="rounded-md bg-white px-3 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-white/90"
          >
            Upload
          </button>
        )}
      </div>

      {!settings.configsEnabled ? (
        <div className="rounded-lg border border-white/[0.06] p-8 text-center text-[13px] text-[#444]">
          Config vault is currently disabled
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-5 space-y-2">
            {/* Row 1: mode + sort */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1">
                {(["All", ...modes.filter(m => m !== "All")] as (ConfigMode | "All")[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setModeFilter(m)}
                    className={`rounded-md px-2.5 py-1.5 text-[11px] transition-colors ${
                      modeFilter === m ? "bg-white text-black" : "text-[#555] hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-1 text-[11px] text-[#444]">
                <span>/</span>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortOption)}
                  className="bg-transparent text-[#555] outline-none hover:text-white cursor-pointer"
                >
                  <option value="popular">Popular</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {/* Row 2: software filter */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-[#444]">Software</span>
              <button
                onClick={() => setSoftwareFilter("all")}
                className={`rounded-md px-2 py-1 text-[10px] transition-colors ${
                  softwareFilter === "all" ? "text-white" : "text-[#444] hover:text-white"
                }`}
              >
                All
              </button>
              {softwareOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setSoftwareFilter(opt)}
                  className={`rounded-md px-2 py-1 text-[10px] transition-colors ${
                    softwareFilter === opt ? "text-white" : "text-[#444] hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-white/[0.04] py-16 text-center">
              <div className="mb-2 text-[24px] text-[#222]">○</div>
              <div className="text-[13px] text-[#555]">No configs yet</div>
              <p className="mt-1 text-[11px] text-[#333]">
                Be the first to share a config.
              </p>
              {!user && (
                <button
                  onClick={() => onOpenAuth("register")}
                  className="mt-4 rounded-md border border-white/[0.08] px-4 py-2 text-[12px] text-white hover:bg-white/[0.04]"
                >
                  Sign up to upload
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(c => (
                <ConfigCard
                  key={c.id}
                  config={c}
                  onVote={() => voteConfig(c.id)}
                  onDelete={isAdmin ? () => setDeleteTarget({ id: c.id, name: c.name }) : undefined}
                  canVote={!!user}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Config"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => { deleteConfig(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
