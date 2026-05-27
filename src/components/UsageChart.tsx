import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { UsageDataPoint } from "../types";

const TooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pick = payload[0];
  const win = payload[1];
  return (
    <div className="rounded border border-white/10 bg-black/90 px-2 py-1 text-[10px]">
      <div className="text-[#aaa]">{label}</div>
      <div>Pick: {pick?.value}%</div>
      {win && <div>WR: {win.value}%</div>}
    </div>
  );
};

export default function UsageChart({ data }: { data: UsageDataPoint[] }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-[#444]">
        Pick Rate vs Win Rate
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#555" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#555" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<TooltipContent />}
              cursor={{ fill: "rgba(255,255,255,0.02)" }}
            />
            <Bar
              dataKey="pickRate"
              name="Pick"
              fill="#ffffff"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="winRate"
              name="WR"
              fill="#22c55e"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
