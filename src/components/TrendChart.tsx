import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: { day: string; pickRate: number; winRate: number }[];
}

const TooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-white/10 bg-black/90 px-2 py-1 text-[10px]">
      <div className="text-[#aaa]">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey}>
          {p.name}: {p.value}%
        </div>
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
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#555" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#555" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<TooltipContent />} />
            <Area
              type="monotone"
              dataKey="pickRate"
              name="Pick"
              stroke="#ffffff"
              fill="rgba(255,255,255,0.2)"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="winRate"
              name="WR"
              stroke="#22c55e"
              fill="rgba(34,197,94,0.2)"
              strokeWidth={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
