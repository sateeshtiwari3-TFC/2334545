import React from 'react';
import { 
  Film, 
  Calendar, 
  Clock, 
  TrendingUp, 
  IndianRupee, 
  AlertTriangle, 
  TrendingDown, 
  Sparkles, 
  Layers, 
  ArrowUpRight,
  ShieldAlert,
  Zap,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardKpiGridProps {
  totalProjectsCount: number;
  completedProjectsCount: number;
  pendingProjectsCount: number;
  totalProjectsThisMonthCount: number;
  completedThisMonthCount: number;
  activeThisMonthCount: number;
  activeProjectsCount: number;
  totalRevenue: number;
  totalOutstandingBalance: number;
  projectsWithOutstandingBalanceCount: number;
  urgentRevisionPendingCount: number;
  allRevisionsPendingCount: number;
  totalExpenses: number;
  manualExpensesTotal: number;
  totalProfit: number;
  activeStudiosCount: number;
  activeEditorsCount: number;
  onNavigateTab?: (tab: string, subAction?: string) => void;
}

export default function DashboardKpiGrid({
  totalProjectsCount,
  completedProjectsCount,
  pendingProjectsCount,
  totalProjectsThisMonthCount,
  completedThisMonthCount,
  activeThisMonthCount,
  activeProjectsCount,
  totalRevenue,
  totalOutstandingBalance,
  projectsWithOutstandingBalanceCount,
  urgentRevisionPendingCount,
  allRevisionsPendingCount,
  totalExpenses,
  manualExpensesTotal,
  totalProfit,
  activeStudiosCount,
  activeEditorsCount,
  onNavigateTab
}: DashboardKpiGridProps) {
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';
  const deliveryRate = totalProjectsCount > 0 ? Math.round((completedProjectsCount / totalProjectsCount) * 100) : 0;

  const cards = [
    {
      id: 'active-pipeline',
      title: 'Active Video Pipeline',
      value: activeProjectsCount,
      unit: 'Films',
      sub: `${pendingProjectsCount} in post-production`,
      progress: Math.min(100, Math.round((activeProjectsCount / Math.max(1, totalProjectsCount)) * 100)),
      badge: `${deliveryRate}% Delivered`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: Clock,
      gradient: 'from-[#0d261e] via-[#091a14] to-[#040e0b]',
      border: 'border-emerald-500/40 hover:border-emerald-400/80',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      accentColor: 'from-emerald-500 to-teal-400',
      action: () => onNavigateTab && onNavigateTab('projects'),
      actionLabel: 'Explore Pipeline'
    },
    {
      id: 'projects-this-month',
      title: 'Monthly Film Velocity',
      value: totalProjectsThisMonthCount,
      unit: 'This Month',
      sub: `${completedThisMonthCount} delivered • ${activeThisMonthCount} active`,
      progress: totalProjectsThisMonthCount > 0 ? Math.round((completedThisMonthCount / totalProjectsThisMonthCount) * 100) : 0,
      badge: `${completedThisMonthCount} Closed`,
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: Calendar,
      gradient: 'from-[#0d2233] via-[#081724] to-[#040c14]',
      border: 'border-sky-500/40 hover:border-sky-400/80',
      iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      accentColor: 'from-sky-500 to-cyan-400',
      action: () => onNavigateTab && onNavigateTab('calendar'),
      actionLabel: 'View Schedule'
    },
    {
      id: 'gross-revenue',
      title: 'Gross Revenue Contracts',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      unit: '',
      sub: `Across ${totalProjectsCount} contracted wedding films`,
      progress: 100,
      badge: `₹${Math.round(totalRevenue / Math.max(1, totalProjectsCount)).toLocaleString('en-IN')} / film avg`,
      badgeColor: 'bg-gold-500/20 text-gold-300 border-gold-500/40',
      icon: TrendingUp,
      gradient: 'from-[#2a220f] via-[#1a1508] to-[#0d0a03]',
      border: 'border-gold-500/40 hover:border-gold-400/80',
      iconBg: 'bg-gold-500/15 text-gold-400 border-gold-500/30',
      accentColor: 'from-gold-500 to-amber-400',
      action: () => onNavigateTab && onNavigateTab('finance'),
      actionLabel: 'Open Ledger'
    },
    {
      id: 'outstanding-balance',
      title: 'Receivables Outstanding',
      value: `₹${totalOutstandingBalance.toLocaleString('en-IN')}`,
      unit: '',
      sub: `${projectsWithOutstandingBalanceCount} studio partners with balance`,
      progress: totalRevenue > 0 ? Math.min(100, Math.round((totalOutstandingBalance / totalRevenue) * 100)) : 0,
      badge: totalOutstandingBalance > 0 ? `${projectsWithOutstandingBalanceCount} Pending Dues` : 'All Settled',
      badgeColor: totalOutstandingBalance > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: IndianRupee,
      gradient: totalOutstandingBalance > 0 ? 'from-[#2e1d0f] via-[#1c1108] to-[#0e0703]' : 'from-[#0d261e] via-[#091a14] to-[#040e0b]',
      border: totalOutstandingBalance > 0 ? 'border-amber-500/50 hover:border-amber-400' : 'border-emerald-500/40 hover:border-emerald-400',
      iconBg: totalOutstandingBalance > 0 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      accentColor: totalOutstandingBalance > 0 ? 'from-amber-500 to-orange-400' : 'from-emerald-500 to-teal-400',
      action: () => onNavigateTab && onNavigateTab('finance'),
      actionLabel: 'Collect Balances'
    },
    {
      id: 'urgent-revisions',
      title: 'Urgent Revision Radar',
      value: urgentRevisionPendingCount,
      unit: 'High Priority',
      sub: `${allRevisionsPendingCount} total revisions logged in queue`,
      progress: allRevisionsPendingCount > 0 ? Math.round((urgentRevisionPendingCount / allRevisionsPendingCount) * 100) : 0,
      badge: urgentRevisionPendingCount > 0 ? 'Action Required' : 'Queue Clear',
      badgeColor: urgentRevisionPendingCount > 0 ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 animate-pulse' : 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: AlertTriangle,
      gradient: urgentRevisionPendingCount > 0 ? 'from-[#331118] via-[#1f090e] to-[#0f0407]' : 'from-[#1c152d] via-[#100b1c] to-[#07040d]',
      border: urgentRevisionPendingCount > 0 ? 'border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:border-rose-400' : 'border-purple-500/40 hover:border-purple-400',
      iconBg: urgentRevisionPendingCount > 0 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      accentColor: urgentRevisionPendingCount > 0 ? 'from-rose-500 to-pink-500' : 'from-purple-500 to-indigo-400',
      action: () => onNavigateTab && onNavigateTab('projects'),
      actionLabel: 'Inspect Queue'
    },
    {
      id: 'total-profit',
      title: 'Net Profit Yield',
      value: `₹${totalProfit.toLocaleString('en-IN')}`,
      unit: '',
      sub: `${profitMargin}% overall studio profit margin`,
      progress: Math.min(100, Math.max(0, Math.round(Number(profitMargin)))),
      badge: `${profitMargin}% Margin`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: Sparkles,
      gradient: 'from-[#122b1f] via-[#0a1b13] to-[#040d09]',
      border: 'border-emerald-500/40 hover:border-emerald-400/80',
      iconBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      accentColor: 'from-emerald-400 to-gold-400',
      action: () => onNavigateTab && onNavigateTab('finance'),
      actionLabel: 'Profit Matrix'
    },
    {
      id: 'total-expenses',
      title: 'Operational Cost Outflow',
      value: `₹${totalExpenses.toLocaleString('en-IN')}`,
      unit: '',
      sub: `₹${manualExpensesTotal.toLocaleString('en-IN')} overhead & hard disks`,
      progress: totalRevenue > 0 ? Math.min(100, Math.round((totalExpenses / totalRevenue) * 100)) : 0,
      badge: `${totalRevenue > 0 ? Math.round((totalExpenses / totalRevenue) * 100) : 0}% of Bookings`,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
      icon: TrendingDown,
      gradient: 'from-[#2b1619] via-[#1a0c0e] to-[#0c0506]',
      border: 'border-red-500/40 hover:border-red-400/80',
      iconBg: 'bg-red-500/15 text-red-400 border-red-500/30',
      accentColor: 'from-red-500 to-rose-400',
      action: () => onNavigateTab && onNavigateTab('finance'),
      actionLabel: 'View Outflows'
    },
    {
      id: 'alliances',
      title: 'Studio & Editor Alliance',
      value: activeStudiosCount + activeEditorsCount,
      unit: 'Partners',
      sub: `${activeStudiosCount} studios • ${activeEditorsCount} video editors`,
      progress: 100,
      badge: `${activeStudiosCount} B2B Studios`,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: Layers,
      gradient: 'from-[#191933] via-[#0e0e21] to-[#060612]',
      border: 'border-indigo-500/40 hover:border-indigo-400/80',
      iconBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      accentColor: 'from-indigo-500 to-blue-400',
      action: () => onNavigateTab && onNavigateTab('studios'),
      actionLabel: 'Manage Alliances'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Grid of Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              onClick={card.action}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${card.gradient} border ${card.border} p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col justify-between`}
            >
              {/* Ambient radial lighting on hover */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all pointer-events-none" />

              {/* Card Top: Icon & Badge */}
              <div className="flex items-center justify-between w-full gap-2 relative z-10">
                <div className={`p-2.5 rounded-2xl border ${card.iconBg} shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border font-semibold ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>

              {/* Card Mid: Main Metric (Centered) */}
              <div className="my-4 relative z-10 space-y-1 text-center flex flex-col items-center justify-center w-full min-w-0">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 block font-semibold text-center truncate max-w-full">
                  {card.title}
                </span>
                <div className="flex items-baseline justify-center space-x-1.5 w-full min-w-0 px-1">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-white tracking-tight text-center truncate max-w-full">
                    {card.value}
                  </h3>
                  {card.unit && (
                    <span className="text-xs font-mono text-gray-400 font-normal shrink-0">{card.unit}</span>
                  )}
                </div>
                <p className="text-xs text-gray-300 font-light text-center truncate max-w-full">{card.sub}</p>
              </div>

              {/* Card Bottom: Micro Progress Bar & Quick Action (Centered) */}
              <div className="pt-3 border-t border-white/10 relative z-10 space-y-2 w-full">
                {/* Progress track */}
                <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden border border-white/5">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${card.accentColor} transition-all duration-700 mx-auto`}
                    style={{ width: `${Math.max(5, Math.min(100, card.progress))}%` }}
                  />
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-mono group-hover:text-gold-300 transition-colors text-center">
                  <span>{card.actionLabel}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
