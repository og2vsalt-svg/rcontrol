import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  data: { day: string; pickRate: number; winRate: number }[];
}

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-[11px]">
      <div className="mb-1 font-medium text-white">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-[#888]">{p.name}: {p.value}%</div>
      ))}
    </div>
  );
};

export default function TrendChart({ data }: Props) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-[#444]">
        Weekly Trend
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="pick" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(255,255,255,0.1)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="rgba(255,255,255,0)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(255,255,255,0.05)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="rgba(255,255,255,0)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#444", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#444", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} />
          <Area type="monotone" dataKey="pickRate" stroke="rgba(255,255,255,0.2)" fill="url(#pick)" strokeWidth={1.5} />
          <Area type="monotone" dataKey="winRate" stroke="rgba(255,255,255,0.1)" fill="url(#win)" strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
