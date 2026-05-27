import type { PatchChange } from "../types";

export default function PatchNotes({ changes }: { changes: PatchChange[] }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-[#444]">
        Changes
      </div>
      <div className="space-y-2">
        {changes.map((c) => (
          <div key={c.id} className="rounded-md border border-white/[0.04] p-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#ccc]">{c.weapon}</span>
              <span className={`rounded px-1 py-0.5 text-[8px] ${
                c.type === "buff" ? "bg-green-500/10 text-green-400" :
                c.type === "nerf" ? "bg-red-500/10 text-red-400" :
                "bg-amber-500/10 text-amber-400"
              }`}>{c.type}</span>
              <span className="ml-auto text-[9px] text-[#333]">{c.date}</span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#555]">{c.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
