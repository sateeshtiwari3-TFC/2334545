import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  IndianRupee, 
  Calendar, 
  Sparkles, 
  ArrowUpRight, 
  Layers, 
  Filter, 
  ChevronRight, 
  Info, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  Building2, 
  User, 
  Plus, 
  CalendarDays, 
  Zap, 
  Target, 
  Award,
  ChevronDown,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  Cell 
} from 'recharts';
import { SafeChartContainer } from './common/SafeChartContainer';
import { Project, Studio, Editor } from '../types';

interface RevenueForecastWidgetProps {
  projects: Project[];
  studios?: Studio[];
  editors?: Editor[];
  onSelectProject?: (projectId: string) => void;
  onQuickAction?: (tab: string, subAction?: string) => void;
  isOrganicTheme?: boolean;
}

export default function RevenueForecastWidget({
  projects = [],
  studios = [],
  editors = [],
  onSelectProject,
  onQuickAction,
  isOrganicTheme = true
}: RevenueForecastWidgetProps) {
  // Forecast Horizon: 3, 6, or 12 months ahead
  const [horizonMonths, setHorizonMonths] = useState<number>(6);
  // Visualization Mode: 'combined' | 'inflow_vs_cost' | 'volume_trend'
  const [forecastView, setForecastView] = useState<'combined' | 'inflow_vs_cost' | 'volume_trend'>('combined');
  // Selected Month Filter (null = show all upcoming in horizon)
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  // Realization scenario: 1.0 (Full), 0.9 (90% realistic), 0.8 (80% conservative)
  const [realizationRate, setRealizationRate] = useState<number>(1.0);
  // Search query for upcoming project breakdown
  const [searchFilter, setSearchFilter] = useState<string>('');

  // 1. Core Forecast Engine: Group upcoming projects by shootDate month
  const forecastData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Generate upcoming month slots starting from current month
    const slots: Array<{
      key: string; // "YYYY-MM"
      monthLabel: string; // "Aug 2026"
      shortName: string; // "Aug"
      year: number;
      monthIdx: number;
      isCurrentMonth: boolean;
      projects: Project[];
      grossRevenue: number;
      advancePaid: number;
      pendingReceivables: number;
      editorCosts: number;
      otherCosts: number;
      totalOutflow: number;
      projectedNetProfit: number;
      profitMarginPct: number;
      projectCount: number;
      isPeakSeason: boolean;
      seasonBadge: string;
    }> = [];

    // Wedding season peak detection in Indian context (Nov-Feb = Winter Peak, Apr-May = Summer Peak, Oct = Pre-wedding Rush)
    const getSeasonInfo = (monthIdx: number) => {
      if (monthIdx === 10 || monthIdx === 11 || monthIdx === 0 || monthIdx === 1) {
        return { isPeak: true, badge: '👑 Peak Winter Season' };
      }
      if (monthIdx === 3 || monthIdx === 4) {
        return { isPeak: true, badge: '🔥 Summer Muhurat Peak' };
      }
      if (monthIdx === 9) {
        return { isPeak: true, badge: '⚡ Pre-Wedding Rush' };
      }
      return { isPeak: false, badge: '🌱 Regular Season' };
    };

    for (let i = 0; i < horizonMonths; i++) {
      const targetDate = new Date(currentYear, currentMonth + i, 1);
      const yr = targetDate.getFullYear();
      const mIdx = targetDate.getMonth();
      const key = `${yr}-${String(mIdx + 1).padStart(2, '0')}`;
      const monthLabel = `${months[mIdx]} ${yr}`;
      const shortName = months[mIdx];
      const season = getSeasonInfo(mIdx);

      // Find projects with shootDate in this month or upcoming delivery date
      const matchedProjects = projects.filter(p => {
        // Exclude completely delivered/closed projects that were shot in the past
        if (p.status === 'closed' || p.status === 'delivered') {
          // If already delivered in previous months, exclude from future forecast
          if (p.shootDate && p.shootDate < `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`) {
            return false;
          }
        }

        // Primary match: scheduled shootDate starts with target month prefix
        if (p.shootDate && p.shootDate.startsWith(key)) {
          return true;
        }

        // Fallback match: if shootDate is missing or invalid, match by deliveryDate if available
        if (!p.shootDate && p.deliveryDate && p.deliveryDate.startsWith(key)) {
          return true;
        }

        return false;
      });

      let grossRev = 0;
      let advPaid = 0;
      let pendingRec = 0;
      let editorWages = 0;
      let otherExp = 0;

      matchedProjects.forEach(p => {
        const amt = Number(p.projectAmount) || 0;
        const adv = Number(p.advancePayment) || 0;
        const pending = p.remainingBalance !== undefined ? Number(p.remainingBalance) : Math.max(0, amt - adv);
        const edWage = (p.isSplitProject && p.firstEditorShare)
          ? (Number(p.firstEditorShare) || 0) + (Number(p.secondEditorShare) || 0)
          : (Number(p.editorPayment) || 0);
        const oth = Number(p.otherExpenses) || 0;

        grossRev += amt;
        advPaid += adv;
        pendingRec += pending;
        editorWages += edWage;
        otherExp += oth;
      });

      // Apply realization rate factor to expected pending collections
      const adjustedPending = Math.round(pendingRec * realizationRate);
      const adjustedGrossRev = advPaid + adjustedPending;
      const totalCost = editorWages + otherExp;
      const netProfit = Math.max(0, adjustedGrossRev - totalCost);
      const marginPct = adjustedGrossRev > 0 ? Math.round((netProfit / adjustedGrossRev) * 100) : 0;

      slots.push({
        key,
        monthLabel,
        shortName,
        year: yr,
        monthIdx: mIdx,
        isCurrentMonth: i === 0,
        projects: matchedProjects,
        grossRevenue: adjustedGrossRev,
        advancePaid: advPaid,
        pendingReceivables: adjustedPending,
        editorCosts: editorWages,
        otherCosts: otherExp,
        totalOutflow: totalCost,
        projectedNetProfit: netProfit,
        profitMarginPct: marginPct,
        projectCount: matchedProjects.length,
        isPeakSeason: season.isPeak,
        seasonBadge: season.badge
      });
    }

    return slots;
  }, [projects, horizonMonths, realizationRate]);

  // Overall Horizon KPIs
  const summaryKPIs = useMemo(() => {
    let totalProjectedGross = 0;
    let totalAdvancesSecured = 0;
    let totalPendingReceivables = 0;
    let totalEditorWages = 0;
    let totalOtherCosts = 0;
    let totalShoots = 0;
    let peakMonth = { name: 'None', amount: 0, count: 0 };

    forecastData.forEach(slot => {
      totalProjectedGross += slot.grossRevenue;
      totalAdvancesSecured += slot.advancePaid;
      totalPendingReceivables += slot.pendingReceivables;
      totalEditorWages += slot.editorCosts;
      totalOtherCosts += slot.otherCosts;
      totalShoots += slot.projectCount;

      if (slot.grossRevenue > peakMonth.amount) {
        peakMonth = {
          name: slot.monthLabel,
          amount: slot.grossRevenue,
          count: slot.projectCount
        };
      }
    });

    const totalOutflows = totalEditorWages + totalOtherCosts;
    const projectedNetProfit = Math.max(0, totalProjectedGross - totalOutflows);
    const overallMarginPct = totalProjectedGross > 0 ? Math.round((projectedNetProfit / totalProjectedGross) * 100) : 0;
    const avgTicketSize = totalShoots > 0 ? Math.round(totalProjectedGross / totalShoots) : 0;
    const advanceSecuredRatio = totalProjectedGross > 0 ? Math.round((totalAdvancesSecured / totalProjectedGross) * 100) : 0;

    return {
      totalProjectedGross,
      totalAdvancesSecured,
      totalPendingReceivables,
      totalEditorWages,
      totalOutflows,
      projectedNetProfit,
      overallMarginPct,
      totalShoots,
      avgTicketSize,
      advanceSecuredRatio,
      peakMonth
    };
  }, [forecastData]);

  // Filtered upcoming projects list for detailed table/cards
  const displayedProjects = useMemo(() => {
    let list: Array<{ project: Project; forecastMonth: string }> = [];

    forecastData.forEach(slot => {
      if (!selectedMonthKey || slot.key === selectedMonthKey) {
        slot.projects.forEach(p => {
          list.push({ project: p, forecastMonth: slot.monthLabel });
        });
      }
    });

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(item => 
        (item.project.coupleName || '').toLowerCase().includes(q) ||
        (item.project.studioName || '').toLowerCase().includes(q) ||
        (item.project.id || '').toLowerCase().includes(q) ||
        (item.project.eventType || '').toLowerCase().includes(q) ||
        (item.project.assignedEditorName || '').toLowerCase().includes(q)
      );
    }

    // Sort by shootDate ascending
    list.sort((a, b) => {
      const dateA = a.project.shootDate || '9999-99-99';
      const dateB = b.project.shootDate || '9999-99-99';
      return dateA.localeCompare(dateB);
    });

    return list;
  }, [forecastData, selectedMonthKey, searchFilter]);

  // Chart data format
  const chartDataset = useMemo(() => {
    return forecastData.map(slot => ({
      name: slot.shortName,
      fullMonth: slot.monthLabel,
      key: slot.key,
      'Projected Revenue': slot.grossRevenue,
      'Secured Advance': slot.advancePaid,
      'Pending Receivables': slot.pendingReceivables,
      'Editor Payouts': slot.editorCosts,
      'Production Cost': slot.totalOutflow,
      'Net Profit': slot.projectedNetProfit,
      'Shoots Count': slot.projectCount,
      'Profit Margin (%)': slot.profitMarginPct,
      seasonBadge: slot.seasonBadge,
      isPeak: slot.isPeakSeason
    }));
  }, [forecastData]);

  return (
    <div 
      id="revenue-forecast-widget"
      className={`rounded-3xl p-6 md:p-8 transition-all relative overflow-hidden ${
        isOrganicTheme 
          ? 'bg-gradient-to-br from-[#0e1d17]/95 via-[#0b1612]/95 to-[#08100d]/95 border border-emerald-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.5)]' 
          : 'bg-gradient-to-br from-charcoal-900/95 via-charcoal-950/95 to-black/95 border border-gold-500/30 shadow-2xl glass-panel'
      }`}
    >
      {/* Decorative foliage / gold glow background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Header & Controls Bar */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-gold-500/15 border border-gold-500/30 text-gold-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold font-display text-white tracking-tight">
                  Revenue Forecast
                </h2>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-gold-400" />
                  Scheduled Shoots Model
                </span>
              </div>
              <p className="text-xs text-gray-300 font-sans mt-0.5 max-w-xl">
                Estimates monthly gross income, locked advances, and net operating profit derived from upcoming wedding shoot dates & signed contracts.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Horizon Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Horizon Selection Tabs */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setHorizonMonths(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                horizonMonths === 3
                  ? 'bg-gold-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              3 Months
            </button>
            <button
              onClick={() => setHorizonMonths(6)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                horizonMonths === 6
                  ? 'bg-gold-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setHorizonMonths(12)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                horizonMonths === 12
                  ? 'bg-gold-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              12 Months
            </button>
          </div>

          {/* Realization Rate Scenario Toggle */}
          <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono">
            <span className="text-gray-400 text-[10px]">Realization:</span>
            <button
              onClick={() => setRealizationRate(1.0)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                realizationRate === 1.0 ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' : 'text-gray-400 hover:text-white'
              }`}
            >
              100%
            </button>
            <button
              onClick={() => setRealizationRate(0.9)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                realizationRate === 0.9 ? 'bg-gold-500/30 text-gold-300 border border-gold-500/50' : 'text-gray-400 hover:text-white'
              }`}
            >
              90%
            </button>
            <button
              onClick={() => setRealizationRate(0.8)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                realizationRate === 0.8 ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' : 'text-gray-400 hover:text-white'
              }`}
            >
              80%
            </button>
          </div>

          {onQuickAction && (
            <button
              onClick={() => onQuickAction('projects', 'add_project')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white text-xs font-medium border border-emerald-400/30 shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Shoot</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 my-6">
        {/* Card 1: Total Forecasted Gross Revenue */}
        <div className="p-4 rounded-2xl bg-black/35 border border-emerald-500/25 flex flex-col justify-between backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300">
            <span>PROJECTED INCOME</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2">
            <div className="text-xl lg:text-2xl font-extrabold text-white font-mono tracking-tight">
              ₹{summaryKPIs.totalProjectedGross.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-300/80 font-mono mt-0.5">
              Next {horizonMonths} Months Gross
            </div>
          </div>
        </div>

        {/* Card 2: Secured Advance Pipeline */}
        <div className="p-4 rounded-2xl bg-black/35 border border-blue-500/25 flex flex-col justify-between backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-mono text-blue-300">
            <span>LOCKED ADVANCES</span>
            <span className="w-2 h-2 rounded-full bg-blue-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl lg:text-2xl font-extrabold text-white font-mono tracking-tight">
              ₹{summaryKPIs.totalAdvancesSecured.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-blue-300/80 font-mono mt-0.5">
              {summaryKPIs.advanceSecuredRatio}% Secured Upfront
            </div>
          </div>
        </div>

        {/* Card 3: Expected Remaining Receivables */}
        <div className="p-4 rounded-2xl bg-black/35 border border-amber-500/25 flex flex-col justify-between backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-300">
            <span>PENDING INFLOW</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl lg:text-2xl font-extrabold text-white font-mono tracking-tight">
              ₹{summaryKPIs.totalPendingReceivables.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">
              Post-Shoot Collections
            </div>
          </div>
        </div>

        {/* Card 4: Forecasted Net Studio Profit */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-gold-950/50 to-charcoal-950/80 border border-gold-500/35 flex flex-col justify-between backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-mono text-gold-300">
            <span>ESTIMATED NET YIELD</span>
            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30 font-mono">
              {summaryKPIs.overallMarginPct}%
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl lg:text-2xl font-extrabold text-gold-400 font-mono tracking-tight">
              ₹{summaryKPIs.projectedNetProfit.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
              After ₹{summaryKPIs.totalOutflows.toLocaleString('en-IN')} Payouts
            </div>
          </div>
        </div>

        {/* Card 5: Scheduled Wedding Shoots */}
        <div className="p-4 rounded-2xl bg-black/35 border border-purple-500/25 flex flex-col justify-between backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-mono text-purple-300">
            <span>SCHEDULED FILMS</span>
            <span className="w-2 h-2 rounded-full bg-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl lg:text-2xl font-extrabold text-white font-mono tracking-tight">
              {summaryKPIs.totalShoots} <span className="text-xs text-gray-400 font-sans">Shoots</span>
            </div>
            <div className="text-[10px] text-purple-300/80 font-mono mt-0.5">
              Avg Ticket ₹{summaryKPIs.avgTicketSize.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Card 6: Peak Month Forecast */}
        <div className="p-4 rounded-2xl bg-black/35 border border-pink-500/25 flex flex-col justify-between backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-mono text-pink-300">
            <span>PEAK MONTH</span>
            <span className="w-2 h-2 rounded-full bg-pink-400" />
          </div>
          <div className="mt-2">
            <div className="text-base lg:text-lg font-bold text-white truncate font-display">
              {summaryKPIs.peakMonth.name}
            </div>
            <div className="text-[10px] text-gold-300 font-mono font-semibold mt-0.5">
              ₹{summaryKPIs.peakMonth.amount.toLocaleString('en-IN')} ({summaryKPIs.peakMonth.count} Films)
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Month-by-Month Forecast Selector Cards */}
      <div className="relative z-10 my-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-gold-400" />
            <span>Monthly Breakdown Matrix (Click Month to Filter Shoots)</span>
          </h3>
          {selectedMonthKey && (
            <button
              onClick={() => setSelectedMonthKey(null)}
              className="text-[11px] font-mono text-gold-400 hover:text-gold-200 underline cursor-pointer"
            >
              Reset Filter (Show All Months)
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {forecastData.map((slot) => {
            const isSelected = selectedMonthKey === slot.key;
            const progress = slot.grossRevenue > 0 ? Math.round((slot.advancePaid / slot.grossRevenue) * 100) : 0;

            return (
              <motion.div
                key={slot.key}
                whileHover={{ y: -3, scale: 1.02 }}
                onClick={() => setSelectedMonthKey(isSelected ? null : slot.key)}
                className={`p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col justify-between border relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-b from-gold-500/25 to-black/80 border-gold-400 shadow-[0_0_20px_rgba(212,175,55,0.3)] ring-1 ring-gold-400/50'
                    : 'bg-black/35 hover:bg-black/50 border-white/10 hover:border-gold-500/30'
                }`}
              >
                {slot.isCurrentMonth && (
                  <div className="absolute top-0 right-0">
                    <span className="bg-emerald-500 text-charcoal-950 font-bold text-[8px] px-2 py-0.5 rounded-bl-lg font-mono">
                      Current
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-white font-display">
                    <span>{slot.monthLabel}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                      {slot.projectCount} Shoots
                    </span>
                  </div>

                  <div className="mt-2 text-lg font-extrabold text-gold-300 font-mono tracking-tight">
                    ₹{slot.grossRevenue.toLocaleString('en-IN')}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[9px] text-gray-400 font-mono">
                    <span className="text-blue-300 font-medium">Adv: ₹{(slot.advancePaid / 1000).toFixed(0)}k</span>
                    <span className="text-amber-300 font-medium">Due: ₹{(slot.pendingReceivables / 1000).toFixed(0)}k</span>
                  </div>

                  {/* Micro Progress Bar of Advances */}
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono">
                  <span className={`px-1.5 py-0.5 rounded-md truncate max-w-[110px] font-bold ${
                    slot.isPeakSeason
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-white/5 text-gray-400'
                  }`}>
                    {slot.seasonBadge}
                  </span>
                  <span className="text-gold-400 font-bold">
                    {slot.profitMarginPct}% Yield
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main Forecast Chart & Visual Analytics */}
      <div className="relative z-10 my-6 bg-black/40 rounded-3xl p-5 md:p-6 border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-gold-400" />
            <h3 className="text-sm font-display font-bold text-white tracking-wide">
              {forecastView === 'combined' ? 'Income Realization & Net Margin Projection' :
               forecastView === 'inflow_vs_cost' ? 'Revenue Inflow vs Editor Production Outflow' :
               'Wedding Shoot Volume & Ticket Size Trajectory'}
            </h3>
          </div>

          {/* Chart Mode Switcher */}
          <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10 text-xs font-mono">
            <button
              onClick={() => setForecastView('combined')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                forecastView === 'combined' ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Realization & Margin
            </button>
            <button
              onClick={() => setForecastView('inflow_vs_cost')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                forecastView === 'inflow_vs_cost' ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Inflow vs Costs
            </button>
            <button
              onClick={() => setForecastView('volume_trend')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                forecastView === 'volume_trend' ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Shoot Volume
            </button>
          </div>
        </div>

        {/* Recharts Forecast Graph */}
        <SafeChartContainer height={320} minHeight={260}>
          <ResponsiveContainer width="100%" height={320} minWidth={100}>
            {forecastView === 'combined' ? (
              <ComposedChart data={chartDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v >= 100000 ? `${(v/100000).toFixed(1)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0b1219] border border-gold-500/40 p-4 rounded-2xl text-xs font-mono text-gray-200 shadow-2xl space-y-2.5 min-w-[260px] backdrop-blur-xl">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div>
                              <span className="font-bold text-white text-xs block font-display tracking-wide">{data.fullMonth} Forecast</span>
                              <span className="text-[10px] text-amber-400 font-mono">{data.seasonBadge}</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              {data['Shoots Count']} Shoots Scheduled
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between items-center text-emerald-400 font-bold">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span>Projected Gross Revenue:</span>
                              </span>
                              <span>₹{Number(data['Projected Revenue']).toLocaleString('en-IN')}</span>
                            </div>

                            <div className="flex justify-between items-center text-blue-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                <span>Secured Advances:</span>
                              </span>
                              <span>₹{Number(data['Secured Advance']).toLocaleString('en-IN')}</span>
                            </div>

                            <div className="flex justify-between items-center text-amber-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                <span>Pending Receivables:</span>
                              </span>
                              <span>₹{Number(data['Pending Receivables']).toLocaleString('en-IN')}</span>
                            </div>

                            <div className="flex justify-between items-center text-rose-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-400" />
                                <span>Editor & Production Costs:</span>
                              </span>
                              <span>₹{Number(data['Production Cost']).toLocaleString('en-IN')}</span>
                            </div>

                            <div className="border-t border-white/10 pt-2 flex justify-between items-center text-gold-300 font-bold">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-gold-400" />
                                <span>Forecasted Net Profit:</span>
                              </span>
                              <span className="text-xs">₹{Number(data['Net Profit']).toLocaleString('en-IN')} ({data['Profit Margin (%)']}%)</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Secured Advance" stackId="revenue" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={22} name="Secured Advance" />
                <Bar dataKey="Pending Receivables" stackId="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} name="Expected Receivables" />
                <Line type="monotone" dataKey="Net Profit" stroke="#fbbf24" strokeWidth={3.5} dot={{ r: 4, fill: '#fbbf24' }} activeDot={{ r: 6 }} name="Forecasted Net Yield" />
              </ComposedChart>
            ) : forecastView === 'inflow_vs_cost' ? (
              <ComposedChart data={chartDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip 
                  formatter={(val, name) => [`₹${Number(val).toLocaleString('en-IN')}`, name]}
                  contentStyle={{ backgroundColor: '#0b1219', borderColor: '#d4af37', borderRadius: '16px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Projected Revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} name="Projected Contract Revenue" />
                <Bar dataKey="Production Cost" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} name="Editor & Outflow Costs" />
                <Line type="monotone" dataKey="Net Profit" stroke="#d4af37" strokeWidth={3} dot={{ r: 4 }} name="Net Operating Income" />
              </ComposedChart>
            ) : (
              <ComposedChart data={chartDataset} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={(v) => `${v} Films`} />
                <YAxis yAxisId="right" orientation="right" stroke="#d4af37" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0b1219', borderColor: '#d4af37', borderRadius: '16px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar yAxisId="left" dataKey="Shoots Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} name="Scheduled Wedding Shoots" />
                <Line yAxisId="right" type="monotone" dataKey="Projected Revenue" stroke="#fbbf24" strokeWidth={3} dot={{ r: 5 }} name="Projected Revenue (₹)" />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </SafeChartContainer>
      </div>

      {/* Detailed Upcoming Scheduled Shoots Table / Roster */}
      <div className="relative z-10 mt-6 bg-black/40 rounded-3xl p-5 md:p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gold-400" />
            <h3 className="text-sm font-display font-bold text-white tracking-wide">
              Scheduled Wedding Pipeline Realization Roster ({displayedProjects.length} Shoots)
            </h3>
          </div>

          {/* Search box within upcoming list */}
          <div className="relative w-full sm:w-auto sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search couple, studio, editor..."
              className="w-full bg-black/50 border border-white/10 focus:border-gold-500/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none font-mono"
            />
          </div>
        </div>

        {displayedProjects.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[760px] text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-[10px] text-gray-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Shoot Date</th>
                  <th className="py-2.5 px-3">Wedding Project & Couple</th>
                  <th className="py-2.5 px-3">Alliance Studio</th>
                  <th className="py-2.5 px-3 text-right">Contract Amount</th>
                  <th className="py-2.5 px-3 text-right">Advance Paid</th>
                  <th className="py-2.5 px-3 text-right">Expected Receivable</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayedProjects.map(({ project, forecastMonth }) => {
                  const amt = Number(project.projectAmount) || 0;
                  const adv = Number(project.advancePayment) || 0;
                  const pending = project.remainingBalance !== undefined ? Number(project.remainingBalance) : Math.max(0, amt - adv);
                  const shootDateFormatted = project.shootDate || 'TBD';
                  const daysToShoot = project.shootDate 
                    ? Math.ceil((new Date(project.shootDate).getTime() - Date.now()) / (1000 * 3600 * 24))
                    : null;

                  return (
                    <tr 
                      key={project.id}
                      className="hover:bg-white/5 transition-colors group cursor-pointer"
                      onClick={() => onSelectProject && onSelectProject(project.id)}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-xs">{shootDateFormatted}</div>
                        {daysToShoot !== null && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            daysToShoot < 0 ? 'bg-gray-500/20 text-gray-400' :
                            daysToShoot <= 7 ? 'bg-rose-500/20 text-rose-300 font-bold animate-pulse' :
                            daysToShoot <= 30 ? 'bg-amber-500/20 text-amber-300' :
                            'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {daysToShoot < 0 ? 'Completed/Past' : daysToShoot === 0 ? 'Shooting Today' : `In ${daysToShoot} days`}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white group-hover:text-gold-300 font-display text-xs truncate max-w-[180px]">
                          {project.coupleName || project.projectName}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {project.eventType || 'Wedding'} • {project.id}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-gray-300 truncate max-w-[140px] block">
                          {project.studioName || 'Direct Studio'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        ₹{amt.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right text-blue-400">
                        ₹{adv.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-400">
                        ₹{pending.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold border ${
                          project.status === 'editing' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          project.status === 'revision' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                          project.status === 'review' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                          project.status === 'delivered' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                          'bg-gray-500/20 text-gray-300 border-gray-500/40'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectProject) onSelectProject(project.id);
                          }}
                          className="p-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 hover:text-gold-200 border border-gold-500/30 transition-colors"
                          title="Inspect Project"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 text-xs font-mono">
            No upcoming scheduled shoots found for the selected filter or horizon.
          </div>
        )}
      </div>
    </div>
  );
}
