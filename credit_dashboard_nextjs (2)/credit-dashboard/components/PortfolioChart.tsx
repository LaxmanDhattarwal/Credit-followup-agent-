"use client";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { portfolioSummary, fmtINR } from "@/lib/data";
import { STAGES } from "@/lib/types";

const pieData = portfolioSummary.byStage.map(s => ({
  name: STAGES[s.stage].short,
  value: s.amount,
  count: s.count,
  color: STAGES[s.stage].dotColor,
}));

const barData = portfolioSummary.byStage.map(s => ({
  stage: STAGES[s.stage].short,
  count: s.count,
  amount: s.amount / 1000,
  fill: STAGES[s.stage].dotColor,
}));

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1d] border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-zinc-400 mb-1">{d.name}</div>
      <div className="text-zinc-100">{fmtINR(d.value)}</div>
      <div className="text-zinc-500">{d.count} invoices</div>
    </div>
  );
};

const BarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1d] border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-zinc-400 mb-1">{d.stage}</div>
      <div className="text-zinc-100">₹{d.amount.toFixed(0)}K</div>
      <div className="text-zinc-500">{d.count} invoices</div>
    </div>
  );
};

export function DonutChart() {
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={0.85} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-1 gap-1.5 mt-2">
        {pieData.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-zinc-400 font-mono">{d.name}</span>
            </div>
            <span className="font-mono text-zinc-300">{fmtINR(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StageBarChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={barData} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="stage"
          tick={{ fill: "#52525b", fontSize: 10, fontFamily: "JetBrains Mono" }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fill: "#52525b", fontSize: 10, fontFamily: "JetBrains Mono" }}
          axisLine={false} tickLine={false}
          tickFormatter={v => `₹${v}K`}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
          {barData.map((d, i) => (
            <Cell key={i} fill={d.fill} opacity={0.75} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
