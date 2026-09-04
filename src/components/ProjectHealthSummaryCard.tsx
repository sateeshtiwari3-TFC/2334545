import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  TrendingUp, 
  ShieldAlert, 
  ArrowUpRight, 
  MessageSquare, 
  Copy, 
  Check, 
  Zap, 
  ChevronRight, 
  AlertCircle,
  Film,
  Calendar,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Studio, Editor, PaymentHistory } from '../types';
import ProjectStatusBadge from './ProjectStatusBadge';

export interface UrgentActionItem {
  id?: string;
  title: string;
  description: string;
  urgency: 'critical' | 'high' | 'medium';
  category?: 'balance_due' | 'deadline_risk' | 'editor_delay' | 'overdue_delivery';
  relatedProjectId?: string;
  relatedProjectName?: string;
  actionType?: 'collect_payment' | 'remind_editor' | 'whatsapp_client' | 'reschedule';
  suggestedActionText?: string;
}

export interface KeyHighlightItem {
  title: string;
  detail: string;
  type: 'positive' | 'warning' | 'alert';
}

export interface ProjectHealthData {
  healthScore: number;
  healthStatus: 'Optimal' | 'Good' | 'Needs Attention' | 'Critical Risk';
  healthStatusColor: 'emerald' | 'amber' | 'rose';
  executiveSummary: string;
  urgentActions: UrgentActionItem[];
  keyHighlights: KeyHighlightItem[];
  financialRiskSummary: {
    totalUnpaidAtRisk: number;
    unpaidNearDeadlineCount: number;
    insight: string;
  };
  timelineRiskSummary: {
    overdueCount: number;
    dueWithin3DaysCount: number;
    insight: string;
  };
}

interface ProjectHealthSummaryCardProps {
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  payments: PaymentHistory[];
  onOpenPaymentModal?: (type: 'studio' | 'editor', entityId?: string, projectId?: string, amount?: number) => void;
  onInspectProject?: (project: Project) => void;
  onQuickAction?: (tab: string, subAction?: string) => void;
  className?: string;
}

