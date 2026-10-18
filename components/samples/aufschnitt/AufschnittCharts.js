import { useState, useEffect } from 'react'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { KRAFT, GREEN, BORDER, MUTED, money0 } from './aufschnittUtils'

export function RevenueNetChart({ data }) {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!ready) return <div style={{ height: 260 }} />
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 6, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={BORDER} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: MUTED }} axisLine={{ stroke: BORDER }} tickLine={false} />
        <YAxis
          tickFormatter={(v) => '$' + Math.round(v / 1000) + 'k'}
          tick={{ fontSize: 11, fill: MUTED }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip formatter={(v) => money0(v)} contentStyle={{ fontSize: '12px', borderRadius: '2px', border: `1px solid ${BORDER}` }} />
        <Bar dataKey="revenue" fill={KRAFT} radius={[2, 2, 0, 0]} maxBarSize={40} />
        <Line type="monotone" dataKey="net" stroke={GREEN} strokeWidth={2.5} dot={{ r: 3, fill: GREEN }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
