import React, { useState } from 'react';
import { 
  TrendingUp, 
  IndianRupee, 
  Sparkles, 
  Layers, 
  Users, 
  ArrowUpRight, 
  BarChart2, 
  Activity, 
  CheckCircle2,
  PieChart as PieIcon,
  Calendar,
  Building2,
  Scissors
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  LineChart, 
  Line,
  ComposedChart
} from 'recharts';
import { SafeChartContainer } from '../common/SafeChartContainer';

interface DashboardFinancialChartsProps {
  profitabilityTrendData: any[];
  revenueVsExpensesData: any[];
  sparklineData: any[];
  studioPerformanceData: any[];
  editorPerformanceData: any[];
  profitabilitySummary: {
    totalProjected: number;
    totalEditorPayouts: number;
    totalActualExpenses: number;
    totalOutflow: number;
    totalNetProfit: number;
    overallMargin: string;
  };
  onNavigateTab?: (tab: string) => void;
}

export default function DashboardFinancialCharts({
  profitabilityTrendData,
  revenueVsExpensesData,
  sparklineData,
  studioPerformanceData,
  editorPerformanceData,
  profitabilitySummary,
  onNavigateTab
}: DashboardFinancialChartsProps) {
  const [chartMode, setChartMode] = useState<'profitability' | 'cashflow' | 'completion'>('profitability');

  const CustomDarkTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3.5 rounded-2xl bg-charcoal-950/95 border border-gold-500/40 text-white shadow-2xl backdrop-blur-md text-xs font-mono">
          <p className="font-bold text-gold-300 pb-1.5 mb-1.5 border-b border-white/10">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex justify-between items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-300">{entry.name}:</span>
                </span>
                <span className="font-bold text-white">
                  {typeof entry.value === 'number' && entry.name.toLowerCase().includes('margin')
                    ? `${entry.value}%`
                    : typeof entry.value === 'number'
                      ? `₹${entry.value.toLocaleString('en-IN')}`
                      : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* ================= DYNAMIC 3-WAY MAIN CHART PANEL ================= */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0c2019] via-[#081813] to-[#040e0b] border border-luxury-green-700/50 p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* Header & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gold-500/15 text-gold-400 border border-gold-500/30 shadow-md">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest font-bold block">
                  Studio Financial Engine
                </span>
                <h3 className="text-xl font-serif italic text-white">
                  Cashflow & Profitability Analytics
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-300 font-light">
              6-month continuous analysis of contract revenue, editor disbursements, and studio profit margins.
            </p>
          </div>

          {/* Chart Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-black/60 border border-white/10 self-start sm:self-auto shadow-inner">
            
            <button
              onClick={() => setChartMode('profitability')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                chartMode === 'profitability'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Profit Margin</span>
            </button>

            <button
              onClick={() => setChartMode('cashflow')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                chartMode === 'cashflow'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Receipts vs Payouts</span>
            </button>

            <button
              onClick={() => setChartMode('completion')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                chartMode === 'completion'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Delivery Velocity</span>
            </button>

          </div>

        </div>

        {/* Dynamic Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-black/40 border border-white/5">
          <div>
            <span className="text-[10px] font-mono text-gray-400 uppercase block">6-Mo Contracts</span>
            <span className="text-base sm:text-lg font-bold font-mono text-white">
              ₹{profitabilitySummary.totalProjected.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-400 uppercase block">Editor & Op Outflows</span>
            <span className="text-base sm:text-lg font-bold font-mono text-red-400">
              ₹{profitabilitySummary.totalOutflow.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-400 uppercase block">Net Studio Yield</span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
              ₹{profitabilitySummary.totalNetProfit.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-400 uppercase block">Net Profit Margin</span>
            <span className="text-base sm:text-lg font-bold font-mono text-gold-400">
              {profitabilitySummary.overallMargin}%
            </span>
          </div>
        </div>

        {/* Chart Viewport */}
        <SafeChartContainer height={300} minHeight={260} className="pt-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
            {chartMode === 'profitability' ? (
              <ComposedChart data={profitabilityTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip content={<CustomDarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Projected Contracts" stroke="#d4af37" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" />
                <Area type="monotone" dataKey="Net Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
                <Line type="monotone" dataKey="Total Outflow" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            ) : chartMode === 'cashflow' ? (
              <BarChart data={revenueVsExpensesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip content={<CustomDarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Revenue (Receipts)" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Net Profit" fill="#d4af37" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={sparklineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomDarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="total" name="Total Ingested" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="completed" name="Delivered Films" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </SafeChartContainer>

      </div>

      {/* ================= SECONDARY DUAL BENTO: TOP STUDIOS & EDITORS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Studio Partners */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0c2019] via-[#081813] to-[#040e0b] border border-luxury-green-700/50 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-gold-400" />
              <h4 className="text-sm font-bold text-white font-display">Top Studio Partners (Revenue)</h4>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('studios')}
              className="text-[11px] font-mono text-gold-400 hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {studioPerformanceData.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No studio partner records logged.</p>
            ) : (
              studioPerformanceData.map((s, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white font-display">{s.fullName}</span>
                    <span className="text-[10px] font-mono text-gray-400 block">{s.Projects} Wedding Films</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-gold-400">₹{s.Revenue.toLocaleString('en-IN')}</span>
                    {s.PendingRevenue > 0 && (
                      <span className="text-[10px] font-mono text-amber-400 block">Due: ₹{s.PendingRevenue.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lead Editor Output & Productivity */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0c2019] via-[#081813] to-[#040e0b] border border-luxury-green-700/50 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Scissors className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white font-display">Video Editor Output & Workload</h4>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('editors')}
              className="text-[11px] font-mono text-gold-400 hover:underline flex items-center space-x-1"
            >
              <span>Manage Editors</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {editorPerformanceData.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No video editor records logged.</p>
            ) : (
              editorPerformanceData.slice(0, 5).map((e, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white font-display">{e.fullName}</span>
                    <span className="text-[10px] font-mono text-gray-400 block">{e.specialty}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {e.Completed} Delivered
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {e.active} Active
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
