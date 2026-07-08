"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export const CATEGORICAL_PALETTE = [
  "#3987e5",
  "#199e70",
  "#c98500",
  "#008300",
  "#9085e9",
  "#e66767",
  "#d55181",
  "#d95926",
];

const GRID_COLOR = "#2A2A2A";
const AXIS_COLOR = "#A1A1AA";

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-panel-2 bg-canvas-soft px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium text-ink">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-ink-soft">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: entry.color ?? "#3987e5" }}
          />
          <span>{entry.name}:</span>
          <span className="font-medium text-ink">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SalesLineChart({
  data,
}: {
  data: Array<{ etiqueta: string; total: number }>;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ink-soft">
        No hay ventas registradas en este período.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3987e5" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3987e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="etiqueta"
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          content={
            <ChartTooltip formatter={(v) => formatCurrency(v)} />
          }
        />
        <Area
          type="monotone"
          dataKey="total"
          name="Ventas"
          stroke="#3987e5"
          strokeWidth={2}
          fill="url(#ventasGradient)"
          dot={{ r: 3, fill: "#3987e5", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonutChart({
  data,
}: {
  data: Array<{ categoria: string; total: number }>;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ink-soft">
        No hay ventas registradas en este período.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="categoria"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]}
              stroke="#1E1E1E"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: 12, color: AXIS_COLOR }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TopProductsBarChart({
  data,
}: {
  data: Array<{ nombre: string; cantidad: number }>;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ink-soft">
        No hay ventas registradas en este período.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 24, left: 0, bottom: 5 }}
      >
        <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
        <XAxis
          type="number"
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="nombre"
          stroke={AXIS_COLOR}
          tick={{ fill: AXIS_COLOR, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar
          dataKey="cantidad"
          name="Unidades vendidas"
          fill="#3987e5"
          radius={[0, 4, 4, 0]}
          barSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
