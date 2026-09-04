import React from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  IndianRupee, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Studio, Project, PaymentHistory } from '../../types';

interface StudiosHeaderKpiProps {
  studios: Studio[];
  projects: Project[];
  payments: PaymentHistory[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export const StudiosHeaderKpi: React.FC<StudiosHeaderKpiProps> = ({
  studios,
  projects,
  payments,
  activeFilter,
  setActiveFilter
}) => {
  // Aggregate Financials & Pipeline
  const totalStudios = studios.length;

  const totalContractVolume = projects.reduce((sum, p) => sum + (Number(p.projectAmount) || 0), 0);

  // Total collected from studios
  const studioPayments = payments.filter(pay => pay.entityType === 'studio');
  const totalPaidFromPayments = studioPayments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  
  const projectAdvancesNotLogged = projects.reduce((sum, p) => {
    if (!p.studioId) return sum;
    const hasDoc = payments.some(pay => pay.projectId === p.id && pay.entityType === 'studio');
    return hasDoc ? sum : sum + (Number(p.advancePayment) || 0);
  }, 0);

  const totalReceived = totalPaidFromPayments + projectAdvancesNotLogged;
  const totalOutstanding = Math.max(0, totalContractVolume - totalReceived);

  // Active projects currently in pipeline
  const activeProjectsCount = projects.filter(p => 
    p.studioId && !['delivered', 'closed'].includes(p.status)
  ).length;

  // Studios with balance due
  const studiosWithDue = studios.filter(s => {
    const sProjects = projects.filter(p => p.studioId === s.id);
    const sBilling = sProjects.reduce((sum, p) => sum + (Number(p.projectAmount) || 0), 0);
    const sPays = payments.filter(pay => pay.entityId === s.id && pay.entityType === 'studio');
    const sPaidFromDocs = sPays.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
    const sAdvances = sProjects.reduce((sum, p) => {
      const hasDoc = payments.some(pay => pay.projectId === p.id && pay.entityType === 'studio');
      return hasDoc ? sum : sum + (Number(p.advancePayment) || 0);
    }, 0);
    return Math.max(0, sBilling - (sPaidFromDocs + sAdvances)) > 0;
  }).length;

  const collectionRate = totalContractVolume > 0 
    ? Math.round((totalReceived / totalContractVolume) * 100) 
    : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Studio Partners */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        onClick={() => setActiveFilter('all')}
        className={`p-5 rounded-3xl relative overflow-hidden cursor-pointer transition-all border backdrop-blur-xl group ${
          activeFilter === 'all'
            ? 'bg-gradient-to-br from-charcoal-900/90 via-charcoal-900/95 to-luxury-green-950/50 border-gold-500/40 shadow-lg shadow-gold-500/5'
            : 'bg-charcoal-950/70 hover:bg-charcoal-900/80 border-white/5 hover:border-gold-500/20'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gold-400" />
              Partner Studios
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-white group-hover:text-gold-300 transition-colors">
                {totalStudios}
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                {totalStudios > 0 ? '100% Active' : '0'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-400">
          <span>Active In Pipeline</span>
          <span className="text-white font-bold">{activeProjectsCount} Projects</span>
        </div>
      </motion.div>

      {/* 2. Lifetime Contract Volume */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="p-5 rounded-3xl relative overflow-hidden bg-charcoal-950/70 border border-white/5 backdrop-blur-xl group hover:border-emerald-500/20 transition-all"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Total Studio Billing
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-white">
                ₹{(totalContractVolume / 100000).toFixed(2)}L
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                (₹{totalContractVolume.toLocaleString('en-IN')})
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-400">
          <span>Settled Clearance</span>
          <span className="text-emerald-400 font-bold">{collectionRate}% Paid</span>
        </div>
      </motion.div>

      {/* 3. Received Advances / Paid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        onClick={() => setActiveFilter('settled')}
        className={`p-5 rounded-3xl relative overflow-hidden cursor-pointer transition-all border backdrop-blur-xl group ${
          activeFilter === 'settled'
            ? 'bg-gradient-to-br from-charcoal-900/90 via-charcoal-900/95 to-emerald-950/40 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
            : 'bg-charcoal-950/70 hover:bg-charcoal-900/80 border-white/5 hover:border-emerald-500/20'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Received / Paid
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-emerald-400">
                ₹{(totalReceived / 100000).toFixed(2)}L
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                (₹{totalReceived.toLocaleString('en-IN')})
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="w-full h-1.5 bg-charcoal-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, collectionRate)}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* 4. Total Outstanding Due Balance */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        onClick={() => setActiveFilter('outstanding')}
        className={`p-5 rounded-3xl relative overflow-hidden cursor-pointer transition-all border backdrop-blur-xl group ${
          activeFilter === 'outstanding'
            ? 'bg-gradient-to-br from-charcoal-900/90 via-charcoal-900/95 to-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-500/10'
            : 'bg-charcoal-950/70 hover:bg-charcoal-900/80 border-white/5 hover:border-rose-500/20'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Outstanding Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-display ${totalOutstanding > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ₹{totalOutstanding.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            totalOutstanding > 0 
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400' 
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
          }`}>
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
          <span className="text-gray-400">Studios With Due</span>
          <span className={studiosWithDue > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
            {studiosWithDue > 0 ? `${studiosWithDue} Studios Pending` : 'All Clear ✓'}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
