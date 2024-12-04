import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TimeEntry, Project, Client } from '../types';
import { calculateTimeDistribution } from '../utils/statsUtils';

interface TimeDistributionChartProps {
  entries: TimeEntry[];
  projects: Project[];
  clients: Client[];
  selectedClientId?: string;
  viewMode: 'clients' | 'projects';
}

export const TimeDistributionChart: React.FC<TimeDistributionChartProps> = ({
  entries,
  projects,
  clients,
  selectedClientId,
  viewMode,
}) => {
  const data = calculateTimeDistribution(entries, projects, clients, selectedClientId, viewMode);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-gray-600">{data.formattedDuration}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Time Distribution</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) => entry.name}
              labelLine={{ stroke: entry => entry.color }}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};