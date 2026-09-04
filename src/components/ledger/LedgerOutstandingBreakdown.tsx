import React, { useState } from 'react';
import { 
  Clock, 
  ChevronDown, 
  MessageCircle, 
  Search, 
  IndianRupee,
  CheckCircle2, 
  X,
  AlertTriangle,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Studio, PaymentHistory } from '../../types';
import { getPaymentOrProjectOverdueInfo } from './LedgerMasterTable';

interface LedgerOutstandingBreakdownProps {
  projects: Project[];
  studios: Studio[];
  payments: PaymentHistory[];
  totalOutstandingBalance: number;
}

export default function LedgerOutstandingBreakdown({
  projects,
  studios,
  payments,
  totalOutstandingBalance
}: LedgerOutstandingBreakdownProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  // Calculate project breakdown items
  const items = projects.map(p => {
    const pPayments = payments.filter(pay => pay.projectId === p.id && pay.entityType === 'studio');
    const loggedReceived = pPayments.reduce((s, pay) => s + (Number(pay.amount) || 0), 0);
    const advPaid = Number(p.advancePayment) || 0;
    const totalReceived = pPayments.length > 0 ? loggedReceived : advPaid;
    const contractAmt = Number(p.projectAmount) || 0;
    const remBal = Math.max(0, contractAmt - totalReceived);
    const overdueInfo = getPaymentOrProjectOverdueInfo(p);
    const isOverdue = overdueInfo.isOverdue && remBal > 0;

    return { 
      p, 
      contractAmt, 
      totalReceived, 
      advPaid: totalReceived, 
      remBal,
      isOverdue,
      daysOverdue: overdueInfo.daysOverdue,
      dueDateStr: overdueInfo.dueDateStr,
      overdueReason: overdueInfo.reason
    };
  }).filter(item => item.remBal > 0);

  const overdueCount = items.filter(item => item.isOverdue).length;

  const filteredItems = items.filter(({ p, isOverdue }) => {
    if (showOverdueOnly && !isOverdue) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchName = (p.coupleName || p.projectName || '').toLowerCase().includes(q);
    const matchStudio = (p.studioName || '').toLowerCase().includes(q);
    const matchEvent = (p.eventType || '').toLowerCase().includes(q);
    return matchName || matchStudio || matchEvent;
  }).sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) {
      return a.isOverdue ? -1 : 1;
    }
    return b.remBal - a.remBal;
  });

  return (
    <div className="bg-gradient-to-r from-charcoal-900 via-charcoal-900/95 to-amber-950/30 border border-amber-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2 flex-wrap">
              <span>Project-Wise Uncollected Balance Breakdown</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {items.length} Pending • Total: ₹{totalOutstandingBalance.toLocaleString('en-IN')}
              </span>
              {overdueCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
                  {overdueCount} Overdue Follow-ups
                </span>
              )}
            </h3>
            <p className="text-[11px] text-gray-400">
              Detailed breakdown of active wedding projects with pending partner studio balances and overdue follow-up alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {overdueCount > 0 && (
            <button
              onClick={() => setShowOverdueOnly(!showOverdueOnly)}
              className={`text-xs font-mono px-3 py-1.5 rounded-xl border cursor-pointer transition-all flex items-center gap-1 ${
                showOverdueOnly
                  ? 'bg-amber-500 text-charcoal-950 font-bold border-amber-400'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{showOverdueOnly ? 'Show All Pending' : `Overdue Only (${overdueCount})`}</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 cursor-pointer transition-all"
          >
            <span>{isOpen ? 'Hide Breakdown' : `Show (${items.length}) Pending`}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-1"
          >
            {/* Quick search inside uncollected list */}
            {items.length > 4 && (
              <div className="relative max-w-xs">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter pending projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-charcoal-950/90 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredItems.map(({ p, contractAmt, advPaid, remBal, isOverdue, daysOverdue, dueDateStr, overdueReason }) => {
                  const remPct = contractAmt > 0 ? Math.round((remBal / contractAmt) * 100) : 0;
                  const studioObj = studios.find(s => s.id === p.studioId || s.name.toLowerCase() === p.studioName?.toLowerCase());

                  return (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.01 }}
                      className={`rounded-2xl p-3.5 space-y-2 transition-all border ${
                        isOverdue 
                          ? 'bg-gradient-to-br from-charcoal-950 via-charcoal-950 to-amber-950/30 border-amber-500/50 hover:border-amber-400 shadow-lg shadow-amber-950/30' 
                          : 'bg-charcoal-950/80 border-amber-500/20 hover:border-amber-400/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="pr-2">
                          <h4 className="font-bold text-white text-xs tracking-wide flex items-center gap-1.5 flex-wrap">
                            <span>{p.coupleName || p.projectName}</span>
                          </h4>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {p.studioName || 'Direct Studio'} • {p.eventType || 'Wedding'}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          {isOverdue ? (
                            <span 
                              className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold border border-amber-500/40 flex items-center gap-1 shadow-sm"
                              title={overdueReason}
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                              <span>Overdue ({daysOverdue}d)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30 whitespace-nowrap">
                              {remPct}% Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-baseline font-mono pt-1 text-xs">
                        <span className="text-gray-400 text-[11px]">
                          {isOverdue ? 'Overdue Due Balance:' : 'Outstanding Due:'}
                        </span>
                        <span className="text-amber-300 font-black text-sm">₹{remBal.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="w-full bg-charcoal-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverdue ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, 100 - remPct))}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 pt-1 border-t border-white/5">
                        <span>Total: ₹{contractAmt.toLocaleString('en-IN')}</span>
                        {studioObj ? (
                          <button
                            onClick={() => {
                              const phoneClean = (studioObj.phone || '').replace(/[^0-9]/g, '');
                              const msg = `*PAYMENT REMINDER NOTICE* 🎬\n\n` +
                                `Namaste ${studioObj.ownerName || studioObj.name} ji,\n\n` +
                                `Greetings from The Frame Cut Studio!\n\n` +
                                `Payment reminder for wedding project: *${p.coupleName || p.projectName}*\n` +
                                `- Contract Value: ₹${contractAmt.toLocaleString('en-IN')}\n` +
                                `- Advance/Paid: ₹${advPaid.toLocaleString('en-IN')}\n` +
                                `- Outstanding Balance: ₹${remBal.toLocaleString('en-IN')}\n` +
                                (isOverdue && daysOverdue ? `- Status: ⚠️ OVERDUE BY ${daysOverdue} DAY(S)\n` : '') +
                                (dueDateStr ? `- Agreed Due Date: ${dueDateStr}\n` : '') +
                                `\nPlease process the remaining balance at your convenience. Thank you!`;
                              const targetPhone = phoneClean ? (phoneClean.length === 10 ? '91' + phoneClean : phoneClean) : '';
                              window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className={`font-bold flex items-center gap-1 hover:underline cursor-pointer transition-colors ${
                              isOverdue ? 'text-amber-300 hover:text-amber-200' : 'text-emerald-400 hover:text-emerald-300'
                            }`}
                          >
                            <MessageCircle className="w-3 h-3" /> 
                            <span>{isOverdue ? 'Priority WhatsApp Follow-Up' : 'WhatsApp Reminder'}</span>
                          </button>
                        ) : (
                          <span className="text-gray-500">No Phone Attached</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-400 font-mono bg-charcoal-950/40 rounded-2xl border border-dashed border-white/5 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {showOverdueOnly 
                    ? 'No overdue projects found! All pending projects are within deadline schedule.' 
                    : 'All active wedding projects are fully paid up! Zero outstanding balance.'}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
