
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface ChartItem {
  attempt: string;
  score: number;
  date: string;
}

interface AnalyticsChartProps {
  data: ChartItem[];
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Complete an interview to see your score trend.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
          <XAxis dataKey="attempt" stroke="#9ca3af" />
          <YAxis domain={[0, 10]} stroke="#9ca3af" />
          <Tooltip
            formatter={(value) => [`${value}/10`, "Score"]}
            labelFormatter={(label) => `Attempt ${label}`}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#9333ea"
            strokeWidth={3}
            dot={{ r: 5, fill: "#9333ea" }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