export default function ProjectHealthSummaryCard({
  projects,
  studios,
  editors,
  payments,
  onOpenPaymentModal,
  onInspectProject,
  onQuickAction,
  className = ''
}: ProjectHealthSummaryCardProps) {
  const [healthData, setHealthData] = useState<ProjectHealthData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'urgent' | 'financials' | 'timeline' | 'highlights'>('urgent');
  const [copiedActionId, setCopiedActionId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Compute instantaneous heuristic health metrics as robust client-side fallback
  const fallbackHealthData = useMemo<ProjectHealthData>(() => {
    const now = Date.now();
    const activeProjects = projects.filter(p => p.status !== 'closed' && p.status !== 'delivered');
    
    let overdueCount = 0;
    let dueSoonCount = 0;
    let totalUnpaidAtRisk = 0;
    let unpaidNearDeadlineCount = 0;
    const actions: UrgentActionItem[] = [];
    const highlights: KeyHighlightItem[] = [];

    activeProjects.forEach(p => {
      const remBal = p.remainingBalance !== undefined && p.remainingBalance !== null 
        ? Number(p.remainingBalance) 
        : Math.max(0, (Number(p.projectAmount) || 0) - (Number(p.advancePayment) || 0));

      const deliveryTime = p.deliveryDate ? new Date(p.deliveryDate).getTime() : 0;
      const daysLeft = deliveryTime ? Math.ceil((deliveryTime - now) / (1000 * 3600 * 24)) : 999;

      const isOverdue = deliveryTime > 0 && daysLeft < 0;
      const isDueSoon = deliveryTime > 0 && daysLeft >= 0 && daysLeft <= 3;

      if (isOverdue) overdueCount++;
      if (isDueSoon) dueSoonCount++;

      // Evaluate high-risk balance (overdue or due in <=3 days with pending balance)
      if ((isOverdue || isDueSoon) && remBal > 0) {
        unpaidNearDeadlineCount++;
        totalUnpaidAtRisk += remBal;

        actions.push({
          id: `act-pay-${p.id}`,
          title: `Collect ₹${remBal.toLocaleString('en-IN')} Due (${p.coupleName})`,
          description: `Delivery is ${isOverdue ? `${Math.abs(daysLeft)}d overdue` : `due in ${daysLeft}d`}. Studio balance remains unpaid.`,
          urgency: isOverdue ? 'critical' : 'high',
          category: 'balance_due',
          relatedProjectId: p.id,
          relatedProjectName: p.coupleName,
          actionType: 'collect_payment',
          suggestedActionText: `Collect ₹${remBal.toLocaleString('en-IN')} payment from ${p.studioName || 'Studio'}`
        });
      }

      // Check overdue editing deadline
      if (isOverdue && p.status !== 'delivered') {
        actions.push({
          id: `act-edit-${p.id}`,
          title: `Overdue Cut: ${p.coupleName}`,
          description: `Film delivery was scheduled for ${p.deliveryDate}. Current status: ${p.status.toUpperCase().replace('_', ' ')}.`,
          urgency: 'critical',
          category: 'overdue_delivery',
          relatedProjectId: p.id,
          relatedProjectName: p.coupleName,
          actionType: 'remind_editor',
          suggestedActionText: `Follow up with editor ${p.assignedEditorName || 'Lead Editor'}`
        });
      }

      // Check urgent priority
      if ((p.priority === 'urgent' || p.priority === 'high') && !isOverdue && daysLeft <= 5) {
        actions.push({
          id: `act-prio-${p.id}`,
          title: `High Priority: ${p.coupleName}`,
          description: `${p.priority.toUpperCase()} priority wedding cut due on ${p.deliveryDate}.`,
          urgency: 'high',
          category: 'deadline_risk',
          relatedProjectId: p.id,
          relatedProjectName: p.coupleName,
          actionType: 'remind_editor',
          suggestedActionText: `Review timeline with editor ${p.assignedEditorName || 'assigned team'}`
        });
      }
    });

    // Score deduction math
    let score = 100;
    score -= (overdueCount * 18);
    score -= (unpaidNearDeadlineCount * 10);
    score -= (dueSoonCount * 4);
    score = Math.max(15, Math.min(100, score));

    let status: 'Optimal' | 'Good' | 'Needs Attention' | 'Critical Risk' = 'Optimal';
    let color: 'emerald' | 'amber' | 'rose' = 'emerald';

    if (score >= 85) {
      status = 'Optimal';
      color = 'emerald';
    } else if (score >= 68) {
      status = 'Good';
      color = 'emerald';
    } else if (score >= 45) {
      status = 'Needs Attention';
      color = 'amber';
    } else {
      status = 'Critical Risk';
      color = 'rose';
    }

    if (overdueCount === 0 && unpaidNearDeadlineCount === 0) {
      highlights.push({
        title: 'Zero Overdue Cuts',
        detail: 'All ongoing wedding films are currently within their scheduled delivery windows.',
        type: 'positive'
      });
    } else {
      highlights.push({
        title: `${overdueCount} Overdue Deliveries`,
        detail: `Require immediate editor escalation and client timeline realignment.`,
        type: 'alert'
      });
    }

    if (totalUnpaidAtRisk > 0) {
      highlights.push({
        title: `₹${totalUnpaidAtRisk.toLocaleString('en-IN')} Unpaid Exposure`,
        detail: `Pending receivables across ${unpaidNearDeadlineCount} project(s) nearing or past delivery deadline.`,
        type: 'warning'
      });
    } else {
      highlights.push({
        title: 'Healthy Receivables Flow',
        detail: 'No high-risk unpaid balances detected on imminent project deliveries.',
        type: 'positive'
      });
    }

    return {
      healthScore: score,
      healthStatus: status,
      healthStatusColor: color,
      executiveSummary: overdueCount > 0 || unpaidNearDeadlineCount > 0
        ? `Production queue requires administrative attention. ${overdueCount} project(s) are past deadline with ₹${totalUnpaidAtRisk.toLocaleString('en-IN')} in pending client balances at risk.`
        : `Studio production pipeline is operating smoothly across ${activeProjects.length} active cuts with healthy delivery margins.`,
      urgentActions: actions.slice(0, 5),
      keyHighlights: highlights,
      financialRiskSummary: {
        totalUnpaidAtRisk,
        unpaidNearDeadlineCount,
        insight: totalUnpaidAtRisk > 0 
          ? `Immediate recovery of ₹${totalUnpaidAtRisk.toLocaleString('en-IN')} recommended prior to releasing final master film exports.`
          : `Financial cashflow is stabilized with timely client advance payments.`
      },
      timelineRiskSummary: {
        overdueCount,
        dueWithin3DaysCount: dueSoonCount,
        insight: overdueCount > 0
          ? `${overdueCount} film(s) have slipped past deadline. Prioritize rendering and review stages today.`
          : `All delivery milestones are paced steadily for the upcoming week.`
      }
    };
  }, [projects]);

  // Fetch AI-powered project health analysis from Gemini backend
  const fetchGeminiProjectHealth = useCallback(async (isUserTriggered = false) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const activeProjects = projects.filter(p => p.status !== 'closed');
      
      const payloadProjects = activeProjects.map(p => {
        const remBal = p.remainingBalance !== undefined && p.remainingBalance !== null 
          ? Number(p.remainingBalance) 
          : Math.max(0, (Number(p.projectAmount) || 0) - (Number(p.advancePayment) || 0));
        
        return {
          id: p.id,
          coupleName: p.coupleName,
          projectName: p.projectName,
          studioName: p.studioName,
          status: p.status,
          priority: p.priority,
          deliveryDate: p.deliveryDate,
          shootDate: p.shootDate,
          paymentDueDate: p.paymentDueDate,
          projectAmount: p.projectAmount,
          advancePayment: p.advancePayment,
          remainingBalance: remBal,
          editorName: p.assignedEditorName || 'Unassigned',
          editorPayment: p.editorPayment
        };
      });

      const stats = {
        totalProjects: projects.length,
        activeProjectsCount: activeProjects.length,
        totalRevenue: projects.reduce((sum, p) => sum + (p.projectAmount || 0), 0),
        totalPaymentsLogged: payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      };

      const res = await fetch('/api/gemini/project-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects: payloadProjects,
          stats,
          currentDate: new Date().toISOString().split('T')[0]
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const result = await res.json();
      if (result.success && result.data) {
        setHealthData(result.data);
        setLastAnalyzedAt(new Date());
      } else {
        throw new Error(result.error || 'Invalid health data returned');
      }
    } catch (err: any) {
      console.warn('Gemini Health API call failed, using client-side analysis:', err.message);
      // Seamlessly populate fallback
      setHealthData(fallbackHealthData);
      setLastAnalyzedAt(new Date());
      if (isUserTriggered) {
        setApiError('AI model busy. Active fallback calculation is loaded.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [projects, payments, fallbackHealthData]);

  // Initial load
  useEffect(() => {
    fetchGeminiProjectHealth();
  }, [fetchGeminiProjectHealth]);

  // Active data to display (Gemini result if present, otherwise immediate heuristic fallback)
  const currentHealth = healthData || fallbackHealthData;

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', ring: 'stroke-emerald-400' };
    if (score >= 55) return { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', ring: 'stroke-amber-400' };
    return { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40', ring: 'stroke-rose-400' };
  };

  const scoreTheme = getScoreColor(currentHealth.healthScore);

  // SVG Circular progress stroke calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentHealth.healthScore / 100) * circumference;

  // Handle Action Trigger
  const handleExecuteAction = (action: UrgentActionItem) => {
    if (action.actionType === 'collect_payment') {
      const project = projects.find(p => p.id === action.relatedProjectId);
      if (project && onOpenPaymentModal) {
        const remBal = project.remainingBalance !== undefined && project.remainingBalance !== null
          ? Number(project.remainingBalance)
          : Math.max(0, (Number(project.projectAmount) || 0) - (Number(project.advancePayment) || 0));
        onOpenPaymentModal('studio', project.studioId || '', project.id, remBal);
        return;
      }
    }

    if (action.actionType === 'whatsapp_client') {
      const project = projects.find(p => p.id === action.relatedProjectId);
      const studio = studios.find(s => s.id === project?.studioId);
      const phone = studio?.phone ? studio.phone.replace(/\D/g, '') : '';
      const text = encodeURIComponent(
        `🙏 Namaste ${studio?.name || 'Team'}!\n\n` +
        `This is a health alert check from *The Frame Cut Studio* regarding *${project?.coupleName || 'Wedding Film'}*:\n` +
        `• ${action.description}\n\n` +
        `Kindly assist with the required milestone update. Thank you!`
      );
      const waUrl = phone.length >= 10 ? `https://wa.me/${phone.length === 10 ? `91${phone}` : phone}?text=${text}` : `https://wa.me/?text=${text}`;
      window.open(waUrl, '_blank');
      return;
    }

    if (action.actionType === 'remind_editor') {
      const project = projects.find(p => p.id === action.relatedProjectId);
      const text = `Hi ${project?.assignedEditorName || 'Editor Team'}, checking in from Frame Cut Studio on ${project?.coupleName}'s cut timeline. Status: ${project?.status?.toUpperCase() || 'IN PROGRESS'}. Due: ${project?.deliveryDate || 'ASAP'}. Kindly update progress. Thanks!`;
      navigator.clipboard.writeText(text);
      if (action.id) {
        setCopiedActionId(action.id);
        setTimeout(() => setCopiedActionId(null), 2500);
      }
      return;
    }

    // Default inspect
    if (action.relatedProjectId) {
      const project = projects.find(p => p.id === action.relatedProjectId);
      if (project && onInspectProject) {
        onInspectProject(project);
      }
    }
  };

  return (
    <div className={`rounded-3xl bg-gradient-to-br from-charcoal-950 via-luxury-green-950/90 to-charcoal-900 border border-gold-500/30 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Ambient Visual Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-gold-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-luxury-green-900/20 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-gold-500 via-emerald-500 to-amber-500 shadow-[0_0_15px_#d4af37]" />

      <div className="p-5 md:p-7 relative z-10 space-y-6">
        
        {/* TOP HEADER: AI BADGE, TITLE & REFRESH ACTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-500/20 to-emerald-500/20 border border-gold-500/40 text-gold-400 flex items-center justify-center shadow-lg shrink-0">
              <Sparkles className="w-6 h-6 text-gold-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-gold-300 bg-gold-500/20 px-2 py-0.5 rounded-md border border-gold-500/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-gold-400 inline" />
                  <span>GEMINI AI INTELLIGENCE</span>
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {lastAnalyzedAt ? `Updated ${lastAnalyzedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live Analysis'}
                </span>
              </div>
              <h2 className="text-lg md:text-2xl font-bold font-display text-white mt-1 flex items-center gap-2">
                <span>Project Health & Risk Evaluation</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center">
            {apiError && (
              <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 hidden lg:inline">
                {apiError}
              </span>
            )}

            <button
              onClick={() => fetchGeminiProjectHealth(true)}
              disabled={isLoading}
              className="px-3.5 py-2 bg-black/40 hover:bg-black/70 text-gold-300 border border-gold-500/30 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              title="Re-analyze project health using Gemini AI"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gold-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analyzing...' : 'Re-Evaluate'}</span>
            </button>
          </div>
        </div>

        {/* HERO METRICS GRID: SCORE GAUGE + EXECUTIVE SUMMARY + QUICK PILLS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* 1. Health Score Circular Gauge (3 cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="relative flex items-center justify-center my-2">
              <svg className="w-28 h-28 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-white/10"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Dynamic Ring */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className={`${scoreTheme.ring} transition-all duration-1000 ease-out`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-extrabold font-sans tracking-tight ${scoreTheme.text}`}>
                  {currentHealth.healthScore}
                </span>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest -mt-0.5">
                  / 100
                </span>
              </div>
            </div>

            <div className="mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${scoreTheme.bg} ${scoreTheme.text} ${scoreTheme.border}`}>
                {currentHealth.healthStatus}
              </span>
              <p className="text-[10px] text-gray-400 font-mono mt-1.5">
                Composite Balance & Schedule Index
              </p>
            </div>
          </div>

          {/* 2. Executive AI Analysis Narrative (8 cols) */}
          <div className="lg:col-span-8 p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gold-400 font-bold flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-gold-400" />
                  <span>Executive AI Synthesis</span>
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {projects.filter(p => !['delivered', 'closed'].includes(p.status)).length} Active Cuts Indexed
                </span>
              </div>
              <p className="text-sm md:text-base text-gray-200 font-sans leading-relaxed">
                {currentHealth.executiveSummary}
              </p>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-white/10">
              <div className="p-2.5 rounded-xl bg-charcoal-900/80 border border-white/5">
                <span className="text-[9px] font-mono text-gray-400 uppercase block">Pending Due Exposure</span>
                <span className={`text-sm md:text-base font-bold font-mono mt-0.5 block ${currentHealth.financialRiskSummary.totalUnpaidAtRisk > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ₹{currentHealth.financialRiskSummary.totalUnpaidAtRisk.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-charcoal-900/80 border border-white/5">
                <span className="text-[9px] font-mono text-gray-400 uppercase block">Overdue Deliveries</span>
                <span className={`text-sm md:text-base font-bold font-mono mt-0.5 block ${currentHealth.timelineRiskSummary.overdueCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {currentHealth.timelineRiskSummary.overdueCount} Film{currentHealth.timelineRiskSummary.overdueCount === 1 ? '' : 's'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-charcoal-900/80 border border-white/5 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-mono text-gray-400 uppercase block">Due in &le; 3 Days</span>
                <span className={`text-sm md:text-base font-bold font-mono mt-0.5 block ${currentHealth.timelineRiskSummary.dueWithin3DaysCount > 0 ? 'text-amber-400' : 'text-gray-300'}`}>
                  {currentHealth.timelineRiskSummary.dueWithin3DaysCount} Project{currentHealth.timelineRiskSummary.dueWithin3DaysCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* INTERACTIVE TABS BAR */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
          <div className="flex space-x-1.5">
            <button
              onClick={() => setActiveTab('urgent')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'urgent'
                  ? 'bg-gold-500 text-charcoal-950 shadow-md'
                  : 'text-gray-400 hover:text-white bg-black/30'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Urgent Actions ({currentHealth.urgentActions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('financials')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'financials'
                  ? 'bg-gold-500 text-charcoal-950 shadow-md'
                  : 'text-gray-400 hover:text-white bg-black/30'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Financial Health</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'bg-gold-500 text-charcoal-950 shadow-md'
                  : 'text-gray-400 hover:text-white bg-black/30'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline Risks</span>
            </button>

            <button
              onClick={() => setActiveTab('highlights')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'highlights'
                  ? 'bg-gold-500 text-charcoal-950 shadow-md'
                  : 'text-gray-400 hover:text-white bg-black/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Highlights ({currentHealth.keyHighlights.length})</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <AnimatePresence mode="wait">
          {activeTab === 'urgent' && (
            <motion.div
              key="tab-urgent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {currentHealth.urgentActions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {currentHealth.urgentActions.map((action, idx) => {
                    const isCrit = action.urgency === 'critical';
                    return (
                      <div
                        key={action.id || idx}
                        className={`p-4 rounded-2xl bg-black/50 border transition-all flex flex-col justify-between space-y-3 group relative overflow-hidden ${
                          isCrit ? 'border-red-500/30 hover:border-red-500/50' : 'border-gold-500/20 hover:border-gold-500/40'
                        }`}
                      >
                        {isCrit && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_#ef4444]" />
                        )}

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                            <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold flex items-center space-x-1.5 shrink-0 ${
                              isCrit ? 'bg-red-500/25 text-red-200 border border-red-500/40 animate-pulse shadow-sm shadow-red-950/50' : 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
                            }`}>
                              {isCrit && (
                                <span className="relative flex h-1.5 w-1.5 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400"></span>
                                </span>
                              )}
                              <span>{action.urgency} PRIORITY</span>
                            </span>
                            <div className="flex items-center space-x-1.5 min-w-0 max-w-full">
                              {action.relatedProjectId && (() => {
                                const relProj = projects.find(p => p.id === action.relatedProjectId);
                                return relProj ? (
                                  <ProjectStatusBadge 
                                    status={relProj.status} 
                                    size="xs" 
                                    showDot={true} 
                                    showIcon={false}
                                  />
                                ) : null;
                              })()}
                              {action.relatedProjectName && (
                                <span className="text-[10px] text-gray-400 font-mono truncate max-w-[120px] sm:max-w-[160px]">
                                  {action.relatedProjectName}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <h4 className="text-sm font-bold text-white mt-1.5 truncate" title={action.title}>
                            {action.title}
                          </h4>
                          <p className="text-xs text-gray-300 mt-1 leading-relaxed line-clamp-2">
                            {action.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 min-w-0">
                          <span className="text-[10px] text-gold-300/90 font-mono truncate italic min-w-0 flex-1">
                            {action.suggestedActionText}
                          </span>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            {action.actionType === 'collect_payment' && (
                              <button
                                onClick={() => handleExecuteAction(action)}
                                className="px-2.5 py-1.5 bg-gradient-to-r from-gold-500/20 to-gold-400/10 hover:from-gold-500/30 hover:to-gold-400/20 text-gold-300 border border-gold-500/40 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center space-x-1 cursor-pointer"
                              >
                                <IndianRupee className="w-3 h-3" />
                                <span>Collect</span>
                              </button>
                            )}

                            {action.actionType === 'remind_editor' && (
                              <button
                                onClick={() => handleExecuteAction(action)}
                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gold-300 border border-white/10 rounded-lg text-[10px] font-mono font-medium transition-all flex items-center space-x-1 cursor-pointer"
                              >
                                {copiedActionId === action.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedActionId === action.id ? 'Copied!' : 'Ping'}</span>
                              </button>
                            )}

                            {action.actionType === 'whatsapp_client' && (
                              <button
                                onClick={() => handleExecuteAction(action)}
                                className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center space-x-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </button>
                            )}

                            {action.relatedProjectId && (
                              <button
                                onClick={() => {
                                  const p = projects.find(proj => proj.id === action.relatedProjectId);
                                  if (p && onInspectProject) onInspectProject(p);
                                }}
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors border border-white/5 cursor-pointer"
                                title="Inspect Project Details"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-50 mb-2" />
                  <p className="text-sm font-semibold text-white">All Clear! No urgent risks requiring immediate action.</p>
                  <p className="text-xs text-gray-400 mt-0.5">Project deliveries and client collection milestones are operating normally.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'financials' && (
            <motion.div
              key="tab-financials"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-2xl bg-black/30 border border-white/5 space-y-4"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 shrink-0">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Financial Risk Assessment</h3>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    {currentHealth.financialRiskSummary.insight}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-charcoal-900/60 border border-white/5">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">High Risk Unpaid Balance</span>
                  <div className="text-lg font-bold font-mono text-rose-400 mt-1">
                    ₹{currentHealth.financialRiskSummary.totalUnpaidAtRisk.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[9px] text-gray-400 font-mono mt-0.5 block">
                    Across {currentHealth.financialRiskSummary.unpaidNearDeadlineCount} project(s) due soon or overdue
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-charcoal-900/60 border border-white/5 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Quick Actions</span>
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => onQuickAction && onQuickAction('financials')}
                      className="px-3 py-1.5 bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-500/30 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      Open Payments Ledger &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div
              key="tab-timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-2xl bg-black/30 border border-white/5 space-y-4"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Delivery Timeline Health</h3>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    {currentHealth.timelineRiskSummary.insight}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-charcoal-900/60 border border-white/5">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Overdue Delivery Status</span>
                  <div className="text-lg font-bold font-mono text-rose-400 mt-1">
                    {currentHealth.timelineRiskSummary.overdueCount} Film(s) Past Schedule
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-charcoal-900/60 border border-white/5">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Near-Term Deliveries (3 Days)</span>
                  <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                    {currentHealth.timelineRiskSummary.dueWithin3DaysCount} Milestone(s) Approaching
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'highlights' && (
            <motion.div
              key="tab-highlights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2.5"
            >
              {currentHealth.keyHighlights.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-start space-x-3"
                >
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    item.type === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {item.type === 'positive' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-gray-300 mt-0.5">{item.detail}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
