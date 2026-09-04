import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, AlertOctagon, CheckCircle2, IndianRupee, HelpCircle } from 'lucide-react';
import { Project } from '../types';

interface BudgetVarianceIndicatorProps {
  project: Project;
  variant?: 'card' | 'compact' | 'pill' | 'detailed';
  showDetails?: boolean;
  className?: string;
}

export interface VarianceMetrics {
  projectAmount: number;
  editorPayment: number;
  otherExpenses: number;
  totalCosts: number;
  variance: number;
  marginPercent: number;
  isNegative: boolean;
  isLowMargin: boolean;
  isHealthy: boolean;
  statusLabel: 'Deficit' | 'Low Margin' | 'Healthy Margin';
}

export function calculateBudgetVariance(project: Project): VarianceMetrics {
  const projectAmount = Number(project.projectAmount) || 0;
  
  const editorPayment = project.isSplitProject
    ? ((Number(project.firstEditorShare) || 0) + (Number(project.secondEditorShare) || 0)) || (Number(project.editorPayment) || 0)
    : (Number(project.editorPayment) || 0);

  const otherExpenses = Number(project.otherExpenses) || 0;
  const totalCosts = editorPayment + otherExpenses;
  const variance = projectAmount - totalCosts;
  
  const marginPercent = projectAmount > 0 ? Math.round((variance / projectAmount) * 100) : 0;
  const isNegative = variance < 0;
  const isLowMargin = !isNegative && (marginPercent < 30 || (projectAmount > 0 && variance < 5000));
  const isHealthy = !isNegative && !isLowMargin;

  let statusLabel: 'Deficit' | 'Low Margin' | 'Healthy Margin' = 'Healthy Margin';
  if (isNegative) {
    statusLabel = 'Deficit';
  } else if (isLowMargin) {
    statusLabel = 'Low Margin';
  }

  return {
    projectAmount,
    editorPayment,
    otherExpenses,
    totalCosts,
    variance,
    marginPercent,
    isNegative,
    isLowMargin,
    isHealthy,
    statusLabel
  };
}

export default function BudgetVarianceIndicator({
  project,
  variant = 'card',
  showDetails = true,
  className = ''
}: BudgetVarianceIndicatorProps) {
  const metrics = calculateBudgetVariance(project);
  const { projectAmount, totalCosts, variance, marginPercent, isNegative, isLowMargin, isHealthy } = metrics;

  // Status Styling config
  const statusConfig = isNegative
    ? {
        bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
        badgeBg: 'bg-rose-500/25 text-rose-200 border-rose-500/40',
        barColor: 'bg-rose-500',
        icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
        label: 'Deficit / Over Budget',
        tagText: 'Deficit'
      }
    : isLowMargin
    ? {
        bg: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
        badgeBg: 'bg-amber-500/25 text-amber-200 border-amber-500/40',
        barColor: 'bg-amber-400',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
        label: 'Low Margin Alert (<30%)',
        tagText: 'Low Margin'
      }
    : {
        bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
        badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
        barColor: 'bg-emerald-400',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
        label: 'Healthy Margin',
        tagText: 'Healthy'
      };

  // 1. Pill Variant (for tables, headers, list views)
  if (variant === 'pill') {
    return (
      <div 
        className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg border font-mono text-[10px] font-bold ${statusConfig.bg} ${className}`}
        title={`Project: ₹${projectAmount.toLocaleString('en-IN')} | Costs: ₹${totalCosts.toLocaleString('en-IN')} | Variance: ₹${variance.toLocaleString('en-IN')} (${marginPercent}%)`}
      >
        {statusConfig.icon}
        <span>
          {isNegative ? '-' : '+'}₹{Math.abs(variance).toLocaleString('en-IN')}
        </span>
        <span className="opacity-80">({marginPercent}%)</span>
        {isLowMargin && (
          <span className="ml-1 text-[8px] uppercase tracking-wider bg-amber-500/30 text-amber-200 px-1 py-0.2 rounded font-bold">
            Low
          </span>
        )}
      </div>
    );
  }

  // 2. Compact Variant (for Kanban cards or sidebar drawers)
  if (variant === 'compact') {
    return (
      <div 
        className={`p-2 rounded-xl border flex items-center justify-between font-mono text-[10px] ${statusConfig.bg} ${className}`}
        title={`Project: ₹${projectAmount.toLocaleString('en-IN')} - Costs: ₹${totalCosts.toLocaleString('en-IN')} = Variance: ₹${variance.toLocaleString('en-IN')}`}
      >
        <div className="flex items-center space-x-1.5 min-w-0">
          {statusConfig.icon}
          <div className="truncate">
            <span className="font-semibold">{statusConfig.tagText}: </span>
            <span className="font-bold">
              {isNegative ? '-' : '+'}₹{Math.abs(variance).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        <span className={`px-1.5 py-0.5 rounded font-bold ${statusConfig.badgeBg} shrink-0 ml-1.5`}>
          {marginPercent}%
        </span>
      </div>
    );
  }

  // 3. Full Card Strip Variant (for Portfolio Grid Cards)
  return (
    <div 
      className={`rounded-2xl border p-2.5 space-y-2 text-xs font-mono transition-all ${statusConfig.bg} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header: Variance Title & Status Tag */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center space-x-1.5">
          {statusConfig.icon}
          <span className="font-bold uppercase tracking-wider text-gray-300">Budget Variance</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider border ${statusConfig.badgeBg}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Figures Breakdown */}
      <div className="flex items-baseline justify-between pt-0.5">
        <div>
          <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Net Studio Margin</span>
          <div className="text-xs sm:text-sm font-bold flex items-center space-x-1 mt-0.5">
            <span className={isNegative ? 'text-rose-400' : isLowMargin ? 'text-amber-300' : 'text-emerald-300'}>
              {isNegative ? '-' : '+'}₹{Math.abs(variance).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-gray-400 font-normal">
              ({marginPercent}% profit)
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Project vs Costs</span>
          <span className="text-[10px] text-gray-300 font-semibold mt-0.5 block">
            ₹{projectAmount.toLocaleString('en-IN')} <span className="text-gray-500">/</span> ₹{totalCosts.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Visual Cost vs Revenue Ratio Bar */}
      <div className="w-full bg-charcoal-950/80 h-1.5 rounded-full overflow-hidden border border-white/5 flex">
        <div 
          className="bg-gray-600 h-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, projectAmount > 0 ? (totalCosts / projectAmount) * 100 : 0))}%` }}
          title={`Total Costs: ₹${totalCosts.toLocaleString('en-IN')}`}
        />
        <div 
          className={`${statusConfig.barColor} h-full transition-all flex-1`}
          title={`Net Variance Margin: ₹${variance.toLocaleString('en-IN')}`}
        />
      </div>

      {/* Subtext explaining costs breakdown */}
      {showDetails && (
        <div className="flex justify-between text-[9px] text-gray-400 pt-0.5 border-t border-white/5">
          <span>Editor Fee: ₹{metrics.editorPayment.toLocaleString('en-IN')}</span>
          <span>Other Exp: ₹{metrics.otherExpenses.toLocaleString('en-IN')}</span>
        </div>
      )}
    </div>
  );
}
