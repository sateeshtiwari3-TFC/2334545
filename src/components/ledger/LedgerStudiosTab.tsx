import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  MessageCircle, 
  Search, 
  IndianRupee, 
  Phone,
  CheckCircle2, 
  X,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Studio, Project, PaymentHistory } from '../../types';
import { getPaymentOrProjectOverdueInfo } from './LedgerMasterTable';

interface LedgerStudiosTabProps {
  studios: Studio[];
  projects: Project[];
  payments: PaymentHistory[];
  onOpenRecordModal: (type?: 'studio' | 'editor', defaultProjectId?: string, defaultStudioId?: string) => void;
}

export default function LedgerStudiosTab({
  studios,
  projects,
  payments,
  onOpenRecordModal
}: LedgerStudiosTabProps) {
  const [search, setSearch] = useState('');

  const studioStats = studios.map(studio => {
    const studioProjects = projects.filter(p => p.studioId === studio.id || p.studioName?.toLowerCase() === studio.name.toLowerCase());
    const totalContract = studioProjects.reduce((sum, p) => sum + (Number(p.projectAmount) || 0), 0);
    const totalAdv = studioProjects.reduce((sum, p) => {
      const pPayments = payments.filter(pay => (pay.projectId === p.id || pay.entityId === studio.id) && pay.entityType === 'studio');
      const logged = pPayments.reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
      return sum + (pPayments.length > 0 ? logged : (Number(p.advancePayment) || 0));
    }, 0);
    const totalRem = Math.max(0, totalContract - totalAdv);
    const collectedPct = totalContract > 0 ? Math.round((totalAdv / totalContract) * 100) : 100;

    // Check if studio has any overdue projects
    const overdueProjects = studioProjects.filter(p => {
      const overdueInfo = getPaymentOrProjectOverdueInfo(p);
      const pPayments = payments.filter(pay => pay.projectId === p.id && pay.entityType === 'studio');
      const logged = pPayments.reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
      const pAdv = pPayments.length > 0 ? logged : (Number(p.advancePayment) || 0);
      const pRem = Math.max(0, (Number(p.projectAmount) || 0) - pAdv);
      return pRem > 0 && overdueInfo.isOverdue;
    });

    return {
      studio,
      studioProjects,
      totalContract,
      totalAdv,
      totalRem,
      collectedPct,
      hasOverdue: overdueProjects.length > 0,
      overdueCount: overdueProjects.length
    };
  });

  const filteredStudios = studioStats.filter(({ studio }) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return studio.name.toLowerCase().includes(q) || (studio.ownerName || '').toLowerCase().includes(q) || (studio.phone || '').includes(q);
  }).sort((a, b) => {
    if (a.hasOverdue !== b.hasOverdue) {
      return a.hasOverdue ? -1 : 1;
    }
    return b.totalRem - a.totalRem;
  });

  const totalStudiosDue = studioStats.reduce((sum, s) => sum + s.totalRem, 0);
  const totalOverdueStudiosCount = studioStats.filter(s => s.hasOverdue).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-charcoal-900/90 p-5 rounded-3xl border border-emerald-500/20 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" /> Studio Dues & Collection Directory
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage partner studio balances, record advances, and trigger instant WhatsApp payment reminders.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {totalOverdueStudiosCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-mono text-amber-300 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{totalOverdueStudiosCount} Studios Overdue</span>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-charcoal-950 border border-white/10 text-xs font-mono text-gray-300">
            Total Due: <strong className="text-amber-400">₹{totalStudiosDue.toLocaleString('en-IN')}</strong>
          </div>
          <button
            onClick={() => onOpenRecordModal('studio')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-charcoal-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Studio Payment</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      {studios.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search studio name, owner, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Studio Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudios.map(({ studio, studioProjects, totalContract, totalAdv, totalRem, collectedPct, hasOverdue, overdueCount }) => {
          return (
            <motion.div 
              key={studio.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              className={`p-5 rounded-3xl shadow-xl space-y-4 relative overflow-hidden group transition-all border ${
                hasOverdue 
                  ? 'bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-amber-950/20 border-amber-500/40 hover:border-amber-400' 
                  : 'bg-charcoal-900/90 border-luxury-green-800/30 hover:border-gold-500/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
                    {studio.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm leading-tight">{studio.name}</h4>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{studio.ownerName || 'Partner Studio'} {studio.phone ? `• ${studio.phone}` : ''}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  {hasOverdue ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                      <span>{overdueCount} Overdue</span>
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                      totalRem > 0 ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {totalRem > 0 ? `₹${Math.round(totalRem/1000)}k Due` : 'Fully Settled'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-charcoal-950/80 border border-white/5 text-center font-mono">
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block">Projects</span>
                  <span className="text-xs font-bold text-white">{studioProjects.length}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block">Collected</span>
                  <span className="text-xs font-bold text-emerald-400">₹{totalAdv.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block">Balance Due</span>
                  <span className={`text-xs font-bold ${hasOverdue ? 'text-amber-400' : 'text-amber-300'}`}>
                    ₹{totalRem.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span>Collection Progress</span>
                  <span className="text-emerald-400 font-bold">{collectedPct}%</span>
                </div>
                <div className="w-full bg-charcoal-950 h-2 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, collectedPct)}%` }} 
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2 border-t border-white/5">
                <button
                  onClick={() => onOpenRecordModal('studio', undefined, studio.id)}
                  className="flex-1 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>

                <button
                  onClick={() => {
                    const phoneClean = (studio.phone || '').replace(/[^0-9]/g, '');
                    const msg = `*PAYMENT SUMMARY & FOLLOW-UP* 🎬\n\n` +
                      `Namaste ${studio.ownerName || studio.name} ji,\n\n` +
                      `Greetings from The Frame Cut Studio!\n\n` +
                      `Here is your partner account summary:\n` +
                      `- Total Wedding Projects: ${studioProjects.length}\n` +
                      `- Total Contract Value: ₹${totalContract.toLocaleString('en-IN')}\n` +
                      `- Total Advance Received: ₹${totalAdv.toLocaleString('en-IN')}\n` +
                      `- Outstanding Balance Due: ₹${totalRem.toLocaleString('en-IN')}\n` +
                      (hasOverdue ? `\n⚠️ *Action Needed: ${overdueCount} project(s) have overdue payment balances.*\n` : '') +
                      `\nPlease arrange the remaining payment at your convenience. Thank you!\n` +
                      `The Frame Cut Studio OS`;
                    const targetPhone = phoneClean ? (phoneClean.length === 10 ? '91' + phoneClean : phoneClean) : '';
                    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 shadow ${
                    hasOverdue 
                      ? 'bg-amber-500 hover:bg-amber-400 text-charcoal-950' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                  title="Send WhatsApp Payment Follow-up"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {hasOverdue && <span>Follow Up</span>}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
