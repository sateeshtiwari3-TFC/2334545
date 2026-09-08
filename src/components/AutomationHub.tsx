import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Settings, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Download, 
  Sparkles, 
  Bot, 
  Send, 
  Copy, 
  Check, 
  ShieldCheck, 
  RefreshCw, 
  ChevronRight, 
  Sliders, 
  HardDrive, 
  FileText, 
  Layers, 
  Archive, 
  IndianRupee, 
  TrendingUp, 
  ExternalLink,
  Info,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Project, 
  Studio, 
  Editor, 
  StudioInvoice, 
  AppNotification, 
  AutomationSettings, 
  AutomationExecutionReport,
  AIProjectBriefResult,
  AICostProfitResult
} from '../types';
import { 
  getAutomationSettings, 
  saveAutomationSettings, 
  runStudioAutomationSuite,
  calculateDeliveryDate,
  generateNextInvoiceNumber
} from '../services/automationEngine';
import { playDeadlineAlertChime } from '../utils/chimeSound';
import AutomationRulesSettings from './AutomationRulesSettings';

interface AutomationHubProps {
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  invoices?: StudioInvoice[];
  notifications?: AppNotification[];
  onUpdateProject?: (id: string, updates: Partial<Project>) => Promise<void>;
  onTriggerWeeklyBackup?: () => void;
  onNavigateTab?: (tab: string, subAction?: string) => void;
}

