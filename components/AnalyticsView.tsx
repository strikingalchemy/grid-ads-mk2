import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AnalyticsSummary } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  const [dateRange, setDateRange] = useState('30d');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <div className="bg-white rounded-md border border-gray-300 flex overflow-hidden">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 text-sm font-medium ${dateRange === range ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Impressions</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalImpressions.toLocaleString()}</p>
          <span className="text-green-600 text-xs font-medium flex items-center mt-1">↑ 12% vs prev</span>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Click-Through Rate</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.ctr}%</p>
          <span className="text-green-600 text-xs font-medium flex items-center mt-1">↑ 0.4% vs prev</span>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Mouse Overs</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalMouseOvers.toLocaleString()}</p>
          <span className="text-gray-400 text-xs mt-1">Engagement indicator</span>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Conversions (Attr.)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalConversions}</p>
          <span className="text-blue-600 text-xs font-medium mt-1">{analytics.conversionRate}% Rate</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic vs Engagement</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 10}} />
                <YAxis yAxisId="left" tick={{fontSize: 10}} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="impressions" stroke="#9ca3af" fill="#f3f4f6" name="Impressions" />
                <Area yAxisId="right" type="monotone" dataKey="clicks" stroke="#2563eb" fill="#3b82f6" name="Clicks" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Interaction Funnel</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyStats.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 10}} />
                <YAxis tick={{fontSize: 10}} />
                <Tooltip />
                <Legend />
                <Bar dataKey="mouseOvers" fill="#f59e0b" name="Mouse Over" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" fill="#3b82f6" name="Clicks" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" fill="#10b981" name="Conversions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performing Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Performing Campaigns</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CTR</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv.</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
             <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Summer Sale Banner</td>
                <td className="px-6 py-4 text-sm text-gray-500">45,231</td>
                <td className="px-6 py-4 text-sm text-gray-500">1,204</td>
                <td className="px-6 py-4 text-sm text-green-600 font-medium">2.66%</td>
                <td className="px-6 py-4 text-sm text-gray-900">84</td>
             </tr>
             <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">New Arrivals Video</td>
                <td className="px-6 py-4 text-sm text-gray-500">22,100</td>
                <td className="px-6 py-4 text-sm text-gray-500">980</td>
                <td className="px-6 py-4 text-sm text-green-600 font-medium">4.43%</td>
                <td className="px-6 py-4 text-sm text-gray-900">42</td>
             </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsView;