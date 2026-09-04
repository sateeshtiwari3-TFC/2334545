import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { SafeChartContainer } from '../common/SafeChartContainer';
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  Film,
  Calendar,
  Building2,
  PieChart as PieIcon,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  Wallet,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { Studio, Project, PaymentHistory } from '../../types';

interface StudioAnalyticsPanelProps {
  studios: Studio[];
  projects: Project[];
  payments?: PaymentHistory[];
  onSelectStudio?: (studio: Studio) => void;
  onBackToDirectory?: () => void;
}

// Chart color palette aligned with luxury dark gold/emerald aesthetic
const STUDIO_COLORS = [
  '#D4AF37', // Gold
  '#10B981', // Emerald
  '#0284C7', // Sky Blue
  '#8B5CF6', // Royal Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink Rose
  '#06B6D4', // Cyan Neon
  '#EF4444', // Crimson
  '#14B8A6', // Teal
  '#6366F1'  // Indigo
];

type QuarterPreset = 'current_quarter' | 'q1_fy' | 'q2_fy' | 'q3_fy' | 'q4_fy' | 'full_fy' | 'all_time';

export const StudioAnalyticsPanel: React.FC<StudioAnalyticsPanelProps> = ({
  studios,
  projects,
  payments = [],
  onSelectStudio,
  onBackToDirectory
}) => {
  // Quarter filter state
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterPreset>('current_quarter');
  const [chartMetric, setChartMetric] = useState<'both' | 'projects_only' | 'revenue_only'>('both');
  const [selectedStudioFilter, setSelectedStudioFilter] = useState<string>('all');

  // Compute Fiscal Quarter Dates for FY 2026-27 (Indian Fiscal Year: April 1 to March 31)
  // Current metadata date: Sep 2026 => Q2 FY 2026-27 (1 July 2026 to 30 September 2026)
  const quarterConfig = useMemo(() => {
    const baseYear = 2026; // Current year from metadata
    
    // FY 2026-27 definitions
    const quarters = {
      q1_fy: {
        id: 'q1_fy' as QuarterPreset,
        label: 'Q1 FY 2026–27',
        subLabel: 'Apr 1 – Jun 30, 2026',
        startDate: new Date(baseYear, 3, 1), // 2026-04-01
        endDate: new Date(baseYear, 5, 30, 23, 59, 59), // 2026-06-30
        isCurrent: false
      },
      q2_fy: {
        id: 'q2_fy' as QuarterPreset,
        label: 'Q2 FY 2026–27',
        subLabel: 'Jul 1 – Sep 30, 2026',
        startDate: new Date(baseYear, 6, 1), // 2026-07-01
        endDate: new Date(baseYear, 8, 30, 23, 59, 59), // 2026-09-30
        isCurrent: true // Active quarter
      },
      q3_fy: {
        id: 'q3_fy' as QuarterPreset,
        label: 'Q3 FY 2026–27',
        subLabel: 'Oct 1 – Dec 31, 2026',
        startDate: new Date(baseYear, 9, 1), // 2026-10-01
        endDate: new Date(baseYear, 11, 31, 23, 59, 59), // 2026-12-31
        isCurrent: false
      },
      q4_fy: {
        id: 'q4_fy' as QuarterPreset,
        label: 'Q4 FY 2026–27',
        subLabel: 'Jan 1 – Mar 31, 2027',
        startDate: new Date(baseYear + 1, 0, 1), // 2027-01-01
        endDate: new Date(baseYear + 1, 2, 31, 23, 59, 59), // 2027-03-31
        isCurrent: false
      },
      full_fy: {
        id: 'full_fy' as QuarterPreset,
        label: 'Full FY 2026–27',
        subLabel: 'Apr 1, 2026 – Mar 31, 2027',
        startDate: new Date(baseYear, 3, 1),
        endDate: new Date(baseYear + 1, 2, 31, 23, 59, 59),
        isCurrent: false
      },
      all_time: {
        id: 'all_time' as QuarterPreset,
        label: 'All-Time Pipeline',
        subLabel: 'All recorded projects',
        startDate: new Date(2020, 0, 1),
        endDate: new Date(2030, 11, 31),
        isCurrent: false
      }
    };

    const activeConfig = selectedQuarter === 'current_quarter' 
      ? quarters.q2_fy 
      : quarters[selectedQuarter];

    return {
      current: quarters.q2_fy,
      active: activeConfig,
      allQuarters: [
        { ...quarters.q2_fy, key: 'current_quarter', displayTitle: '⭐ Q2 FY26–27 (Current Fiscal Quarter)' },
        { ...quarters.q1_fy, key: 'q1_fy', displayTitle: 'Q1 FY26–27 (Apr – Jun 2026)' },
        { ...quarters.q3_fy, key: 'q3_fy', displayTitle: 'Q3 FY26–27 (Oct – Dec 2026)' },
        { ...quarters.q4_fy, key: 'q4_fy', displayTitle: 'Q4 FY26–27 (Jan – Mar 2027)' },
        { ...quarters.full_fy, key: 'full_fy', displayTitle: 'Full FY 2026–27 (12 Months)' },
        { ...quarters.all_time, key: 'all_time', displayTitle: 'All-Time Pipeline' }
      ]
    };
  }, [selectedQuarter]);

  // Helper to extract relevant date for project quarter attribution
  const getProjectDate = (p: Project): Date => {
    // 1. Check shootDate (YYYY-MM-DD)
    if (p.shootDate) {
      const d = new Date(p.shootDate);
      if (!isNaN(d.getTime())) return d;
    }
    // 2. Check createdAt
    if (p.createdAt) {
      const d = p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    // 3. Check deliveryDate (YYYY-MM-DD)
    if (p.deliveryDate) {
      const d = new Date(p.deliveryDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  // Filter projects belonging to the active fiscal quarter
  const quarterProjects = useMemo(() => {
    const { startDate, endDate } = quarterConfig.active;

    return projects.filter(p => {
      // Check if project primary date falls in the quarter
      const pDate = getProjectDate(p);
      const inPrimaryRange = pDate >= startDate && pDate <= endDate;

      // Also check if deliveryDate or shootDate specifically falls in quarter window
      let inShootRange = false;
      if (p.shootDate) {
        const sDate = new Date(p.shootDate);
        if (!isNaN(sDate.getTime()) && sDate >= startDate && sDate <= endDate) inShootRange = true;
      }
      let inDeliveryRange = false;
      if (p.deliveryDate) {
        const delDate = new Date(p.deliveryDate);
        if (!isNaN(delDate.getTime()) && delDate >= startDate && delDate <= endDate) inDeliveryRange = true;
      }

      const matchesQuarter = inPrimaryRange || inShootRange || inDeliveryRange;
      if (!matchesQuarter) return false;

      // Studio filter
      if (selectedStudioFilter !== 'all' && p.studioId !== selectedStudioFilter) {
        return false;
      }

      return true;
    });
  }, [projects, quarterConfig.active, selectedStudioFilter]);

  // Aggregate stats per studio for the quarter
  const studioQuarterAnalytics = useMemo(() => {
    // Map studios to their aggregated stats
    const studioMap = new Map<string, {
      studioId: string;
      studioName: string;
      studioObj?: Studio;
      projectCount: number;
      totalRevenue: number;
      advancePaid: number;
      remainingDue: number;
      completedCount: number;
      activeCount: number;
      projects: Project[];
    }>();

    // Initialize all registered studios (or filtered studio)
    studios.forEach(s => {
      if (selectedStudioFilter === 'all' || selectedStudioFilter === s.id) {
        studioMap.set(s.id, {
          studioId: s.id,
          studioName: s.name || 'Unnamed Studio',
          studioObj: s,
          projectCount: 0,
          totalRevenue: 0,
          advancePaid: 0,
          remainingDue: 0,
          completedCount: 0,
          activeCount: 0,
          projects: []
        });
      }
    });

    // Populate stats from quarterProjects
    quarterProjects.forEach(p => {
      const sId = p.studioId || 'direct-client';
      const sName = p.studioName || 'Direct / Unassigned Client';

      if (!studioMap.has(sId)) {
        if (selectedStudioFilter === 'all' || selectedStudioFilter === sId) {
          studioMap.set(sId, {
            studioId: sId,
            studioName: sName,
            studioObj: studios.find(s => s.id === sId),
            projectCount: 0,
            totalRevenue: 0,
            advancePaid: 0,
            remainingDue: 0,
            completedCount: 0,
            activeCount: 0,
            projects: []
          });
        }
      }

      const record = studioMap.get(sId);
      if (record) {
        record.projectCount += 1;
        const amount = Number(p.projectAmount) || 0;
        const advance = Number(p.advancePayment) || 0;
        record.totalRevenue += amount;
        record.advancePaid += advance;
        record.remainingDue += Math.max(0, amount - advance);
        record.projects.push(p);

        if (['delivered', 'closed'].includes(p.status)) {
          record.completedCount += 1;
        } else {
          record.activeCount += 1;
        }
      }
    });

    // Convert map to array and compute totals
    const list = Array.from(studioMap.values());
    const totalQuarterRevenue = list.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalQuarterProjects = list.reduce((sum, item) => sum + item.projectCount, 0);

    // Compute share percentages and sort descending by total revenue, then project count
    const enriched = list.map((item, index) => ({
      ...item,
      color: STUDIO_COLORS[index % STUDIO_COLORS.length],
      revenueShare: totalQuarterRevenue > 0 ? Math.round((item.totalRevenue / totalQuarterRevenue) * 100) : 0,
      projectShare: totalQuarterProjects > 0 ? Math.round((item.projectCount / totalQuarterProjects) * 100) : 0,
      avgProjectTicket: item.projectCount > 0 ? Math.round(item.totalRevenue / item.projectCount) : 0
    })).sort((a, b) => b.totalRevenue - a.totalRevenue || b.projectCount - a.projectCount);

    // Top performer
    const topStudio = enriched.length > 0 && enriched[0].totalRevenue > 0 ? enriched[0] : null;

    return {
      items: enriched,
      // For charts: only include studios with either projects or revenue in this quarter,
      // OR top 8 studios if none to avoid empty visualization
      chartItems: enriched.filter(item => item.projectCount > 0 || item.totalRevenue > 0),
      totalQuarterRevenue,
      totalQuarterProjects,
      totalQuarterAdvance: list.reduce((sum, item) => sum + item.advancePaid, 0),
      totalQuarterDue: list.reduce((sum, item) => sum + item.remainingDue, 0),
      topStudio,
      activeStudiosCount: enriched.filter(item => item.projectCount > 0).length
    };
  }, [studios, quarterProjects, selectedStudioFilter]);

  // Fallback helper for chart when zero projects in current quarter (e.g., initial seed with only 1 project in another period)
  const isQuarterEmpty = studioQuarterAnalytics.totalQuarterProjects === 0;

  // Custom Tooltip for Projects Contributed Chart
  const CustomProjectsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-charcoal-900/95 border border-gold-500/40 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold text-white font-display">{data.studioName}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 font-bold">
              {data.projectShare}% Share
            </span>
          </div>
          <div className="text-gray-300 flex justify-between font-mono">
            <span>Quarter Projects:</span>
            <span className="font-bold text-white text-sm">{data.projectCount} films</span>
          </div>
          <div className="text-gray-400 flex justify-between text-[11px]">
            <span>Active Pipeline:</span>
            <span className="text-amber-400 font-medium">{data.activeCount} in progress</span>
          </div>
          <div className="text-gray-400 flex justify-between text-[11px]">
            <span>Delivered / Closed:</span>
            <span className="text-emerald-400 font-medium">{data.completedCount} completed</span>
          </div>
          <div className="text-gray-300 flex justify-between font-mono pt-1 border-t border-white/5">
            <span>Quarter Revenue:</span>
            <span className="font-bold text-gold-400">₹{data.totalRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Revenue Generated Chart
  const CustomRevenueTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-charcoal-900/95 border border-gold-500/40 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold text-white font-display truncate max-w-[140px]">{data.studioName}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              {data.revenueShare}% of Qtr
            </span>
          </div>
          <div className="space-y-1 font-mono">
            <div className="text-gray-300 flex justify-between items-center">
              <span>Total Qtr Revenue:</span>
              <span className="font-bold text-base text-gold-400">₹{data.totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-gray-400 flex justify-between text-[11px]">
              <span>Advance Collected:</span>
              <span className="text-emerald-400">₹{data.advancePaid.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-gray-400 flex justify-between text-[11px]">
              <span>Pending Balance:</span>
              <span className={data.remainingDue > 0 ? 'text-amber-400 font-bold' : 'text-gray-400'}>
                ₹{data.remainingDue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-gray-400 flex justify-between text-[11px] pt-1 border-t border-white/5">
              <span>Avg Ticket Value:</span>
              <span className="text-white">₹{data.avgProjectTicket.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Quarter Controls */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-charcoal-950 via-[#0a1813] to-charcoal-950 border border-luxury-green-700/40 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-luxury-green-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-300 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                <BarChart3 className="w-3.5 h-3.5 text-gold-400" />
                <span>Executive Studio Analytics</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-black/50 border border-white/10 text-emerald-400 text-[10px] font-mono font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{quarterConfig.active.label} • {quarterConfig.active.subLabel}</span>
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
              <span>Studio Contribution & Revenue Intelligence</span>
              <Sparkles className="w-5 h-5 text-gold-400 fill-gold-400/20" />
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-light max-w-2xl leading-relaxed">
              Real-time analytics breaking down contract volume, project pipeline attribution, and gross revenue generated per partner studio for the fiscal quarter.
            </p>
          </div>

          {/* Controls: Quarter Selector & Back Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Fiscal Quarter Dropdown */}
            <div className="relative">
              <select
                id="quarter-selector"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value as QuarterPreset)}
                className="appearance-none pl-3.5 pr-8 py-2.5 bg-black/60 border border-gold-500/30 hover:border-gold-400 focus:border-gold-400 rounded-2xl text-xs font-mono font-semibold text-gold-300 focus:outline-none transition-all shadow-inner cursor-pointer"
              >
                {quarterConfig.allQuarters.map((q) => (
                  <option key={q.key} value={q.key} className="bg-charcoal-900 text-white">
                    {q.displayTitle}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gold-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Back to Studio Directory Button */}
            {onBackToDirectory && (
              <button
                type="button"
                onClick={onBackToDirectory}
                className="px-4 py-2.5 rounded-2xl bg-charcoal-900/90 hover:bg-charcoal-800 border border-white/10 hover:border-gold-500/30 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Building2 className="w-4 h-4 text-gold-400" />
                <span>View Directory Cards</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Executive Quarter KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Quarter Revenue */}
        <div className="p-5 rounded-3xl bg-charcoal-950/80 border border-gold-500/25 shadow-xl relative overflow-hidden backdrop-blur-sm group hover:border-gold-500/50 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span className="uppercase tracking-wider font-semibold">Qtr Gross Revenue</span>
            <div className="p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              ₹{studioQuarterAnalytics.totalQuarterRevenue.toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-gold-400/90 font-mono mt-1 flex items-center gap-1">
              <span>Advance: ₹{studioQuarterAnalytics.totalQuarterAdvance.toLocaleString('en-IN')}</span>
              {studioQuarterAnalytics.totalQuarterDue > 0 && (
                <span className="text-amber-400">• Due: ₹{studioQuarterAnalytics.totalQuarterDue.toLocaleString('en-IN')}</span>
              )}
            </p>
          </div>
        </div>

        {/* KPI 2: Total Projects Contributed */}
        <div className="p-5 rounded-3xl bg-charcoal-950/80 border border-white/10 shadow-xl relative overflow-hidden backdrop-blur-sm group hover:border-luxury-green-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span className="uppercase tracking-wider font-semibold">Projects Contributed</span>
            <div className="p-2 rounded-xl bg-luxury-green-500/10 text-emerald-400 border border-luxury-green-500/20">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {studioQuarterAnalytics.totalQuarterProjects}
              <span className="text-sm font-normal text-gray-400 ml-1.5">films</span>
            </h3>
            <p className="text-xs text-emerald-400 font-mono mt-1 flex items-center gap-1">
              <span>Across {studioQuarterAnalytics.activeStudiosCount} contributing studios</span>
            </p>
          </div>
        </div>

        {/* KPI 3: Top Performing Studio */}
        <div className="p-5 rounded-3xl bg-charcoal-950/80 border border-white/10 shadow-xl relative overflow-hidden backdrop-blur-sm group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span className="uppercase tracking-wider font-semibold">Top Studio Contributor</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <h3 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight truncate">
              {studioQuarterAnalytics.topStudio ? studioQuarterAnalytics.topStudio.studioName : 'No Contributions Yet'}
            </h3>
            <p className="text-xs text-amber-400 font-mono mt-1 truncate">
              {studioQuarterAnalytics.topStudio ? (
                `₹${studioQuarterAnalytics.topStudio.totalRevenue.toLocaleString('en-IN')} (${studioQuarterAnalytics.topStudio.projectCount} projects)`
              ) : (
                'Awaiting quarter project assignments'
              )}
            </p>
          </div>
        </div>

        {/* KPI 4: Average Project Value */}
        <div className="p-5 rounded-3xl bg-charcoal-950/80 border border-white/10 shadow-xl relative overflow-hidden backdrop-blur-sm group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span className="uppercase tracking-wider font-semibold">Avg Revenue / Project</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              ₹{studioQuarterAnalytics.totalQuarterProjects > 0 
                ? Math.round(studioQuarterAnalytics.totalQuarterRevenue / studioQuarterAnalytics.totalQuarterProjects).toLocaleString('en-IN')
                : '0'}
            </h3>
            <p className="text-xs text-purple-300 font-mono mt-1">
              Per contracted film this quarter
            </p>
          </div>
        </div>
      </div>

      {/* 3. Empty State Guidance Banner (if 0 projects in selected quarter) */}
      {isQuarterEmpty && (
        <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-500/40 text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white font-display">
                No projects assigned to {quarterConfig.active.label} ({quarterConfig.active.subLabel}) yet
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Existing studio projects may have shoot dates or creation timestamps in other fiscal periods. You can switch to Full FY or All-Time to view lifetime studio metrics.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedQuarter('full_fy')}
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-xl text-xs font-mono font-bold text-amber-200 cursor-pointer transition-all"
            >
              View Full FY 2026–27
            </button>
            <button
              type="button"
              onClick={() => setSelectedQuarter('all_time')}
              className="px-3.5 py-2 bg-charcoal-900 hover:bg-charcoal-800 border border-white/10 rounded-xl text-xs font-mono font-bold text-gray-200 cursor-pointer transition-all"
            >
              View All-Time
            </button>
          </div>
        </div>
      )}

      {/* 4. Core Visual Charts Section (Side-by-Side Dual Recharts Panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= CHART 1: PROJECTS CONTRIBUTED PER STUDIO ================= */}
        <div className="p-6 rounded-3xl bg-charcoal-950/90 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-luxury-green-500/15 text-emerald-400 border border-luxury-green-500/30">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold block">
                  Volume Breakdown
                </span>
                <h3 className="text-lg font-bold font-display text-white">
                  Projects Contributed per Studio
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono text-gray-400 px-3 py-1 rounded-full bg-black/40 border border-white/5">
              {studioQuarterAnalytics.totalQuarterProjects} total films
            </span>
          </div>

          {/* Chart Container */}
          <SafeChartContainer height={300} minHeight={260}>
            {studioQuarterAnalytics.chartItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
                <BarChart
                  data={studioQuarterAnalytics.chartItems}
                  margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="studioName"
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    tick={{ fill: '#d1d5db' }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <Tooltip content={<CustomProjectsTooltip />} />
                  <Bar
                    dataKey="projectCount"
                    name="Projects Contributed"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={55}
                  >
                    {studioQuarterAnalytics.chartItems.map((entry, index) => (
                      <Cell 
                        key={`cell-proj-${index}`} 
                        fill={entry.color || STUDIO_COLORS[index % STUDIO_COLORS.length]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                <Film className="w-8 h-8 text-gray-600" />
                <p className="text-xs font-mono">No projects contributed in this quarter yet.</p>
                <button
                  onClick={() => setSelectedQuarter('all_time')}
                  className="text-xs text-gold-400 hover:underline font-mono"
                >
                  Switch to All-Time view →
                </button>
              </div>
            )}
          </SafeChartContainer>

          <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>Metric: Volume of assigned weddings & teasers</span>
            <span className="text-emerald-400">{quarterConfig.active.label}</span>
          </div>
        </div>

        {/* ================= CHART 2: TOTAL REVENUE GENERATED PER STUDIO ================= */}
        <div className="p-6 rounded-3xl bg-charcoal-950/90 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gold-500/15 text-gold-400 border border-gold-500/30">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest font-bold block">
                  Financial Attribution
                </span>
                <h3 className="text-lg font-bold font-display text-white">
                  Total Revenue Generated (Quarter)
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono text-gold-400 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 font-bold">
              ₹{studioQuarterAnalytics.totalQuarterRevenue.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Chart Container */}
          <SafeChartContainer height={300} minHeight={260}>
            {studioQuarterAnalytics.chartItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
                <BarChart
                  data={studioQuarterAnalytics.chartItems}
                  margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="studioName"
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    tick={{ fill: '#d1d5db' }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${(val / 1000).toFixed(0)}k`}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <Tooltip content={<CustomRevenueTooltip />} />
                  <Bar
                    dataKey="totalRevenue"
                    name="Gross Revenue (₹)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={55}
                  >
                    {studioQuarterAnalytics.chartItems.map((entry, index) => (
                      <Cell 
                        key={`cell-rev-${index}`} 
                        fill={entry.color || STUDIO_COLORS[index % STUDIO_COLORS.length]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 space-y-2">
                <IndianRupee className="w-8 h-8 text-gray-600" />
                <p className="text-xs font-mono">No revenue billed in this quarter yet.</p>
                <button
                  onClick={() => setSelectedQuarter('all_time')}
                  className="text-xs text-gold-400 hover:underline font-mono"
                >
                  Switch to All-Time view →
                </button>
              </div>
            )}
          </SafeChartContainer>

          <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>Currency: INR (₹) • Project Contracts</span>
            <span className="text-gold-400">{quarterConfig.active.label}</span>
          </div>
        </div>
      </div>

      {/* 5. Revenue Contribution Share (Donut / Pie Chart & Studio Market Share) */}
      {studioQuarterAnalytics.chartItems.length > 1 && (
        <div className="p-6 rounded-3xl bg-charcoal-950/80 border border-white/10 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold block">
                  Market Distribution
                </span>
                <h3 className="text-base sm:text-lg font-bold font-display text-white">
                  Studio Revenue Share Contribution
                </h3>
              </div>
            </div>
            <span className="text-xs font-mono text-gray-400">
              Proportion of {quarterConfig.active.label} turnover
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-4">
            {/* Donut Chart */}
            <SafeChartContainer height={224} minHeight={200} className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <PieChart>
                  <Pie
                    data={studioQuarterAnalytics.chartItems}
                    dataKey="totalRevenue"
                    nameKey="studioName"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {studioQuarterAnalytics.chartItems.map((entry, index) => (
                      <Cell key={`cell-pie-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomRevenueTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-mono uppercase text-gray-400">Total Qtr</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-white">
                  ₹{studioQuarterAnalytics.totalQuarterRevenue >= 100000 
                    ? `${(studioQuarterAnalytics.totalQuarterRevenue / 100000).toFixed(1)}L` 
                    : studioQuarterAnalytics.totalQuarterRevenue.toLocaleString('en-IN')}
                </span>
              </div>
            </SafeChartContainer>

            {/* Legend & Percentages List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-2">
              {studioQuarterAnalytics.chartItems.map((item) => (
                <div 
                  key={item.studioId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-charcoal-900/60 border border-white/5 hover:border-white/15 transition-all text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-white truncate max-w-[150px]">{item.studioName}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono shrink-0">
                    <span className="text-gold-400 font-bold">₹{item.totalRevenue.toLocaleString('en-IN')}</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 text-[10px] font-bold">
                      {item.revenueShare}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Comprehensive Studio Quarter Breakdown Table */}
      <div className="p-6 rounded-3xl bg-charcoal-950/80 border border-white/10 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold font-display text-white flex items-center gap-2">
              <span>Quarter Studio Contribution Matrix</span>
              <span className="text-xs font-mono text-gold-400 font-normal">
                ({studioQuarterAnalytics.items.length} Studios Monitored)
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Detailed breakdown of project volume, gross billing, advances collected, and outstanding dues for {quarterConfig.active.label}.
            </p>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3">Studio Partner</th>
                <th className="py-3 px-3 text-center">Quarter Projects</th>
                <th className="py-3 px-3 text-right">Gross Revenue (₹)</th>
                <th className="py-3 px-3 text-center">Revenue Share</th>
                <th className="py-3 px-3 text-right">Advance Collected</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-3 text-center">Avg Ticket</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {studioQuarterAnalytics.items.map((item, idx) => {
                const sObj = item.studioObj;
                return (
                  <tr 
                    key={item.studioId}
                    className="hover:bg-charcoal-900/50 transition-colors group cursor-pointer"
                    onClick={() => sObj && onSelectStudio && onSelectStudio(sObj)}
                  >
                    {/* Studio Name & Color */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-white font-sans text-xs group-hover:text-gold-300 transition-colors block truncate max-w-[160px] sm:max-w-[220px]">
                            {item.studioName}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono block">
                            {sObj?.city || sObj?.ownerName || 'Partner Studio'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Quarter Projects */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        item.projectCount > 0 
                          ? 'bg-luxury-green-500/15 text-emerald-300 border border-luxury-green-500/30' 
                          : 'bg-charcoal-900 text-gray-400'
                      }`}>
                        {item.projectCount} {item.projectCount === 1 ? 'film' : 'films'}
                      </span>
                    </td>

                    {/* Gross Revenue */}
                    <td className="py-3.5 px-3 text-right font-bold text-gold-400 text-xs sm:text-sm">
                      ₹{item.totalRevenue.toLocaleString('en-IN')}
                    </td>

                    {/* Revenue Share */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 h-1.5 bg-charcoal-800 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className="h-full bg-gold-400 rounded-full" 
                            style={{ width: `${Math.min(100, item.revenueShare)}%` }} 
                          />
                        </div>
                        <span className="text-[11px] font-bold text-gray-300">{item.revenueShare}%</span>
                      </div>
                    </td>

                    {/* Advance Collected */}
                    <td className="py-3.5 px-3 text-right text-emerald-400 font-medium">
                      ₹{item.advancePaid.toLocaleString('en-IN')}
                    </td>

                    {/* Balance Due */}
                    <td className="py-3.5 px-3 text-right">
                      {item.remainingDue > 0 ? (
                        <span className="text-amber-400 font-bold">
                          ₹{item.remainingDue.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-gray-500">₹0</span>
                      )}
                    </td>

                    {/* Avg Ticket */}
                    <td className="py-3.5 px-3 text-center text-gray-300">
                      ₹{item.avgProjectTicket.toLocaleString('en-IN')}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-right">
                      {sObj && onSelectStudio ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudio(sObj);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-gold-500/20 text-gray-300 hover:text-gold-300 border border-white/10 hover:border-gold-500/30 text-[10px] font-mono flex items-center gap-1 ml-auto cursor-pointer transition-all"
                        >
                          <span>Ledger</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
