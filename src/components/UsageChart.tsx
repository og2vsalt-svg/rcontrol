import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { UsageDataPoint } from "../types";

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-[11px]">
      <div className="mb-1 font-medium text-white">{label}</div>
      <div className="text-[#888]">Pick: {payload[0].value}%</div>
      <div className="text-[#888]">WR: {payload[1]?.value}%</div>
    </div>
  );
};

export default function UsageChart({ data }: { data: UsageDataPoint[] }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-[#444]">
        Pick Rate vs Win Rate
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#444", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#444", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 80]} />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
          <Bar dataKey="pickRate" fill="rgba(255,255,255,0.15)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="winRate" fill="rgba(255,255,255,0.05)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
