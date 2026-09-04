import React from 'react';
import { 
  IndianRupee, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  Sparkles, 
  CreditCard, 
  DollarSign, 
  AlertTriangle 
} from 'lucide-react';
import { motion } from 'motion/react';

export interface LedgerMetrics {
  totalReceived: number;
  totalPaidOut: number;
  netBalance: number;
  totalProjectContractValue: number;
  totalOutstandingBalance: number;
  totalEditorFeesAllocated: number;
  pendingEditorPayoutBalance: number;
  collectedPct: number;
  count: number;
  overdueCount?: number;
  totalOverdueAmount?: number;
}

interface LedgerKpiCardsProps {
  metrics: LedgerMetrics;
}

export default function LedgerKpiCards({ metrics }: LedgerKpiCardsProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.35, ease: 'easeOut' }
    }
  };

  const hasOverdue = (metrics.overdueCount || 0) > 0;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
    >
      {/* Card 1: TOTAL OUTSTANDING BALANCE */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ y: -3, scale: 1.01 }}
        className={`p-5 rounded-3xl border shadow-xl relative overflow-hidden group transition-all ${
          hasOverdue 
            ? 'bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-amber-950/50 border-amber-500/50 hover:border-amber-400/80 shadow-amber-950/20' 
            : 'bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-amber-950/40 border-amber-500/40 hover:shadow-amber-500/10'
        }`}
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-amber-300 font-extrabold tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" /> Outstanding Due
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold shadow-inner">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-sans text-amber-300 tracking-tight">
              ₹{metrics.totalOutstandingBalance.toLocaleString('en-IN')}
            </span>
            {hasOverdue ? (
              <span className="text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-500/50 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                {metrics.overdueCount} Overdue
              </span>
            ) : (
              <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                Receivable
              </span>
            )}
          </div>
          <div className="w-full bg-charcoal-950/80 h-1.5 rounded-full overflow-hidden border border-white/10 mt-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, metrics.collectedPct)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full"
            />
          </div>
          <p className="text-[10px] text-gray-400 font-mono pt-0.5 flex justify-between">
            <span>Collected: ₹{metrics.totalReceived.toLocaleString('en-IN')}</span>
            <span className="text-emerald-400 font-bold">{metrics.collectedPct}% In</span>
          </p>
        </div>
      </motion.div>

      {/* Card 2: Total Received / Studio Collections */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ y: -3, scale: 1.01 }}
        className="p-5 rounded-3xl bg-charcoal-900/90 border border-emerald-500/20 shadow-lg relative overflow-hidden group transition-shadow hover:shadow-emerald-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4" /> Studio Collections
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold font-sans text-white tracking-tight">
            ₹{metrics.totalReceived.toLocaleString('en-IN')}
          </span>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">
            Advances & milestones received
          </p>
        </div>
      </motion.div>

      {/* Card 3: Total Paid Out */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ y: -3, scale: 1.01 }}
        className="p-5 rounded-3xl bg-charcoal-900/90 border border-rose-500/20 shadow-lg relative overflow-hidden group transition-shadow hover:shadow-rose-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-rose-400 font-semibold tracking-wider flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4" /> Payouts & Expenses
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold font-sans text-white tracking-tight">
            ₹{metrics.totalPaidOut.toLocaleString('en-IN')}
          </span>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">
            Editor fees & operating costs
          </p>
        </div>
      </motion.div>

      {/* Card 4: Net Cash Balance */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ y: -3, scale: 1.01 }}
        className="p-5 rounded-3xl bg-charcoal-900/90 border border-gold-500/30 shadow-lg relative overflow-hidden group transition-shadow hover:shadow-gold-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-gold-400 font-semibold tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Net Studio Balance
          </span>
          <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className={`text-2xl font-bold font-sans tracking-tight ${metrics.netBalance >= 0 ? 'text-gold-300' : 'text-rose-400'}`}>
            ₹{metrics.netBalance.toLocaleString('en-IN')}
          </span>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">
            Current net operating cashflow
          </p>
        </div>
      </motion.div>

      {/* Card 5: Pending Editor Payable */}
      <motion.div 
        variants={cardVariants}
        whileHover={{ y: -3, scale: 1.01 }}
        className="p-5 rounded-3xl bg-charcoal-900/90 border border-blue-500/20 shadow-lg relative overflow-hidden group col-span-1 sm:col-span-2 lg:col-span-1 transition-shadow hover:shadow-blue-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-blue-400 font-semibold tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" /> Unpaid Editor Fees
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold font-sans text-white tracking-tight">
            ₹{metrics.pendingEditorPayoutBalance.toLocaleString('en-IN')}
          </span>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">
            Allocated fees awaiting payout
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
