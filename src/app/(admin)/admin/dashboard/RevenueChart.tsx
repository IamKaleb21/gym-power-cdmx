'use client'

import {
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  ComposedChart,
} from 'recharts'

export type RevenuePoint = { month: string; revenue: number }

export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#adaaaa', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#adaaaa', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            new Intl.NumberFormat('es-MX', {
              notation: v >= 1000 ? 'compact' : 'standard',
              maximumFractionDigits: 0,
            }).format(v)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #262626',
            borderRadius: '2px',
            color: '#ffffff',
            fontSize: '12px',
          }}
          formatter={(value) =>
            new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
              typeof value === 'number' ? value : Number(value),
            )
          }
        />
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cafd00" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#cafd00" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="none"
          fill="url(#revFill)"
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#cafd00"
          strokeWidth={2}
          dot={{ fill: '#cafd00', r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
