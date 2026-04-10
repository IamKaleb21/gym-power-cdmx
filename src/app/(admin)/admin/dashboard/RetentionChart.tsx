'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type MonthlyChartPoint = { month: string; new: number; active: number }

export default function RetentionChart({ data }: { data: MonthlyChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #262626',
            borderRadius: '2px',
            color: '#ffffff',
            fontSize: '12px',
          }}
          cursor={{ fill: '#262626' }}
        />
        <Legend wrapperStyle={{ color: '#adaaaa', fontSize: '10px' }} />
        <Bar dataKey="active" name="Activos" fill="#262626" radius={[2, 2, 0, 0]} />
        <Bar dataKey="new" name="Nuevas altas" fill="#cafd00" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
