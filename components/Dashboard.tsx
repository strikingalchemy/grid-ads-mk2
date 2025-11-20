import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsSummary } from '../types';
import { Eye, MousePointerClick, Layers, TrendingUp } from './ui/Icons';

interface DashboardProps {
  analytics: AnalyticsSummary;
  activeAdsCount: number;
}

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, iconColor }: any) => (
  <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 p-6 transition-all hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ analytics, activeAdsCount }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
            <p className="text-slate-500 text-sm mt-1">Welcome back, here's what's happening with your ads today.</p>
         </div>
         <div className="flex gap-2">
            <span className="text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600">Last 30 Days</span>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Views" 
          value={analytics.totalImpressions.toLocaleString()} 
          subtitle="↑ 12.5% vs previous"
          icon={Eye}
          colorClass="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard 
          title="Total Clicks" 
          value={analytics.totalClicks.toLocaleString()} 
          subtitle="↑ 8.2% vs previous"
          icon={MousePointerClick}
          colorClass="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard 
          title="Conversions" 
          value={analytics.totalConversions.toLocaleString()} 
          subtitle="4.2% Conversion Rate"
          icon={TrendingUp}
          colorClass="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard 
          title="Active Ads" 
          value={activeAdsCount} 
          subtitle="In 4 categories"
          icon={Layers}
          colorClass="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Performance Trends</h3>
        </div>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={analytics.dailyStats}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorClick" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#94a3b8'}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#94a3b8'}} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5'}}
              />
              <Area 
                type="monotone" 
                dataKey="impressions" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorImp)" 
                name="Views" 
              />
              <Area 
                type="monotone" 
                dataKey="clicks" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorClick)" 
                name="Clicks" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;