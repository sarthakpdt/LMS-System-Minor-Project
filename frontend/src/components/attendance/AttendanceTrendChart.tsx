import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

/**
 * Simple line chart showing attendance percentage over weeks (or subjects).
 * Props:
 *   data: Array<{ week: string; attendance: number }>
 */
export const AttendanceTrendChart: React.FC<{ data: { week: string; attendance: number }[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="week" stroke="#6b7280" />
      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#6b7280" />
      <Tooltip
        contentStyle={{
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '8px',
          color: '#fff',
        }}
      />
      <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
    </LineChart>
  </ResponsiveContainer>
);
