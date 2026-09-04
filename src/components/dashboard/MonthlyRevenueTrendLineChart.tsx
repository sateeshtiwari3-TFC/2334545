import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { SafeChartContainer } from '../common/SafeChartContainer';
import {
  TrendingUp,
  FileSpreadsheet,
  IndianRupee,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Scissors,
  Layers,
  ArrowDownRight
} from 'lucide-react';
import { PaymentHistory } from '../../types';

interface MonthlyRevenueTrendLineChartProps {
  editorPayments?: PaymentHistory[];
  studioInvoices?: any[];
  onNavigateTab?: (tab: string, subAction?: string) => void;
}

export default function MonthlyRevenueTrendLineChart({
  editorPayments = [],
  studioInvoices = [],
  onNavigateTab
}: MonthlyRevenueTrendLineChartProps) {
  const [timeHorizon, setTimeHorizon] = useState<'6m' | '12m'>('6m');
  const [viewMetric, setViewMetric] = useState<'all' | 'net_only' | 'invoices_only'>('all');

  // Compute 6 or 12 month historical revenue trend data
  const chartData = useMemo(() => {
    const monthsCount = timeHorizon === '6m' ? 6 : 12;
    const now = new Date();
    const list = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = targetDate.getMonth();
      const yr = targetDate.getFullYear();
      const monthPrefix = `${yr}-${String(mIdx + 1).padStart(2, '0')}`;
      const monthLabel = `${monthNames[mIdx]} '${String(yr).slice(-2)}`;
      const fullLabel = `${monthNames[mIdx]} ${yr}`;
      const isCurrentMonth = i === 0;

      // 1. Studio Invoices Revenue for this month (Billed & Paid)
      const monthInvoices = studioInvoices.filter(inv => {
        const invDate = inv.issuedDate || inv.date || inv.createdAt;
        if (!invDate) return false;
        if (typeof invDate === 'string') return invDate.startsWith(monthPrefix);
        if (invDate?.toDate && typeof invDate.toDate === 'function') {
          const d = invDate.toDate();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthPrefix;
        }
        if (invDate?.seconds) {
          const d = new Date(invDate.seconds * 1000);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthPrefix;
        }
        return false;
      });

      const invoicedBilled = monthInvoices.reduce((sum, inv) => {
        const val = Number(inv.totalPayable ?? inv.totalAmount ?? inv.projectTotal ?? 0);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      const invoiceAdvanceCollected = monthInvoices.reduce((sum, inv) => {
        const val = Number(inv.advanceTotal ?? inv.advancePayment ?? 0);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      // 2. Editor Payments Outflow for this month
      const monthEditorPayments = editorPayments.filter(pay => {
        if (pay.entityType && pay.entityType !== 'editor') return false;
        const pDate = pay.date || (pay as any).createdAt;
        if (!pDate) return false;
        if (typeof pDate === 'string') return pDate.startsWith(monthPrefix);
        if (pDate?.toDate && typeof pDate.toDate === 'function') {
          const d = pDate.toDate();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthPrefix;
        }
        if (pDate?.seconds) {
          const d = new Date(pDate.seconds * 1000);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthPrefix;
        }
        return false;
      });

      const editorPayouts = monthEditorPayments.reduce((sum, pay) => {
        const val = Number(pay.amount || 0);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      // Studio Payments receipts (if logged in payments ledger with entityType === 'studio')
      const studioReceiptsFromPayments = editorPayments
        .filter(pay => {
          if (pay.entityType !== 'studio') return false;
          const pDate = pay.date;
          return pDate && typeof pDate === 'string' && pDate.startsWith(monthPrefix);
        })
        .reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);

      // Effective Gross Revenue (Max of Studio Invoices Billed or Actual Studio Receipts)
      const effectiveGrossRevenue = Math.max(invoicedBilled, studioReceiptsFromPayments + invoiceAdvanceCollected);
      const netRetainedRevenue = Math.max(0, effectiveGrossRevenue - editorPayouts);
      const profitMarginPct = effectiveGrossRevenue > 0 ? Math.round((netRetainedRevenue / effectiveGrossRevenue) * 100) : 0;

      list.push({
        month: monthLabel,
        fullName: fullLabel,
        monthPrefix,
        'Studio Invoiced (₹)': Math.round(invoicedBilled),
        'Effective Gross Revenue (₹)': Math.round(effectiveGrossRevenue),
        'Editor Disbursements (₹)': Math.round(editorPayouts),
        'Net Studio Margin (₹)': Math.round(netRetainedRevenue),
        'Margin %': profitMarginPct,
        invoicesCount: monthInvoices.length,
        editorPayoutsCount: monthEditorPayments.length,
        isCurrentMonth
      });
    }

    return list;
  }, [editorPayments, studioInvoices, timeHorizon]);

  // Aggregate summary totals
  const summary = useMemo(() => {
    const totalInvoiced = chartData.reduce((s, d) => s + d['Studio Invoiced (₹)'], 0);
    const totalGrossRevenue = chartData.reduce((s, d) => s + d['Effective Gross Revenue (₹)'], 0);
    const totalEditorPayouts = chartData.reduce((s, d) => s + d['Editor Disbursements (₹)'], 0);
    const totalNetRevenue = chartData.reduce((s, d) => s + d['Net Studio Margin (₹)'], 0);
    const totalInvoicesCount = chartData.reduce((s, d) => s + d.invoicesCount, 0);
    const totalEditorPayoutsCount = chartData.reduce((s, d) => s + d.editorPayoutsCount, 0);
    const overallMargin = totalGrossRevenue > 0 ? Math.round((totalNetRevenue / totalGrossRevenue) * 100) : 0;

    // Monthly average
    const avgMonthlyRevenue = chartData.length > 0 ? Math.round(totalGrossRevenue / chartData.length) : 0;

    return {
      totalInvoiced,
      totalGrossRevenue,
      totalEditorPayouts,
      totalNetRevenue,
      totalInvoicesCount,
      totalEditorPayoutsCount,
      overallMargin,
      avgMonthlyRevenue
    };
  }, [chartData]);

  // Custom high-contrast Dark Tooltip
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="p-4 rounded-2xl bg-[#091b15]/95 border border-gold-500/50 text-white shadow-2xl backdrop-blur-md text-xs font-mono min-w-[240px]">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
            <span className="font-bold text-gold-300 text-sm">{dataPoint?.fullName || label}</span>
            {dataPoint?.isCurrentMonth && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                Active Month
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-amber-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Studio Invoices:
              </span>
              <span>₹{Number(dataPoint?.['Studio Invoiced (₹)'] || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center text-rose-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" /> Editor Disbursements:
              </span>
              <span>₹{Number(dataPoint?.['Editor Disbursements (₹)'] || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center text-emerald-400 font-bold pt-1.5 border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Net Retained Revenue:
              </span>
              <span>₹{Number(dataPoint?.['Net Studio Margin (₹)'] || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center text-gold-300 text-[11px] pt-1">
              <span>Studio Margin:</span>
              <span className="font-bold">{dataPoint?.['Margin %']}%</span>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-400">
              <span>{dataPoint?.invoicesCount || 0} Invoices</span>
              <span>{dataPoint?.editorPayoutsCount || 0} Editor Payouts</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#0c2019] via-[#081813] to-[#040e0b] border border-luxury-green-700/50 p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gold-500/15 text-gold-400 border border-gold-500/30 shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest font-bold block">
                Recharts Revenue Intelligence
              </span>
              <h3 className="text-xl md:text-2xl font-serif italic text-white">
                Monthly Revenue & Payout Trends
              </h3>
            </div>
          </div>
          <p className="text-xs text-gray-300 font-light">
            Continuous monthly trend analysis synchronized from <span className="text-amber-300 font-mono font-medium">studioInvoices</span> and <span className="text-rose-300 font-mono font-medium">editorPayments</span>.
          </p>
        </div>

        {/* Filters & Navigation Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Horizon Switcher (6M / 12M) */}
          <div className="flex items-center p-1 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono shadow-inner">
            <button
              onClick={() => setTimeHorizon('6m')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeHorizon === '6m'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setTimeHorizon('12m')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeHorizon === '12m'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              12 Months
            </button>
          </div>

          {/* Metric Filter */}
          <div className="flex items-center p-1 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono shadow-inner">
            <button
              onClick={() => setViewMetric('all')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMetric === 'all'
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Lines
            </button>
            <button
              onClick={() => setViewMetric('net_only')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMetric === 'net_only'
                  ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Net Margin
            </button>
            <button
              onClick={() => setViewMetric('invoices_only')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMetric === 'invoices_only'
                  ? 'bg-amber-500/30 text-amber-300 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Invoices Only
            </button>
          </div>

          {/* Tab Jump Buttons */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('invoice')}
              className="p-2 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-300 text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer"
              title="Open GST Invoicing Suite"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invoices</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Highlight Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-black/40 border border-white/5 relative z-10 text-xs font-mono">
        <div>
          <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">
            Total Studio Invoiced
          </span>
          <span className="text-base sm:text-lg font-bold text-white">
            ₹{summary.totalInvoiced.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            {summary.totalInvoicesCount} invoices issued
          </span>
        </div>

        <div>
          <span className="text-[10px] text-rose-400 uppercase tracking-wider block font-bold">
            Editor Disbursements
          </span>
          <span className="text-base sm:text-lg font-bold text-rose-300">
            ₹{summary.totalEditorPayouts.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            {summary.totalEditorPayoutsCount} payouts cleared
          </span>
        </div>

        <div>
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">
            Net Studio Yield
          </span>
          <span className="text-base sm:text-lg font-bold text-emerald-300">
            ₹{summary.totalNetRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5 font-semibold">
            {summary.overallMargin}% retained yield
          </span>
        </div>

        <div>
          <span className="text-[10px] text-sky-400 uppercase tracking-wider block font-bold">
            Avg Monthly Inflow
          </span>
          <span className="text-base sm:text-lg font-bold text-sky-300">
            ₹{summary.avgMonthlyRevenue.toLocaleString('en-IN')}/mo
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            Across {timeHorizon === '6m' ? '6 months' : '12 months'}
          </span>
        </div>
      </div>

      {/* Main Recharts Line Chart Viewport */}
      <SafeChartContainer height={320} minHeight={280} className="pt-2 z-10">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
          <LineChart data={chartData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="lineInvoicesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="lineNetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
            
            <XAxis 
              dataKey="month" 
              stroke="#9ca3af" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: '#ffffff20' }}
            />
            
            <YAxis 
              stroke="#9ca3af" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: '#ffffff20' }}
              tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} 
            />

            <Tooltip content={<CustomTrendTooltip />} />
            
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} 
              iconType="circle"
            />

            {/* Invoices Line */}
            {(viewMetric === 'all' || viewMetric === 'invoices_only') && (
              <Line
                type="monotone"
                dataKey="Studio Invoiced (₹)"
                name="Studio Invoices Revenue"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, stroke: '#f59e0b', strokeWidth: 2, fill: '#0c2019' }}
                activeDot={{ r: 7, stroke: '#fcd34d', strokeWidth: 3, fill: '#f59e0b' }}
              />
            )}

            {/* Editor Disbursements Line */}
            {viewMetric === 'all' && (
              <Line
                type="monotone"
                dataKey="Editor Disbursements (₹)"
                name="Editor Payments"
                stroke="#f43f5e"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 3.5, stroke: '#f43f5e', strokeWidth: 2, fill: '#0c2019' }}
                activeDot={{ r: 6, stroke: '#fda4af', strokeWidth: 2, fill: '#f43f5e' }}
              />
            )}

            {/* Net Studio Margin Line */}
            {(viewMetric === 'all' || viewMetric === 'net_only') && (
              <Line
                type="monotone"
                dataKey="Net Studio Margin (₹)"
                name="Net Studio Profit Yield"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#0c2019' }}
                activeDot={{ r: 7, stroke: '#6ee7b7', strokeWidth: 3, fill: '#10b981' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </SafeChartContainer>

      {/* Bottom Context Footnote */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-gray-400 font-mono pt-2 border-t border-white/5 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Calculated dynamically from real-time database documents</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-amber-400">● Invoices Billed</span>
          <span className="text-rose-400">--- Editor Outflow</span>
          <span className="text-emerald-400">● Net Studio Yield</span>
        </div>
      </div>
    </div>
  );
}
