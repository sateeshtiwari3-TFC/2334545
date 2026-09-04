import React from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Zap, 
  Sparkles, 
  UserCheck, 
  Clock, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Editor, Project } from '../types';

export interface EditorLoadMetrics {
  activeCount: number;
  completedCount: number;
  totalAssigned: number;
  activeRatio: number; // Percentage of total projects that are active (0-100)
  completedRatio: number; // Percentage of total projects that are completed (0-100)
  urgentCount: number; // due in <= 3 days
  loadPercentage: number; // out of max standard load (e.g., 4 projects)
  status: 'available' | 'optimal' | 'busy' | 'overloaded';
  statusLabel: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  dotColor: string;
  barGradient: string;
  recommendation: string;
}

export const MAX_OPTIMAL_PROJECTS = 3;
export const MAX_CAPACITY_PROJECTS = 5;

export function calculateEditorLoad(editor: Editor, projects: Project[]): EditorLoadMetrics {
  const editorProjects = projects.filter(
    (p) => p.assignedEditorId === editor.id || (p.isSplitProject && p.secondEditorId === editor.id)
  );

  const completedCount = editorProjects.filter(
    (p) => p.status === 'delivered' || p.status === 'closed'
  ).length;

  const activeProjects = editorProjects.filter(
    (p) => p.status !== 'delivered' && p.status !== 'closed'
  );

  const activeCount = activeProjects.length;
  const totalAssigned = editorProjects.length;

  // Active vs Completed ratio calculation
  let activeRatio = 0;
  let completedRatio = 0;
  if (totalAssigned > 0) {
    activeRatio = Math.round((activeCount / totalAssigned) * 100);
    completedRatio = 100 - activeRatio;
  }

  const now = new Date().getTime();
  const urgentCount = activeProjects.filter((p) => {
    if (!p.deliveryDate) return false;
    const diffDays = Math.ceil((new Date(p.deliveryDate).getTime() - now) / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }).length;

  // Percentage based on a benchmark capacity of 4 projects (100%)
  const loadPercentage = Math.min(100, Math.round((activeCount / 4) * 100));

  if (activeCount === 0) {
    return {
      activeCount,
      completedCount,
      totalAssigned,
      activeRatio,
      completedRatio,
      urgentCount,
      loadPercentage: 0,
      status: 'available',
      statusLabel: 'Available (0 Active)',
      badgeBg: 'bg-emerald-500/15',
      badgeBorder: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      dotColor: 'bg-emerald-400',
      barGradient: 'from-emerald-500 to-emerald-400',
      recommendation: 'Ready for immediate assignment'
    };
  }

  if (activeCount <= 2) {
    return {
      activeCount,
      completedCount,
      totalAssigned,
      activeRatio,
      completedRatio,
      urgentCount,
      loadPercentage: activeCount === 1 ? 25 : 50,
      status: 'optimal',
      statusLabel: `Optimal Load (${activeCount} Active)`,
      badgeBg: 'bg-sky-500/15',
      badgeBorder: 'border-sky-500/30',
      textColor: 'text-sky-400',
      dotColor: 'bg-sky-400',
      barGradient: 'from-sky-500 to-cyan-400',
      recommendation: 'Healthy workflow balance'
    };
  }

  if (activeCount <= 4) {
    return {
      activeCount,
      completedCount,
      totalAssigned,
      activeRatio,
      completedRatio,
      urgentCount,
      loadPercentage: activeCount === 3 ? 75 : 90,
      status: 'busy',
      statusLabel: `Heavy Load (${activeCount} Active)`,
      badgeBg: 'bg-amber-500/15',
      badgeBorder: 'border-amber-500/30',
      textColor: 'text-amber-400',
      dotColor: 'bg-amber-400',
      barGradient: 'from-amber-500 to-yellow-400',
      recommendation: 'Moderate capacity remaining'
    };
  }

  return {
    activeCount,
    completedCount,
    totalAssigned,
    activeRatio,
    completedRatio,
    urgentCount,
    loadPercentage: 100,
    status: 'overloaded',
    statusLabel: `At Capacity (${activeCount} Active)`,
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-500/30',
    textColor: 'text-rose-400',
    dotColor: 'bg-rose-400',
    barGradient: 'from-rose-600 to-rose-400',
    recommendation: 'Overloaded — avoid assigning'
  };
}

interface EditorLoadIndicatorProps {
  editor: Editor;
  projects: Project[];
  variant?: 'card' | 'pill' | 'compact' | 'detailed';
  showBar?: boolean;
  className?: string;
}

export default function EditorLoadIndicator({
  editor,
  projects,
  variant = 'card',
  showBar = true,
  className = ''
}: EditorLoadIndicatorProps) {
  const metrics = calculateEditorLoad(editor, projects);
  const { activeCount, urgentCount, loadPercentage, statusLabel, badgeBg, badgeBorder, textColor, dotColor, barGradient, recommendation } = metrics;

  // 1. Pill Variant (compact status badge)
  if (variant === 'pill') {
    return (
      <span 
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeBg} ${badgeBorder} ${textColor} ${className}`}
        title={`Active Cuts: ${activeCount} | Recommendation: ${recommendation}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mr-1.5 animate-pulse`} />
        {statusLabel}
      </span>
    );
  }

  // 2. Compact Variant (for lists and tables)
  if (variant === 'compact') {
    return (
      <div className={`space-y-1.5 font-mono ${className}`}>
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center font-bold ${textColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} mr-1 ${activeCount > 0 ? 'animate-pulse' : ''}`} />
              {activeCount} Active ({metrics.activeRatio}%)
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-emerald-400 font-bold flex items-center space-x-0.5">
              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
              {metrics.completedCount} Done ({metrics.completedRatio}%)
            </span>
          </div>
          <span className="text-gray-400 font-semibold">{metrics.totalAssigned} Total</span>
        </div>
        {showBar && (
          <div className="w-full bg-charcoal-950/80 h-1.5 rounded-full overflow-hidden border border-white/5 flex gap-0.5">
            {metrics.totalAssigned === 0 ? (
              <div className="w-full h-full bg-charcoal-800/40 rounded-full" />
            ) : (
              <>
                {activeCount > 0 && (
                  <div 
                    className={`h-full bg-gradient-to-r ${barGradient} transition-all duration-500 rounded-l-full ${metrics.completedCount === 0 ? 'rounded-r-full' : ''}`}
                    style={{ width: `${metrics.activeRatio}%` }}
                    title={`Active: ${activeCount} (${metrics.activeRatio}%)`}
                  />
                )}
                {metrics.completedCount > 0 && (
                  <div 
                    className={`h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-r-full ${activeCount === 0 ? 'rounded-l-full' : ''}`}
                    style={{ width: `${metrics.completedRatio}%` }}
                    title={`Completed: ${metrics.completedCount} (${metrics.completedRatio}%)`}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // 3. Detailed Variant (for Profile Drawer)
  if (variant === 'detailed') {
    return (
      <div className={`p-4 rounded-2xl bg-charcoal-950/60 border ${badgeBorder} space-y-4 font-mono ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-xl ${badgeBg} ${textColor}`}>
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Editor Bandwidth & Load</span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className={`text-xs font-bold ${textColor}`}>{statusLabel}</span>
                {urgentCount > 0 && (
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded">
                    {urgentCount} Due Soon
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${badgeBg} ${badgeBorder} ${textColor}`}>
            {metrics.status.toUpperCase()}
          </span>
        </div>

        {/* 1. Multi-segment Real-time Capacity Meter */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Current Capacity Load ({activeCount} / 4 Benchmark Slots)</span>
            <span className="font-bold text-white">{loadPercentage}%</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 h-2">
            {[1, 2, 3, 4].map((slot) => {
              const isFilled = activeCount >= slot;
              const isOver = activeCount > 4 && slot === 4;
              return (
                <div 
                  key={slot}
                  className={`rounded-sm transition-all duration-300 ${
                    isOver 
                      ? 'bg-rose-500 animate-pulse' 
                      : isFilled 
                      ? `bg-gradient-to-r ${barGradient}` 
                      : 'bg-charcoal-800/80 border border-white/5'
                  }`}
                  title={`Slot ${slot}: ${isFilled ? 'Occupied' : 'Free'}`}
                />
              );
            })}
          </div>
        </div>

        {/* 2. Active vs Completed Ratio Bar */}
        <div className="p-3 bg-charcoal-900/60 rounded-xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400 uppercase tracking-wider font-semibold">Active vs Completed Ratio</span>
            <span className="text-gold-400 font-bold">{metrics.totalAssigned} Total Projects</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-sky-400 font-bold flex items-center space-x-1">
              <span className={`w-1.5 h-1.5 rounded-full bg-sky-400 ${activeCount > 0 ? 'animate-pulse' : ''}`} />
              <span>{activeCount} Active ({metrics.activeRatio}%)</span>
            </span>
            <span className="text-emerald-400 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{metrics.completedCount} Completed ({metrics.completedRatio}%)</span>
            </span>
          </div>

          {/* Dual Segmented Progress Track */}
          <div className="w-full bg-charcoal-950 h-2.5 rounded-full overflow-hidden border border-white/5 flex gap-0.5 p-0.5">
            {metrics.totalAssigned === 0 ? (
              <div className="w-full h-full bg-charcoal-800/40 rounded-full flex items-center justify-center text-[8px] text-gray-500">
                No Projects Assigned Yet
              </div>
            ) : (
              <>
                {activeCount > 0 && (
                  <div 
                    className={`h-full bg-gradient-to-r ${barGradient} transition-all duration-500 rounded-l-full ${metrics.completedCount === 0 ? 'rounded-r-full' : ''}`}
                    style={{ width: `${metrics.activeRatio}%` }}
                    title={`Active: ${activeCount} (${metrics.activeRatio}%)`}
                  />
                )}
                {metrics.completedCount > 0 && (
                  <div 
                    className={`h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-r-full ${activeCount === 0 ? 'rounded-l-full' : ''}`}
                    style={{ width: `${metrics.completedRatio}%` }}
                    title={`Completed: ${metrics.completedCount} (${metrics.completedRatio}%)`}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-gray-400">
          <span className="truncate">Status: {recommendation}</span>
          <span className="text-emerald-400 font-semibold">{metrics.completedCount} Delivered Cuts</span>
        </div>
      </div>
    );
  }

  // 4. Default Card Variant (for Editor Directory Cards)
  return (
    <div className={`space-y-2.5 font-mono ${className}`}>
      {/* Ratio Header Legend */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${dotColor} ${activeCount > 0 ? 'animate-pulse' : ''}`} />
          <span className={`font-bold ${textColor} text-xs`}>
            {activeCount === 0 ? '0 Active' : `${activeCount} Active`}
          </span>
          <span className="text-gray-600 text-[10px]">({metrics.activeRatio}%)</span>
        </div>

        <div className="flex items-center space-x-1 text-[10px]">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-emerald-400 font-bold">{metrics.completedCount} Done</span>
          <span className="text-gray-500 text-[9px]">({metrics.completedRatio}%)</span>
        </div>
      </div>

      {/* Dual Stacked Progress Bar: Active vs Completed */}
      {showBar && (
        <div className="w-full bg-charcoal-950/90 h-2 rounded-full overflow-hidden border border-white/5 flex gap-0.5 p-0.5">
          {metrics.totalAssigned === 0 ? (
            <div className="w-full h-full bg-charcoal-800/30 rounded-full" />
          ) : (
            <>
              {activeCount > 0 && (
                <div 
                  className={`h-full bg-gradient-to-r ${barGradient} transition-all duration-500 rounded-l-full ${metrics.completedCount === 0 ? 'rounded-r-full' : ''}`}
                  style={{ width: `${Math.max(8, metrics.activeRatio)}%` }}
                  title={`Active Projects: ${activeCount} (${metrics.activeRatio}%)`}
                />
              )}
              {metrics.completedCount > 0 && (
                <div 
                  className={`h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-r-full ${activeCount === 0 ? 'rounded-l-full' : ''}`}
                  style={{ width: `${Math.max(8, metrics.completedRatio)}%` }}
                  title={`Completed Projects: ${metrics.completedCount} (${metrics.completedRatio}%)`}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Quick helper recommendation & total count */}
      <div className="flex items-center justify-between text-[9px] text-gray-400">
        <span className="truncate flex items-center space-x-1">
          {urgentCount > 0 ? (
            <span className="text-rose-400 font-bold">
              ⚡ {urgentCount} urgent due
            </span>
          ) : (
            <span className="text-gray-500">{recommendation}</span>
          )}
        </span>
        <span className="text-gray-400 font-semibold shrink-0 ml-1">
          {metrics.totalAssigned} Total Cuts
        </span>
      </div>
    </div>
  );
}
