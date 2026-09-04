import React, { useState } from 'react';
import { 
  AlertTriangle, 
  IndianRupee, 
  MessageSquare, 
  Clock, 
  Building2, 
  User, 
  CheckCircle2, 
  ArrowUpRight, 
  Send,
  Database,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Filter,
  Check,
  Zap,
  Volume2,
  Copy,
  Calendar,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Studio, Editor } from '../../types';
import ProjectStatusBadge from './ProjectStatusBadge';

interface DashboardAlertsHubProps {
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  filteredStudioPaymentReminders: any[];
  filteredPaymentReminders: any[];
  filteredProjectReminders: any[];
  unpaidEditorsList: any[];
  onOpenPaymentModal: (type: 'studio' | 'editor', entityId?: string, projectId?: string, amount?: number) => void;
  onInspectProject: (project: Project) => void;
  onNavigateTab?: (tab: string) => void;
  onTriggerWeeklyBackup?: () => void;
  isWeeklyBackupDue?: boolean;
}

export default function DashboardAlertsHub({
  projects,
  studios,
  editors,
  filteredStudioPaymentReminders,
  filteredPaymentReminders,
  filteredProjectReminders,
  unpaidEditorsList,
  onOpenPaymentModal,
  onInspectProject,
  onNavigateTab,
  onTriggerWeeklyBackup,
  isWeeklyBackupDue = false
}: DashboardAlertsHubProps) {
  const [activeTab, setActiveTab] = useState<'studios' | 'projects' | 'editors'>('studios');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Shoot Overdue count
  const shootOverdueProjects = projects.filter(p => {
    if (!p.shootDate) return false;
    const shootTime = new Date(p.shootDate).getTime();
    const isPast = shootTime < Date.now();
    const remBal = Math.max(0, (Number(p.projectAmount) || 0) - (Number(p.advancePayment) || 0));
    return isPast && remBal > 0;
  });

  const sendWhatsAppReminder = (phone: string, name: string, amount: number, coupleOrCount: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = encodeURIComponent(
      `*The Frame Cut Studio OS — Payment Reminder* 📄\n\nNamaste ${name},\nThis is a polite reminder regarding the outstanding balance of *₹${amount.toLocaleString('en-IN')}* for ${coupleOrCount}.\n\nKindly clear the remaining balance at your earliest convenience.\n\nThank you,\n*The Frame Cut Studio OS*`
    );
    window.open(`https://wa.me/${targetPhone}?text=${message}`, '_blank');
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* ================= HIGH PRIORITY SHOOT-OVERDUE BANNER ================= */}
      {shootOverdueProjects.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-950/90 via-[#26090e] to-rose-950/90 border border-rose-500/50 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden min-w-0">
          <div className="flex items-start space-x-3.5 relative z-10 min-w-0 flex-1">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 shadow-lg">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase font-bold tracking-wider shrink-0">
                  High Priority Recovery
                </span>
                <span className="text-xs text-rose-200 font-mono">
                  {shootOverdueProjects.length} Post-Shoot Balances Pending
                </span>
              </div>
              <h4 className="text-sm font-bold text-white font-display mt-1 break-words">
                Completed Shoot Dates Awaiting Second Advance / Final Settlement
              </h4>
              <p className="text-xs text-gray-300 mt-0.5 font-light">
                The event shoot date has elapsed for these films. Ensure second payments or final deliveries are invoiced.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0 relative z-10">
            <button
              onClick={() => setActiveTab('studios')}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg cursor-pointer transition-all flex items-center space-x-1.5"
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Review Balances</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MAIN REMINDERS & LEDGER ACTION HUB ================= */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0c2019] via-[#081813] to-[#040e0b] border border-luxury-green-700/50 p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* Hub Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gold-500/15 text-gold-400 border border-gold-500/30 shadow-md">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest font-bold block">
                  Executive Recovery Radar
                </span>
                <h3 className="text-xl font-serif italic text-white">
                  Accounts & Production Action Hub
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-300 font-light">
              Consolidated studio receivables, impending delivery horizons, and editor wage settlements.
            </p>
          </div>

          {/* Switcher Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-black/60 border border-white/10 self-start sm:self-auto shadow-inner">
            
            <button
              onClick={() => setActiveTab('studios')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'studios'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Studio Balances ({filteredStudioPaymentReminders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'projects'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Deadlines ({filteredProjectReminders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('editors')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'editors'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Editor Wages ({unpaidEditorsList.length})</span>
            </button>

          </div>

        </div>

        {/* ================= TAB 1: STUDIO PAYMENT REMINDERS ================= */}
        {activeTab === 'studios' && (
          <div className="space-y-4">
            {filteredStudioPaymentReminders.length === 0 ? (
              <div className="text-center py-10 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
                <p className="text-sm font-semibold text-white font-display">All Studio Accounts Settled!</p>
                <p className="text-xs text-gray-400">Zero pending receivables from studio clients.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudioPaymentReminders.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl bg-gradient-to-br from-charcoal-950/80 to-charcoal-900/90 border border-gold-500/30 hover:border-gold-500/60 p-5 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-4"
                  >
                    {/* Top Row: Studio Name & Label */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">Studio Partner</span>
                        <h4 className="text-base font-bold text-white font-display">{item.studioName}</h4>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-300 border border-gold-500/30 font-semibold shrink-0">
                        {item.label}
                      </span>
                    </div>

                    {/* Mid: Pending Amount */}
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-400">Pending Due:</span>
                      <span className="text-lg font-bold font-mono text-gold-400">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                      {item.phone && (
                        <button
                          onClick={() => sendWhatsAppReminder(item.phone, item.studioName, item.amount, item.label)}
                          className="flex-1 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp Due</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenPaymentModal('studio', item.studioId, undefined, item.amount)}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-charcoal-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>Log Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: IMPENDING DELIVERY DEADLINES ================= */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {filteredProjectReminders.length === 0 ? (
              <div className="text-center py-10 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
                <p className="text-sm font-semibold text-white font-display">No Urgent Delivery Horizons!</p>
                <p className="text-xs text-gray-400">All live projects are well within delivery schedules.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjectReminders.slice(0, 9).map((rem) => {
                  const isUrgent = rem.daysLeft <= 2;
                  return (
                    <div
                      key={rem.id}
                      onClick={() => onInspectProject(rem.project)}
                      className={`p-5 rounded-3xl bg-gradient-to-br from-charcoal-950/80 to-charcoal-900/90 border p-5 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-4 cursor-pointer ${
                        isUrgent ? 'border-rose-500/40 hover:border-rose-400' : 'border-luxury-green-800/40 hover:border-gold-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                            {rem.project.eventType || 'Wedding Film'}
                          </span>
                          <h4 className="text-base font-bold text-white font-display line-clamp-1">{rem.coupleName}</h4>
                          <p className="text-xs text-gray-300 truncate font-light">Studio: {rem.studioName || 'Direct'}</p>
                        </div>

                        <div className="flex flex-col items-end space-y-1.5 shrink-0">
                          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border font-bold flex items-center space-x-1 ${
                            isUrgent 
                              ? 'bg-rose-500/25 text-rose-200 border-rose-400/60 animate-pulse shadow-sm shadow-rose-950/50 ring-1 ring-rose-500/30' 
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {isUrgent && (
                              <span className="relative flex h-1.5 w-1.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-400"></span>
                              </span>
                            )}
                            <span>{rem.daysLeft < 0 ? `Overdue (${Math.abs(rem.daysLeft)}d)` : rem.daysLeft === 0 ? 'Due Today' : `${rem.daysLeft}d left`}</span>
                          </span>
                          <ProjectStatusBadge 
                            status={rem.project.status} 
                            size="xs" 
                            showDot={true}
                            showIcon={false}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-gray-400">
                        <span>Editor: <strong className="text-white font-semibold">{rem.editorName}</strong></span>
                        <span className="text-gold-400 hover:underline flex items-center space-x-1">
                          <span>Inspect</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: UNPAID EDITOR WAGES ================= */}
        {activeTab === 'editors' && (
          <div className="space-y-4">
            {unpaidEditorsList.length === 0 ? (
              <div className="text-center py-10 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
                <p className="text-sm font-semibold text-white font-display">All Editor Wages Cleared!</p>
                <p className="text-xs text-gray-400">Zero pending payouts in the editor wage ledger.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpaidEditorsList.map((item, idx) => (
                  <div
                    key={`${item.editorId}-${item.projectId}-${idx}`}
                    className="p-5 rounded-3xl bg-gradient-to-br from-charcoal-950/80 to-charcoal-900/90 border border-purple-500/30 hover:border-purple-500/60 p-5 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 block">
                          {item.roleType}
                        </span>
                        <h4 className="text-base font-bold text-white font-display">{item.editorName}</h4>
                        <p className="text-xs text-gray-300 truncate font-light">Film: {item.coupleName}</p>
                      </div>

                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold shrink-0">
                        Wage Balance
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-400">Pending Payout:</span>
                      <span className="text-lg font-bold font-mono text-purple-300">
                        ₹{item.pending.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <button
                        onClick={() => onOpenPaymentModal('editor', item.editorId, item.projectId, item.pending)}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>Disburse Editor Wage</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