export default function AutomationHub({
  projects,
  studios,
  editors,
  invoices = [],
  notifications = [],
  onUpdateProject,
  onTriggerWeeklyBackup,
  onNavigateTab
}: AutomationHubProps) {
  const [settings, setSettings] = useState<AutomationSettings>(getAutomationSettings);
  const [activeTab, setActiveTab] = useState<'rules' | 'ai_brief' | 'ai_profit' | 'whatsapp' | 'log'>('rules');
  const [isRunning, setIsRunning] = useState(false);
  const [lastReport, setLastReport] = useState<AutomationExecutionReport | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Project Brief Generator State
  const [briefCouple, setBriefCouple] = useState('');
  const [briefEventType, setBriefEventType] = useState('Wedding Film & Teaser');
  const [briefStudio, setBriefStudio] = useState('');
  const [briefDeliverables, setBriefDeliverables] = useState('1 Teaser (1-2 min), 1 Highlight Film (5-7 min), Full Rituals Video');
  const [briefNotes, setBriefNotes] = useState('');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [briefResult, setBriefResult] = useState<AIProjectBriefResult | null>(null);
  const [briefError, setBriefError] = useState<string | null>(null);

  // AI Profit & Cost Estimator State
  const [profitAmount, setProfitAmount] = useState(65000);
  const [profitEditor, setProfitEditor] = useState(15000);
  const [profitExpenses, setProfitExpenses] = useState(5000);
  const [profitDeliverables, setProfitDeliverables] = useState('Teaser, 6-min Cinematic Film, Reels, 4K Master Drive');
  const [isEstimatingProfit, setIsEstimatingProfit] = useState(false);
  const [profitResult, setProfitResult] = useState<AICostProfitResult | null>(null);
  const [profitError, setProfitError] = useState<string | null>(null);

  // WhatsApp Trigger State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [customPhone, setCustomPhone] = useState('');
  const [whatsAppType, setWhatsAppType] = useState<'shoot_countdown' | 'post_shoot_payment' | 'editor_deadline' | 'delivery_celebration'>('post_shoot_payment');

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const handleToggle = (key: keyof AutomationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveAutomationSettings(updated);
    showFeedback("Settings saved");
  };

  const handleNumberChange = (key: keyof AutomationSettings, val: number) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    saveAutomationSettings(updated);
    showFeedback("Settings saved");
  };

  const handleStringChange = (key: keyof AutomationSettings, val: string) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    saveAutomationSettings(updated);
    showFeedback("Settings saved");
  };

  const showFeedback = (msg: string) => {
    setSaveFeedback(msg);
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const handleRunSuite = async () => {
    setIsRunning(true);
    playDeadlineAlertChime(0.25);
    try {
      const report = await runStudioAutomationSuite(projects, invoices, notifications, settings);
      setLastReport(report);
      setSettings(getAutomationSettings());
      showFeedback(`Automation executed: ${report.details.length} action(s) processed.`);
    } catch (err: any) {
      console.error("Manual automation run failed:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleGenerateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!briefCouple.trim()) return;
    setIsGeneratingBrief(true);
    setBriefError(null);
    try {
      const res = await fetch('/api/gemini/auto-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleName: briefCouple,
          eventType: briefEventType,
          studioName: briefStudio || 'Frame Cut Studio Partner',
          deliverablesRequested: briefDeliverables,
          clientNotes: briefNotes
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate brief');
      setBriefResult(json.data);
    } catch (err: any) {
      setBriefError(err.message || 'Error generating AI brief');
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleEstimateProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEstimatingProfit(true);
    setProfitError(null);
    try {
      const res = await fetch('/api/gemini/estimate-profit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectAmount: Number(profitAmount),
          editorPayment: Number(profitEditor),
          additionalCosts: Number(profitExpenses),
          deliverables: profitDeliverables
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to estimate profit');
      setProfitResult(json.data);
    } catch (err: any) {
      setProfitError(err.message || 'Error calculating profit estimates');
    } finally {
      setIsEstimatingProfit(false);
    }
  };

  const generateWhatsAppMessage = () => {
    if (!selectedProject) return '';
    const studio = studios.find(s => s.id === selectedProject.studioId);
    const studioName = studio?.name || selectedProject.studioName || 'Studio Partner';
    const couple = selectedProject.coupleName || selectedProject.projectName || 'Wedding Couple';
    const remBal = typeof selectedProject.remainingBalance === 'number'
      ? selectedProject.remainingBalance
      : Math.max(0, (Number(selectedProject.projectAmount) || 0) - (Number(selectedProject.advancePayment) || 0));
    const upiId = localStorage.getItem('tfc_upi_id') || 'sateeshtiwari3@okaxis';

    if (whatsAppType === 'shoot_countdown') {
      return `🎥 *THE FRAME CUT STUDIO — UPCOMING SHOOT COUNTDOWN* 🎬\n\nDear ${studioName} Team,\n\nGentle heads-up that the shoot for *${couple}* is scheduled for *${selectedProject.shootDate || 'Upcoming'}*.\n\n📌 *Checklist:*\n• Camera cards formatted & ready\n• Audio lavs & backup recorder prepped\n• Raw hard drive designated\n\nLooking forward to receiving the raw footage at our editing desk! 🚀`;
    }

    if (whatsAppType === 'post_shoot_payment') {
      return `💳 *THE FRAME CUT STUDIO — STAGE-2 PAYMENT INVOICE* 📄\n\nDear ${studioName} Team,\n\nHope the shoot for *${couple}* was a great success! ✨\n\nAs the raw footage enters our sorting and rough cut pipeline, kindly process the Stage-2 milestone balance:\n\n📌 *Project:* ${couple}\n📌 *Remaining Balance:* *₹${remBal.toLocaleString('en-IN')}*\n\n💳 *Direct UPI ID:* \`${upiId}\`\n• Bank: HDFC Bank | A/C: 501002345678 | IFSC: HDFC0001234\n\nKindly send the receipt screenshot so we can maintain continuous editing flow. Thank you! 🙏`;
    }

    if (whatsAppType === 'editor_deadline') {
      return `⏰ *EDITOR DEADLINE MILESTONE — THE FRAME CUT STUDIO* 🎞️\n\nHi ${selectedProject.assignedEditorName || 'Editor'},\n\nThis is a priority deadline reminder for *${couple}* (${selectedProject.eventType || 'Wedding Film'}).\n\n📌 *Final Delivery Date:* *${selectedProject.deliveryDate || 'Within 24-48 Hours'}*\n📌 *Deliverables Scope:* Teaser, Highlights & Master Cut\n\nPlease ensure the 4K render and export QC is initiated today. Ping us immediately if revisions are pending. Keep creating magic! 🔥`;
    }

    // Delivery Celebration
    return `🎉 *WEDDING EDITS MASTER DELIVERED — THE FRAME CUT STUDIO* 🏆\n\nDear ${studioName} Team,\n\nThrilled to announce that the cinematic master film for *${couple}* has been successfully rendered, color-graded, and uploaded! 🎬\n\n✨ All deliverables are ready for client viewing and archive.\n\nThank you for trusting The Frame Cut Studio with your post-production craft! We look forward to the next grand celebration together. 🌸`;
  };

  const handleOpenWhatsApp = () => {
    const text = generateWhatsAppMessage();
    const studio = studios.find(s => s.id === selectedProject?.studioId);
    const assignedEditor = editors.find(e => e.id === selectedProject?.assignedEditorId || e.name === selectedProject?.assignedEditorName);
    const targetPhone = customPhone || studio?.phone || assignedEditor?.phone || '';
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const encoded = encodeURIComponent(text);
    const link = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(link, '_blank');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-charcoal-900 via-luxury-green-950/30 to-charcoal-950 border border-gold-500/25 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-gradient-to-br from-gold-500/20 to-amber-500/20 border border-gold-500/40 rounded-2xl text-gold-400 gold-glow">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 font-bold">
                TFC Studio AutoPilot
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTIVE ENGINE</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-display text-white mt-2">
              Studio Automation Suite & Rules Engine
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
              Automate overdue flagging, auto-calculate 21-day delivery dates, stage-2 post-shoot billing alerts, 1-click WhatsApp messaging, and AI-powered project sheet generation.
            </p>
          </div>

          {/* Quick Metrics & Manual Run Action */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-charcoal-950/80 border border-white/10 px-4 py-2.5 rounded-2xl text-xs font-mono">
              <span className="text-[10px] text-gray-400 uppercase block font-bold">Rules Executed</span>
              <strong className="text-sm text-gold-400">{settings.rulesRunCount || 0} times</strong>
            </div>

            <button
              type="button"
              onClick={handleRunSuite}
              disabled={isRunning}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-charcoal-950 font-bold text-xs font-mono flex items-center space-x-2 shadow-lg transition-all cursor-pointer hover:scale-102 active:scale-98 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Automations...' : 'Run All Automations Now'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {saveFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveFeedback}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-charcoal-950/80 border border-white/10 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'rules'
              ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-gold-400" />
          <span>Automation Rules ({Object.values(settings).filter(v => v === true).length} active)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span>1-Click WhatsApp Hub</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai_brief')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'ai_brief'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>AI Project Sheet Generator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai_profit')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'ai_profit'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          <span>Smart Profit & Cost Estimator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'log'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>Execution Activity Log</span>
        </button>
      </div>

      {/* ================= TAB 1: AUTOMATION RULES SWITCHBOARD ================= */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Rule 1: Auto Overdue Flagging */}
          <div className="p-5 rounded-3xl bg-charcoal-900 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('autoOverdueFlagging')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.autoOverdueFlagging ? 'bg-gold-500' : 'bg-charcoal-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-charcoal-950 absolute top-0.5 transition-transform ${
                    settings.autoOverdueFlagging ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              <h4 className="text-sm font-bold text-white font-display">Auto-Flag Overdue Projects</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Automatically scans delivery dates and flags projects as Overdue when date has elapsed, escalating priority to High and dispatching push notifications.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-gold-400 font-bold border-t border-white/5 flex items-center justify-between">
              <span>Status: {settings.autoOverdueFlagging ? 'ENABLED' : 'DISABLED'}</span>
              <span className="text-gray-500">Hourly Background Sync</span>
            </div>
          </div>

          {/* Rule 2: Auto Delivery Date Calculation */}
          <div className="p-5 rounded-3xl bg-charcoal-900 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  <Calendar className="w-4 h-4" />
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('autoDeliveryDateCalc')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.autoDeliveryDateCalc ? 'bg-gold-500' : 'bg-charcoal-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-charcoal-950 absolute top-0.5 transition-transform ${
                    settings.autoDeliveryDateCalc ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              <h4 className="text-sm font-bold text-white font-display">Auto Delivery Date Calculation</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                When raw footage shoot date is entered, automatically calculate delivery deadline based on standard turnaround days.
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <label className="text-[11px] font-mono text-gray-300">Turnaround:</label>
                <input
                  type="number"
                  min="7"
                  max="60"
                  value={settings.autoTurnaroundDays}
                  onChange={(e) => handleNumberChange('autoTurnaroundDays', Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-charcoal-950 border border-white/10 rounded-lg text-xs font-mono text-gold-400 font-bold text-center"
                />
                <span className="text-[10px] font-mono text-gray-400">days from shoot</span>
              </div>
            </div>
            <div className="pt-2 text-[10px] font-mono text-sky-400 font-bold border-t border-white/5 flex items-center justify-between">
              <span>Preset: {settings.autoTurnaroundDays} Days</span>
              <span className="text-gray-500">Auto-derives at creation</span>
            </div>
          </div>

          {/* Rule 3: Post-Shoot Stage 2 Payment Trigger */}
          <div className="p-5 rounded-3xl bg-charcoal-900 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <IndianRupee className="w-4 h-4" />
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('autoPostShootPaymentTrigger')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.autoPostShootPaymentTrigger ? 'bg-gold-500' : 'bg-charcoal-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-charcoal-950 absolute top-0.5 transition-transform ${
                    settings.autoPostShootPaymentTrigger ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              <h4 className="text-sm font-bold text-white font-display">Post-Shoot Stage 2 Billing Trigger</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                When an event's shoot date concludes, automatically generate Stage-2 milestone billing reminder notifications for clients with unpaid balances.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-emerald-400 font-bold border-t border-white/5 flex items-center justify-between">
              <span>Status: {settings.autoPostShootPaymentTrigger ? 'ACTIVE' : 'MUTED'}</span>
              <span className="text-gray-500">1-Click WhatsApp Trigger Ready</span>
            </div>
          </div>

          {/* Rule 4: Auto-Archive Delivered Projects */}
          <div className="p-5 rounded-3xl bg-charcoal-900 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Archive className="w-4 h-4" />
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('autoArchiveDeliveredEnabled')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.autoArchiveDeliveredEnabled ? 'bg-gold-500' : 'bg-charcoal-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-charcoal-950 absolute top-0.5 transition-transform ${
                    settings.autoArchiveDeliveredEnabled ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              <h4 className="text-sm font-bold text-white font-display">Auto-Archive Delivered Projects</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Automatically transition delivered wedding projects to 'closed' after specified days, preventing dashboard clutter.
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <label className="text-[11px] font-mono text-gray-300">Archive after:</label>
                <input
                  type="number"
                  min="14"
                  max="90"
                  value={settings.autoArchiveDeliveredDays}
                  onChange={(e) => handleNumberChange('autoArchiveDeliveredDays', Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-charcoal-950 border border-white/10 rounded-lg text-xs font-mono text-gold-400 font-bold text-center"
                />
                <span className="text-[10px] font-mono text-gray-400">days of delivery</span>
              </div>
            </div>
            <div className="pt-2 text-[10px] font-mono text-amber-400 font-bold border-t border-white/5 flex items-center justify-between">
              <span>Threshold: {settings.autoArchiveDeliveredDays} Days</span>
              <span className="text-gray-500">Auto-moves to archive</span>
            </div>
          </div>

          {/* Rule 5: Auto-Balance & State Calculations */}
          <div className="p-5 rounded-3xl bg-charcoal-900 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <DollarSign className="w-4 h-4" />
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('autoBalanceStatusCalc')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.autoBalanceStatusCalc ? 'bg-gold-500' : 'bg-charcoal-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-charcoal-950 absolute top-0.5 transition-transform ${
                    settings.autoBalanceStatusCalc ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              <h4 className="text-sm font-bold text-white font-display">Auto-Calculate Remaining Balances</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Automatically keep remainingBalance = projectAmount - advancePayment strictly synchronized to prevent manual calculation errors.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-mono text-purple-400 font-bold border-t border-white/5 flex items-center justify-between">
              <span>Strict Arithmetic Audit: ON</span>
              <span className="text-gray-500">Auto-clears discrepancies</span>
            </div>
          </div>

          {/* Rule 6: Auto-Invoice Sequential Numbering */}
          <div className="p-5 rounded-3xl bg-charcoal-900 border border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
                  <FileText className="w-4 h-4" />
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('autoInvoiceNumberEnabled')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.autoInvoiceNumberEnabled ? 'bg-gold-500' : 'bg-charcoal-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-charcoal-950 absolute top-0.5 transition-transform ${
                    settings.autoInvoiceNumberEnabled ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              <h4 className="text-sm font-bold text-white font-display">Sequential Invoice Auto-Numbering</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Generate sequential GST-compliant invoice numbers (e.g. {generateNextInvoiceNumber(settings.autoInvoiceNumberPrefix)}) on new invoice creation.
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <label className="text-[11px] font-mono text-gray-300">Prefix:</label>
                <input
                  type="text"
                  maxLength={6}
                  value={settings.autoInvoiceNumberPrefix}
                  onChange={(e) => handleStringChange('autoInvoiceNumberPrefix', e.target.value.toUpperCase())}
                  className="w-20 px-2 py-1 bg-charcoal-950 border border-white/10 rounded-lg text-xs font-mono text-gold-400 font-bold text-center uppercase"
                />
                <span className="text-[10px] font-mono text-gray-400">Sample: {settings.autoInvoiceNumberPrefix}-2026-0042</span>
              </div>
            </div>
            <div className="pt-2 text-[10px] font-mono text-teal-400 font-bold border-t border-white/5 flex items-center justify-between">
              <span>Next Number: {generateNextInvoiceNumber(settings.autoInvoiceNumberPrefix)}</span>
              <span className="text-gray-500">Auto-incrementing</span>
            </div>
          </div>

          {/* Full Custom Status Transitions & Folder Trigger Rules */}
          <div className="col-span-1 md:col-span-2">
            <AutomationRulesSettings
              projects={projects}
              onUpdateProject={onUpdateProject}
            />
          </div>

        </div>
      )}

      {/* ================= TAB 2: 1-CLICK WHATSAPP HUB ================= */}
      {activeTab === 'whatsapp' && (
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-white/10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>1-Click WhatsApp Direct Action Dispatcher</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                Select any wedding project to instantly formulate and dispatch pre-verified WhatsApp messages.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                Direct WhatsApp Integration
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">
                Select Target Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.coupleName || p.projectName} ({p.studioName || 'Studio'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">
                Message Category / Trigger
              </label>
              <select
                value={whatsAppType}
                onChange={(e) => setWhatsAppType(e.target.value as any)}
                className="w-full px-3 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500"
              >
                <option value="post_shoot_payment">💳 Post-Shoot Stage 2 Payment Request</option>
                <option value="shoot_countdown">🎥 Upcoming Shoot Countdown (48h)</option>
                <option value="editor_deadline">⏰ Editor 24h Milestone Warning</option>
                <option value="delivery_celebration">🎉 Final 4K Master Delivered</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">
                Phone Number (Optional Override)
              </label>
              <input
                type="tel"
                placeholder="E.g. +91 98765 43210"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Formulated Message Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-gold-400 font-bold">
                Formatted WhatsApp Message Content:
              </span>
              <button
                type="button"
                onClick={() => handleCopy(generateWhatsAppMessage(), 'wa_msg')}
                className="text-[10px] font-mono text-gray-400 hover:text-white flex items-center space-x-1 cursor-pointer"
              >
                {copiedId === 'wa_msg' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'wa_msg' ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-charcoal-950 border border-emerald-500/20 text-xs font-mono text-gray-200 whitespace-pre-wrap leading-relaxed shadow-inner">
              {generateWhatsAppMessage()}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-charcoal-950 font-bold text-xs font-mono flex items-center space-x-2 shadow-lg cursor-pointer transition-all hover:scale-102 active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Launch in WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 3: AI PROJECT BRIEF GENERATOR ================= */}
      {activeTab === 'ai_brief' && (
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>AI Automated Project Sheet & Editor Brief Generator</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                Paste unstructured client discussion notes or wedding scope; Gemini AI automatically formats scene breakdowns, deliverables checklist, audio guidance & turnaround milestones.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerateBrief} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1 font-bold">Couple Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Siddharth & Kiara"
                  value={briefCouple}
                  onChange={(e) => setBriefCouple(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1 font-bold">Event Type</label>
                <input
                  type="text"
                  placeholder="E.g. Royal Rajasthani Destination Wedding"
                  value={briefEventType}
                  onChange={(e) => setBriefEventType(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1 font-bold">Studio Partner</label>
                <input
                  type="text"
                  placeholder="E.g. Wedding By KK"
                  value={briefStudio}
                  onChange={(e) => setBriefStudio(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1 font-bold">Deliverables Scope</label>
              <input
                type="text"
                placeholder="E.g. 1 Instagram Reel (9:16), 1 Cinematic Teaser (3min), 1 Full Film (25min)"
                value={briefDeliverables}
                onChange={(e) => setBriefDeliverables(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1 font-bold">
                Raw Client Notes & Special Instructions (Paste notes here)
              </label>
              <textarea
                rows={3}
                placeholder="E.g. Bride requested soft romantic piano for vows, high energy Punjabi beats for Sangeet. Include drone shots of fort during entry. Grandmother's blessing is crucial."
                value={briefNotes}
                onChange={(e) => setBriefNotes(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isGeneratingBrief}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold text-xs font-mono flex items-center space-x-2 shadow-lg cursor-pointer transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingBrief ? 'animate-spin' : ''}`} />
                <span>{isGeneratingBrief ? 'Generating AI Brief...' : 'Formulate Project Brief'}</span>
              </button>
            </div>
          </form>

          {briefError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-mono">
              {briefError}
            </div>
          )}

          {/* AI Result Card */}
          {briefResult && (
            <div className="p-5 rounded-3xl bg-charcoal-950 border border-blue-500/30 space-y-4 font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] text-blue-400 uppercase font-bold">Automated Post-Production Brief</span>
                  <h4 className="text-base font-bold text-white font-display mt-0.5">{briefResult.projectTitle}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(briefResult, null, 2), 'brief_json')}
                  className="px-3 py-1.5 rounded-lg bg-charcoal-800 text-gray-300 hover:text-white text-[10px] flex items-center space-x-1 cursor-pointer"
                >
                  {copiedId === 'brief_json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Sheet</span>
                </button>
              </div>

              <div className="p-3 bg-charcoal-900 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-gold-400 uppercase font-bold">Narrative & Visual Tone</span>
                <p className="text-gray-300 leading-relaxed">{briefResult.coupleNarrative}</p>
              </div>

              {/* Deliverables Grid */}
              <div className="space-y-2">
                <span className="text-[10px] text-gold-400 uppercase font-bold">Deliverables & Editor Roles</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {briefResult.deliverablesChecklist.map((d, i) => (
                    <div key={i} className="p-3 bg-charcoal-900 rounded-xl border border-white/5 space-y-1">
                      <div className="flex justify-between font-bold text-white">
                        <span>{d.name}</span>
                        <span className="text-blue-400">{d.targetDuration}</span>
                      </div>
                      <div className="text-[10px] text-gray-400">Assigned: {d.recommendedEditorRole}</div>
                      <div className="text-[10px] text-gray-300 pt-1">
                        • {d.keyHighlights.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sequence Breakdown & Audio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-charcoal-900 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[10px] text-gold-400 uppercase font-bold">Ceremony Breakdown</span>
                  {briefResult.shootingSequence.map((seq, i) => (
                    <div key={i} className="text-[11px] border-b border-white/5 pb-1 last:border-none">
                      <strong className="text-white">{seq.event}: </strong>
                      <span className="text-gray-300">{seq.shotRequirements}</span>
                      <div className="text-[10px] text-emerald-400">Vibe: {seq.musicVibe}</div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-charcoal-900 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[10px] text-gold-400 uppercase font-bold">Audio & Turnaround Milestones</span>
                  <div className="text-[11px] text-gray-300">
                    <div><strong>BPM:</strong> {briefResult.audioDirection.recommendedBpm}</div>
                    <div><strong>Genre:</strong> {briefResult.audioDirection.genre}</div>
                    <div><strong>Mood:</strong> {briefResult.audioDirection.moodGuidelines}</div>
                    <div className="mt-2 text-gold-300"><strong>Est. Storage:</strong> {briefResult.storageEstimateTb}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: SMART PROFIT & COST ESTIMATOR ================= */}
      {activeTab === 'ai_profit' && (
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>AI Smart Cost & Net Profit Margin Estimator</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                Analyze project financials, calculate itemized editor/cloud costs, evaluate margin risk rating, and receive pricing suggestions.
              </p>
            </div>
          </div>

          <form onSubmit={handleEstimateProfit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1 font-bold">Contract Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-xs">₹</span>
                  <input
                    type="number"
                    required
                    value={profitAmount}
                    onChange={(e) => setProfitAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1 font-bold">Allocated Editor Wage (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-xs">₹</span>
                  <input
                    type="number"
                    required
                    value={profitEditor}
                    onChange={(e) => setProfitEditor(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1 font-bold">Hard Disk & Misc Costs (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-xs">₹</span>
                  <input
                    type="number"
                    value={profitExpenses}
                    onChange={(e) => setProfitExpenses(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1 font-bold">Scope / Deliverables</label>
              <input
                type="text"
                value={profitDeliverables}
                onChange={(e) => setProfitDeliverables(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isEstimatingProfit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-gold-500 hover:from-amber-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs font-mono flex items-center space-x-2 shadow-lg cursor-pointer transition-all disabled:opacity-50"
              >
                <TrendingUp className={`w-4 h-4 ${isEstimatingProfit ? 'animate-spin' : ''}`} />
                <span>{isEstimatingProfit ? 'Calculating Profitability...' : 'Analyze Profitability'}</span>
              </button>
            </div>
          </form>

          {profitError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-mono">
              {profitError}
            </div>
          )}

          {profitResult && (
            <div className="p-5 rounded-3xl bg-charcoal-950 border border-amber-500/30 space-y-4 font-mono text-xs shadow-2xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-charcoal-900 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-gray-400 block font-bold">Contract Total</span>
                  <strong className="text-base text-white">₹{profitResult.projectAmount.toLocaleString('en-IN')}</strong>
                </div>

                <div className="p-3 bg-charcoal-900 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-gray-400 block font-bold">Est. Total Cost</span>
                  <strong className="text-base text-amber-400">₹{profitResult.totalEstimatedCost.toLocaleString('en-IN')}</strong>
                </div>

                <div className="p-3 bg-charcoal-900 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-gray-400 block font-bold">Net Profit</span>
                  <strong className="text-base text-emerald-400">₹{profitResult.netProfit.toLocaleString('en-IN')}</strong>
                </div>

                <div className="p-3 bg-charcoal-900 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-gray-400 block font-bold">Profit Margin</span>
                  <strong className={`text-base ${profitResult.profitMarginPercentage >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {profitResult.profitMarginPercentage}%
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-charcoal-900 rounded-xl border border-white/5 space-y-1.5">
                  <span className="text-[10px] text-gold-400 uppercase font-bold">
                    Risk Assessment: <strong className="text-white">{profitResult.riskRating} Risk</strong>
                  </span>
                  <ul className="space-y-1 text-gray-300">
                    {profitResult.riskFactors.map((rf, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-charcoal-900 rounded-xl border border-white/5 space-y-1.5">
                  <span className="text-[10px] text-gold-400 uppercase font-bold">Optimization Guidance</span>
                  <ul className="space-y-1 text-gray-300">
                    {profitResult.costOptimizationTips.map((tip, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 text-[10px] text-sky-300 border-t border-white/5">
                    Suggested Selling Price (60% margin): <strong>₹{profitResult.suggestedSellingPrice.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: EXECUTION ACTIVITY LOG ================= */}
      {activeTab === 'log' && (
        <div className="p-6 rounded-3xl bg-charcoal-900 border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Live Automation Execution Report</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                Real-time activity log from the latest automated background scan.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunSuite}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-xl bg-charcoal-800 text-gray-300 hover:text-white text-xs font-mono font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Refresh Scan</span>
            </button>
          </div>

          {lastReport ? (
            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 bg-charcoal-950 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block">Projects Scanned</span>
                  <strong className="text-white text-sm">{lastReport.checkedProjectsCount}</strong>
                </div>
                <div className="p-3 bg-charcoal-950 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block">Overdue Flagged</span>
                  <strong className="text-red-400 text-sm">{lastReport.overdueProjectsCount}</strong>
                </div>
                <div className="p-3 bg-charcoal-950 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block">Stage-2 Billing Alerts</span>
                  <strong className="text-amber-400 text-sm">{lastReport.postShootRemindersCount}</strong>
                </div>
                <div className="p-3 bg-charcoal-950 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 block">Notifications Emitted</span>
                  <strong className="text-emerald-400 text-sm">{lastReport.notificationsGenerated}</strong>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-gold-400 uppercase font-bold">Execution Steps Detail:</span>
                <div className="p-4 bg-charcoal-950 rounded-2xl border border-white/5 space-y-1.5 text-gray-300">
                  {lastReport.details.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-gold-400">⚡</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-charcoal-950 rounded-2xl border border-white/5 text-xs font-mono text-gray-400 space-y-3">
              <p>No automation run report in current view session.</p>
              <button
                type="button"
                onClick={handleRunSuite}
                className="px-4 py-2 bg-gold-500 text-charcoal-950 font-bold rounded-xl text-xs font-mono cursor-pointer"
              >
                Run Automation Scan Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
